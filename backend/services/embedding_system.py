import logging
import os
import hashlib
import json
from typing import List, Optional, Dict
from functools import lru_cache
from sentence_transformers import SentenceTransformer
import numpy as np
import redis

# Configuración del logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Configuración de Caché ---
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
EMBEDDING_CACHE_TTL = 60 * 60 * 24 * 7  # 7 días de caché en Redis
LRU_CACHE_SIZE = 500  # Número máximo de embeddings en caché LRU en memoria


class AdvancedEmbeddingSystem:
    """
    Servicio para generar embeddings de texto utilizando modelos de Sentence Transformers.
    
    Responsabilidades:
    - Cargar un modelo pre-entrenado de embeddings.
    - Convertir listas de textos (chunks) en vectores numéricos (embeddings).
    - Cachear embeddings en Redis para evitar cálculos repetidos.
    - Optimizar el proceso mediante batch processing y normalización.
    """
    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        """
        Inicializa el sistema de embeddings cargando el modelo especificado.
        
        Args:
            model_name (str): El nombre del modelo de Sentence Transformers a utilizar.
                              'all-MiniLM-L6-v2' es un modelo excelente por su balance
                              entre rendimiento y calidad.
        """
        try:
            logger.info(f"Cargando el modelo de embeddings: '{model_name}'...")
            self.model = SentenceTransformer(model_name, device='cpu')
            self.model_name = model_name
            logger.info("Modelo de embeddings cargado exitosamente.")
            
            # Caché LRU en memoria (siempre disponible)
            self._lru_cache: Dict[str, List[float]] = {}
            self._lru_keys: List[str] = []  # Mantener orden de inserción para LRU
            
            # Inicializar conexión a Redis para caché persistente
            try:
                self.redis_client = redis.from_url(REDIS_URL)
                self.redis_client.ping()  # Verificar conexión
                self.redis_enabled = True
                logger.info("Caché de embeddings en Redis habilitado.")
            except Exception as e:
                logger.warning(f"Redis no disponible, usando solo caché LRU en memoria: {e}")
                self.redis_client = None
                self.redis_enabled = False
                
        except Exception as e:
            logger.error(f"Error al cargar el modelo de embeddings '{model_name}': {e}")
            raise

    def _get_cache_key(self, text: str) -> str:
        """Genera una clave única para cachear el embedding de un texto."""
        # Usar hash del texto + nombre del modelo para la clave
        text_hash = hashlib.sha256(text.encode('utf-8')).hexdigest()[:16]
        return f"emb:{self.model_name}:{text_hash}"

    def _lru_get(self, key: str) -> Optional[List[float]]:
        """Obtener embedding de caché LRU en memoria."""
        if key in self._lru_cache:
            # Mover a final de lista (más recientemente usado)
            if key in self._lru_keys:
                self._lru_keys.remove(key)
            self._lru_keys.append(key)
            return self._lru_cache[key]
        return None

    def _lru_set(self, key: str, embedding: List[float]) -> None:
        """Guardar embedding en caché LRU en memoria."""
        if key not in self._lru_cache:
            # Evictar si llegamos al límite
            if len(self._lru_keys) >= LRU_CACHE_SIZE:
                oldest_key = self._lru_keys.pop(0)
                del self._lru_cache[oldest_key]
            self._lru_keys.append(key)
        self._lru_cache[key] = embedding

    def _get_cached_embedding(self, text: str) -> Optional[List[float]]:
        """
        Intenta recuperar un embedding cacheado.
        Orden de búsqueda: LRU en memoria -> Redis.
        """
        cache_key = self._get_cache_key(text)
        
        # 1. Buscar en caché LRU (más rápido)
        cached = self._lru_get(cache_key)
        if cached is not None:
            return cached
        
        # 2. Buscar en Redis si está disponible
        if self.redis_enabled:
            try:
                redis_cached = self.redis_client.get(cache_key)
                if redis_cached:
                    embedding = json.loads(redis_cached)
                    # Promover a LRU para acceso más rápido
                    self._lru_set(cache_key, embedding)
                    return embedding
            except Exception as e:
                logger.debug(f"Error al leer caché Redis: {e}")
        
        return None

    def _cache_embedding(self, text: str, embedding: List[float]) -> None:
        """
        Guarda un embedding en ambas capas de caché.
        """
        cache_key = self._get_cache_key(text)
        
        # 1. Guardar en LRU (siempre disponible)
        self._lru_set(cache_key, embedding)
        
        # 2. Guardar en Redis si está disponible
        if self.redis_enabled:
            try:
                self.redis_client.setex(
                    cache_key,
                    EMBEDDING_CACHE_TTL,
                    json.dumps(embedding)
                )
            except Exception as e:
                logger.debug(f"Error al escribir en caché Redis: {e}")

    def create_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Genera embeddings para una lista de textos, usando caché cuando es posible.
        
        Args:
            texts (List[str]): Una lista de fragmentos de texto para convertir.
            
        Returns:
            List[List[float]]: Una lista de vectores de embedding.
        """
        if not texts or not all(isinstance(t, str) for t in texts):
            logger.warning("La lista de textos está vacía o contiene elementos no válidos.")
            return []
        
        results = [None] * len(texts)
        texts_to_compute = []
        indices_to_compute = []
        cache_hits = 0
        
        # Fase 1: Verificar caché para cada texto
        for i, text in enumerate(texts):
            cached = self._get_cached_embedding(text)
            if cached is not None:
                results[i] = cached
                cache_hits += 1
            else:
                texts_to_compute.append(text)
                indices_to_compute.append(i)
        
        if cache_hits > 0:
            logger.info(f"Caché: {cache_hits}/{len(texts)} embeddings recuperados de caché.")
        
        # Fase 2: Calcular embeddings faltantes
        if texts_to_compute:
            logger.info(f"Generando {len(texts_to_compute)} embeddings nuevos...")
            new_embeddings = self.model.encode(
                texts_to_compute, 
                show_progress_bar=len(texts_to_compute) > 10,
                normalize_embeddings=True 
            ).tolist()
            
            # Guardar en caché y en resultados
            for idx, embedding in zip(indices_to_compute, new_embeddings):
                results[idx] = embedding
                self._cache_embedding(texts[idx], embedding)
            
            logger.info(f"Embeddings generados y cacheados exitosamente.")
        
        return results
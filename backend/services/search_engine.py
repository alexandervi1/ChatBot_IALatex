"""
Search Engine Module.
Core search and AI generation functionality.

This module provides:
- Hybrid search (semantic + keyword)
- Re-ranking with CrossEncoder
- AI answer generation with Gemini
- Copilot assistance for LaTeX

Following Clean Code principles:
- Configuration from centralized config.py
- Meaningful method names
- Single responsibility per method
"""
import os
import re
import logging
from typing import List, Dict, Any, Generator, Optional, AsyncGenerator
from sentence_transformers import CrossEncoder
from sqlalchemy.orm import Session
from sqlalchemy import text
import google.generativeai as genai
import httpx
import json
import sys
from pathlib import Path
from duckduckgo_search import DDGS

from config import LLMConfig, SearchConfig
from services.ai_providers import ProviderFactory

# Add utils directory to path for TOON encoder
utils_path = Path(__file__).parent.parent / "utils"
sys.path.insert(0, str(utils_path))
from toon_encoder import to_toon

logger = logging.getLogger(__name__)

# Gemini model configured per-request with user's API key
gemini_model = None


_CITATION_PROMPT_TEMPLATE = """
Eres un asistente académico experto en la creación de citas bibliográficas. Tu tarea es generar una cita en el formato solicitado por el usuario, utilizando la información disponible en el CONTEXTO.

---INSTRUCCIONES IMPORTANTES---
1.  **Extrae la Información:** Busca en el CONTEXTO los datos necesarios: autor(es), año de publicación, título del trabajo, nombre de la revista o editorial, etc.
2.  **Formatea la Cita:** Construye la cita ESTRICTAMENTE en el formato solicitado en la INSTRUCCIÓN.
3.  **Maneja Información Faltante:** Si no encuentras toda la información necesaria en el CONTEXTO, genera la cita con los datos que tengas y añade una nota al final indicando qué falta. Ejemplo: `[NOTA: No se encontró el año de publicación en el texto.]`.
4.  **Salida Directa:** Tu respuesta debe ser ÚNICAMENTE la cita formateada y la nota (si es necesaria). No añadas explicaciones, saludos, ni la incluyas en bloques de markdown.

---EJEMPLOS DE FORMATOS---

**Formato APA 7ma Edición:**
Apellido, A. A. (Año). *Título del trabajo*. Editorial.
Apellido, A. A., Apellido, B. B., & Apellido, C. C. (Año). Título del artículo. *Nombre de la Revista*, *Volumen*(Número), páginas. https://doi.org/xxxx

**Formato IEEE:**
[1] A. A. Apellido, "Título del trabajo," en *Título de la Conferencia*, Ciudad, Estado, Año, pp. xxx-xxx.
[2] A. A. Apellido, "Título del artículo," *Abrev. Nombre de la Revista*, vol. x, no. x, pp. xxx-xxx, Mes Año.

---TAREA---

**CONTEXTO:**
"{context}"

**INSTRUCCIÓN DEL USUARIO:**
"{instruction}"

**CITA GENERADA:**
"""


class SearchEngine:
    """
    Hybrid search engine with AI-powered answer generation.
    
    Combines semantic vector search with keyword search,
    uses CrossEncoder for re-ranking, and generates answers
    using Google's Gemini API.
    
    Attributes:
        reranker: CrossEncoder model for result re-ranking
    """
    
    def __init__(self):
        """Initialize the search engine with re-ranking model."""
        try:
            self.reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
            logger.info("Modelo de re-ranking cargado exitosamente.")
        except Exception as e:
            logger.error(f"Error al cargar el modelo de re-ranking: {e}", exc_info=True)
            self.reranker = None

    def _highlight_relevant_sentences(self, answer: str, context: str) -> str:
        # Resalta las oraciones del contexto que son relevantes para la respuesta generada
        # Ayuda al usuario a ver de donde proviene la informacion
        highlighted_context_parts = []
        context_sentences = re.split(r'(?<=[.!?])\s+', context)
        answer_words = set(word.lower() for word in re.findall(r'\b\w{4,}\b', answer))

        for sentence in context_sentences:
            sentence_words = set(word.lower() for word in re.findall(r'\b\w{4,}\b', sentence))
            if answer_words and len(sentence_words.intersection(answer_words)) / len(answer_words) > 0.4:
                highlighted_context_parts.append(f"<strong>{sentence.strip()}</strong>")
            else:
                highlighted_context_parts.append(sentence.strip())
        return " ".join(highlighted_context_parts)

    def _search_image(self, query: str) -> tuple[str | None, str]:
        """
        Search for an educational/reliable image.
        Returns tuple of (image_url, source_name) or (None, "")
        Prioritizes: Wikipedia, Wikimedia Commons, educational sources.
        """
        try:
            # Add educational/reliable source keywords to improve results
            enhanced_query = f"{query} diagram wikipedia OR wikimedia OR educational"
            
            with DDGS() as ddgs:
                # Get several results to filter for quality
                results = list(ddgs.images(
                    enhanced_query, 
                    max_results=5,
                    safesearch='moderate'
                ))
                
                if results:
                    # Prioritize reliable sources
                    reliable_domains = ['wikipedia.org', 'wikimedia.org', 'edu', 'researchgate.net', 'nature.com', 'sciencedirect.com']
                    
                    for result in results:
                        url = result.get('image', '')
                        source = result.get('source', '')
                        
                        # Check if from reliable source
                        for domain in reliable_domains:
                            if domain in url or domain in source:
                                return (url, source.split('/')[2] if '/' in source else 'Fuente confiable')
                    
                    # If no reliable source found, use first result
                    return (results[0]['image'], 'Imagen ilustrativa')
                    
        except Exception as e:
            logger.error(f"Error searching image for '{query}': {e}")
        return (None, "")

    def _semantic_search(self, db: Session, query_embedding: List[float], top_k: int, owner_id: int, source_files: List[str] | None) -> List[Dict[str, Any]]:
        params = {"query_embedding": str(query_embedding), "top_k": top_k, "owner_id": owner_id}
        
        where_clauses = ["owner_id = :owner_id"]
        if source_files:
            where_clauses.append("chunk_metadata->>'source_file' = ANY(:source_files)")
            params["source_files"] = source_files

        query = text(f"""
            SELECT id, content, chunk_metadata, 1 - (embedding <=> CAST(:query_embedding AS vector)) AS similarity
            FROM documents
            WHERE {" AND ".join(where_clauses)}
            ORDER BY similarity DESC
            LIMIT :top_k
        """)
        results = db.execute(query, params)
        return [dict(row._mapping) for row in results]

    def _keyword_search(self, db: Session, query: str, top_k: int, owner_id: int, source_files: List[str] | None) -> List[Dict[str, Any]]:
        formatted_query = ' | '.join(re.sub(r'[¿?¡!.,;:]', '', query).split())
        params = {"query_formatted": formatted_query, "top_k": top_k, "owner_id": owner_id}
        
        where_clauses = ["search_vector @@ to_tsquery('spanish', :query_formatted)", "owner_id = :owner_id"]
        if source_files:
            where_clauses.append("chunk_metadata->>'source_file' = ANY(:source_files)")
            params["source_files"] = source_files

        keyword_query = text(f"""
            SELECT id, content, chunk_metadata, ts_rank_cd(search_vector, to_tsquery('spanish', :query_formatted)) AS rank
            FROM documents
            WHERE {" AND ".join(where_clauses)}
            ORDER BY rank DESC
            LIMIT :top_k
        """)
        results = db.execute(keyword_query, params)
        return [dict(row._mapping) for row in results]

    def hybrid_search(self, db: Session, query_embedding: List[float], query_text: str, top_k: int, owner_id: int, source_files: List[str] | None = None) -> List[Dict[str, Any]]:
        # Combina busqueda semantica (vectores) y busqueda por palabras clave (texto completo)
        # Utiliza un re-ranker para ordenar los resultados por relevancia final
        semantic_results = self._semantic_search(db, query_embedding, top_k, owner_id, source_files)
        keyword_results = self._keyword_search(db, query_text, top_k, owner_id, source_files)

        combined_results_map = {res['id']: res for res in semantic_results}
        for res in keyword_results:
            if res['id'] not in combined_results_map:
                combined_results_map[res['id']] = res
        
        combined_results = list(combined_results_map.values())
        if not combined_results: return []

        if self.reranker:
            features = [(query_text, res['content']) for res in combined_results]
            rerank_scores = self.reranker.predict(features)
            for res, score in zip(combined_results, rerank_scores):
                res['rerank_score'] = score
            final_results = sorted(combined_results, key=lambda x: x['rerank_score'], reverse=True)
        else:
            final_results = combined_results

        return final_results[:top_k]

    async def _generate_with_custom_key(self, api_key: str, prompt: str, temperature: float, on_token_usage: Any = None) -> Any:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        data = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": temperature}
        }
        
        async with httpx.AsyncClient() as client:
            try:
                async with client.stream("POST", url, headers=headers, json=data, timeout=60) as response:
                    logger.info(f"Gemini API Response Status: {response.status_code}")
                    if response.status_code != 200:
                        error_text = await response.aread()
                        logger.error(f"Error Gemini API Custom Key: {response.status_code} - {error_text}")
                        yield "Error al conectar con la API de Gemini (Clave Personal)."
                        return

                    buffer = ""
                    depth = 0
                    in_string = False
                    escape = False
                    
                    async for chunk in response.aiter_bytes():
                        try:
                            text_chunk = chunk.decode("utf-8")
                        except UnicodeDecodeError:
                            continue # Skip incomplete bytes or handle better if needed

                        for char in text_chunk:
                            buffer += char
                            
                            if not in_string:
                                if char == '{':
                                    depth += 1
                                elif char == '}':
                                    depth -= 1
                                    if depth == 0:
                                        # Attempt to parse the accumulated object
                                        try:
                                            # Find the start of the object (first '{')
                                            start_index = buffer.find('{')
                                            if start_index != -1:
                                                json_str = buffer[start_index:]
                                                chunk_data = json.loads(json_str)
                                                
                                                # Handle candidates
                                                if "candidates" in chunk_data:
                                                    for candidate in chunk_data["candidates"]:
                                                        if "content" in candidate and "parts" in candidate["content"]:
                                                            for part in candidate["content"]["parts"]:
                                                                if "text" in part:
                                                                    yield part["text"]
                                                
                                                # Handle usage metadata
                                                if "usageMetadata" in chunk_data and on_token_usage:
                                                    total_tokens = chunk_data["usageMetadata"].get("totalTokenCount", 0)
                                                    if total_tokens > 0:
                                                        await on_token_usage(total_tokens)
                                            
                                            # Reset buffer after successful parse
                                            buffer = ""
                                        except json.JSONDecodeError:
                                            # Malformed or incomplete, keep accumulating (though depth=0 suggests complete)
                                            pass
                                elif char == '"':
                                    in_string = True
                            else:
                                if escape:
                                    escape = False
                                elif char == '\\':
                                    escape = True
                                elif char == '"':
                                    in_string = False
            except Exception as e:
                logger.error(f"Excepción en _generate_with_custom_key: {e}", exc_info=True)
                yield "Ocurrió un error de conexión."

    async def generate_answer(self, query: str, context: str, chat_history: str = "", api_key: str | None = None, provider: str = "gemini", model: str | None = None, on_token_usage: Any = None) -> Any:
        # Prepare data in TOON format for token efficiency
        prompt_data = {
            "task": "answer_question",
            "query": query,
            "context": context
        }
        
        # Add chat history if exists (will be formatted as table in TOON)
        if chat_history:
            # Parse chat history into structured format
            history_lines = chat_history.strip().split('\n')
            chat_messages = []
            for line in history_lines:
                if line.startswith("Usuario:"):
                    chat_messages.append({"role": "user", "content": line.replace("Usuario:", "").strip()})
                elif line.startswith("IA:"):
                    chat_messages.append({"role": "ai", "content": line.replace("IA:", "").strip()})
            
            if chat_messages:
                prompt_data["chat_history"] = chat_messages
        
        # Convert to TOON format
        toon_data = to_toon(prompt_data)
        
        # Create final prompt with TOON data and instructions
        final_prompt = f"""Analiza los siguientes datos en formato TOON y responde la pregunta.

=== DATOS (TOON FORMAT) ===
{toon_data}

=== INSTRUCCIONES ===
- Responde basándote ÚNICAMENTE en el contexto proporcionado
- Si la información no está en el contexto, indícalo claramente
- Responde en español de forma clara y concisa
- Usa formato Markdown para estructurar: tablas, listas, negritas
- Incluye citas bibliográficas cuando sea relevante
- Si hay historial de chat, considera el contexto de la conversación
- IMÁGENES: Solo si el concepto se entiende MUCHO mejor con un diagrama visual (ej: ciclos, procesos, estructuras anatómicas, diagramas de flujo), añade AL FINAL esta línea exacta: [IMG_SEARCH: termino_corto_en_ingles]. Ejemplo: [IMG_SEARCH: photosynthesis diagram]. NO uses esta función para conceptos abstractos o textuales.

RESPUESTA:"""


        if api_key:
            # Use the provider factory to get the appropriate AI provider
            ai_provider = ProviderFactory.get_provider(provider)
            full_response = ""
            
            # Stream response but track if we need to clean IMG_SEARCH marker
            async for chunk in ai_provider.generate_stream(final_prompt, api_key, 0.3, model, on_token_usage):
                full_response += chunk
                # Check if this chunk contains the IMG_SEARCH marker
                if '[IMG_SEARCH:' in chunk:
                    # Clean the marker from output
                    clean_chunk = re.sub(r'\[IMG_SEARCH: .*?\]', '', chunk)
                    if clean_chunk.strip():
                        yield clean_chunk
                else:
                    yield chunk
            
            # Search for image if model requested it (from full response)
            match = re.search(r'\[IMG_SEARCH: (.*?)\]', full_response)
            if match:
                term = match.group(1).strip()
                # Yield a professional loading message
                yield "\n\n---\n📷 *Buscando imagen ilustrativa...*\n"
                
                # Execute search (synchronous, but fast)
                image_url, source = self._search_image(term)
                if image_url:
                    yield f"\n![{term}]({image_url})\n*Fuente: {source}*"
                else:
                    yield "\n*No se encontró una imagen adecuada para ilustrar este concepto.*"
        else:
            yield "Por favor, configura tu API Key en el menú de configuración para continuar."
            return

    async def generate_copilot_answer(self, text: str, instruction: str, context: str, api_key: str | None = None, provider: str = "gemini", model: str | None = None, on_token_usage: Any = None, selected_files: List[str] | None = None) -> Any:
        CITATION_KEYWORDS = ["cita", "cite", "citation", "referencia", "reference", "apa", "ieee", "formato", "bibliografía"]
        is_citation_request = any(keyword in instruction.lower() for keyword in CITATION_KEYWORDS)

        if is_citation_request:
            final_prompt = _CITATION_PROMPT_TEMPLATE.format(context=context, instruction=instruction)
            temperature = 0.2 
        else:
            # Use TOON format for copilot prompts
            prompt_data = {
                "task": "latex_copilot",
                "current_text": text if text else "(empty)",
                "instruction": instruction,
                "context": context if context else "(no context)",
                "selected_documents": selected_files if selected_files else "(none)"
            }
            
            toon_data = to_toon(prompt_data)
            
            final_prompt = f"""Eres un asistente experto en LaTeX y análisis de documentos. Tu objetivo es ayudar al usuario a redactar documentos en LaTeX utilizando la información proporcionada.

=== DATOS (TOON FORMAT) ===
{toon_data}

=== INSTRUCCIONES ===
1. **Análisis de Contexto**: Utiliza la información en el campo 'context'. Este contexto contiene fragmentos de los documentos listados en 'selected_documents'. Si la instrucción pide resumir o analizar un documento específico, verifica que corresponda con los seleccionados.
2. **Generación de LaTeX**: Toda tu salida DEBE SER código LaTeX válido y listo para compilar.
3. **Modificación de Texto**: Si hay 'current_text', intégralo o modifícalo según la instrucción.
4. **Formato**:
   - NO incluyas bloques de markdown (```latex).
   - NO incluyas comentarios ni explicaciones fuera del código LaTeX.
   - Mantén el preámbulo y paquetes si estás editando un documento completo.
5. **Citas**: Si usas información del contexto, intenta citarla adecuadamente si el formato lo permite.

CÓDIGO LATEX:"""
            temperature = 0.5

        if api_key:
            # Use the provider factory to get the appropriate AI provider
            ai_provider = ProviderFactory.get_provider(provider)
            async for chunk in ai_provider.generate_stream(final_prompt, api_key, temperature, model, on_token_usage):
                yield chunk
        else:
            yield "Por favor, configura tu API Key para usar el Copiloto."
            return

    async def generate_suggested_questions(self, context: str, api_key: str | None = None) -> List[str]:
        prompt = f"""Analiza el siguiente texto y genera 3 preguntas cortas, interesantes y relevantes que un usuario podría hacer sobre este contenido.
        
        TEXTO:
        {context[:5000]}... (truncado)
        
        INSTRUCCIONES:
        - Genera EXACTAMENTE 3 preguntas.
        - Las preguntas deben ser en español.
        - Devuelve SOLO las preguntas, una por línea.
        - No enumeres las preguntas (sin 1., 2., -).
        """
        
        try:
            if api_key:
                 # Custom key implementation for non-streaming response (simplified)
                 # For now, we'll just use the default model logic or implement a simple http call if needed.
                 # Given the complexity, let's fallback to default model if custom key logic is complex to duplicate for non-stream
                 # Or better, use the same streaming endpoint but collect result.
                 pass 

            if not gemini_model: return []
            
            response = await gemini_model.generate_content_async(
                prompt,
                generation_config=genai.types.GenerationConfig(temperature=0.7)
            )
            
            questions = [line.strip() for line in response.text.split('\n') if line.strip()]
            return questions[:3]
            
        except Exception as e:
            logger.error(f"Error al generar preguntas sugeridas: {e}", exc_info=True)
            return []

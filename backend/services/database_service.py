from sqlalchemy.orm import Session
from database.models import Document
from typing import List, Dict, Any
import numpy as np
import logging
from sqlalchemy import func # Importar func

logger = logging.getLogger(__name__)

class DatabaseService:
    """
    Servicio para gestionar todas las interacciones con la base de datos.
    """

    def save_document_chunks(self, db: Session, chunks: List[Dict[str, Any]], embeddings: List[List[float]], owner_id: int):
        """
        Guarda los chunks de un documento y sus embeddings en la base de datos, asociándolos a un usuario.

        Args:
            db (Session): La sesión de la base de datos activa.
            chunks (List[Dict[str, Any]]): La lista de chunks procesados.
            embeddings (List[List[float]]): La lista de embeddings generados.
            owner_id (int): El ID del usuario propietario del documento.
        """
        if len(chunks) != len(embeddings):
            raise ValueError("La cantidad de chunks y embeddings no coincide.")

        logger.info(f"Iniciando el guardado de {len(chunks)} chunks para el usuario {owner_id}.")
        
        documents_to_add = []
        for chunk, embedding in zip(chunks, embeddings):
            new_document = Document(
                content=chunk['content'],
                chunk_metadata=chunk['metadata'],                
                embedding=np.array(embedding),
                search_vector=func.to_tsvector('spanish', chunk['content']),
                owner_id=owner_id  # Asociar el chunk al usuario
            )
            documents_to_add.append(new_document)
        
        try:
            db.add_all(documents_to_add)
            db.commit()
            logger.info(f"Chunks para el usuario {owner_id} guardados exitosamente.")
        except Exception as e:
            logger.error(f"Error al guardar en la base de datos: {e}")
            db.rollback() # Si algo falla, revertimos todos los cambios de esta transacción
            raise
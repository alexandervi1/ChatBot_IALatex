from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy import cast, String, func

from app import schemas
from database import models
from database.connection import get_db
from services import auth_service
from celery_worker import process_file_task  # Importar la tarea de Celery

import logging
import os

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/documents",
    tags=["Documentos"],
)

# --- Constantes de Validación ---
MAX_FILE_SIZE_MB = 250
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
ALLOWED_CONTENT_TYPES = [
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]

@router.post("/process-file", response_model=schemas.FileProcessResponse)
async def process_file_endpoint(file: UploadFile = File(...), current_user: models.User = Depends(auth_service.get_current_active_user)):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail=f"Error: Tipo de archivo no soportado. Permitidos: .pdf, .txt, .docx, .pptx")

    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail=f"Error: El archivo es demasiado grande. El tamaño máximo permitido es de {MAX_FILE_SIZE_MB} MB.")
    
    try:
        # Usar Celery para procesar el archivo en segundo plano
        # No es necesario codificar en base64, Celery puede manejar bytes directamente
        process_file_task.delay(file_content=file_content, filename=file.filename, owner_id=current_user.id)
        
        logger.info(f"Archivo '{file.filename}' (usuario: {current_user.email}) encolado para procesamiento con Celery.")
        return {"message": f"El archivo '{file.filename}' ha sido recibido y está siendo procesado.", "filename": file.filename}
    except Exception as e:
        logger.error(f"Error al encolar la tarea en Celery: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error al iniciar el procesamiento del archivo: {e}")



@router.get("/", response_model=List[schemas.DocumentMetadata])
async def list_documents(db: Session = Depends(get_db), current_user: models.User = Depends(auth_service.get_current_active_user)):
    documents_summary = db.query(
        cast(models.Document.chunk_metadata['source_file'], String).label("source_file"),
        func.count(models.Document.id).label("total_chunks")
    ).filter(models.Document.owner_id == current_user.id).group_by(cast(models.Document.chunk_metadata['source_file'], String)).all()
    
    return [schemas.DocumentMetadata(id=i + 1, source_file=doc.source_file, total_chunks=doc.total_chunks) for i, doc in enumerate(documents_summary)]

@router.delete("/{source_file}")
async def delete_document(source_file: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth_service.get_current_active_user)):
    logger.info(f"Usuario {current_user.email} intentando eliminar el documento: {source_file}")
    try:
        query = db.query(models.Document).filter(
            cast(models.Document.chunk_metadata['source_file'], String) == source_file,
            models.Document.owner_id == current_user.id
        )
        deleted_count = query.delete(synchronize_session=False)
        db.commit()
        
        if deleted_count == 0:
            exists_elsewhere = db.query(models.Document).filter(cast(models.Document.chunk_metadata['source_file'], String) == source_file).first()
            if exists_elsewhere:
                raise HTTPException(status_code=403, detail="No tienes permiso para eliminar este documento.")
            else:
                raise HTTPException(status_code=404, detail=f"Documento '{source_file}' no encontrado.")

        logger.info(f"Documento '{source_file}' del usuario {current_user.email} eliminado. Total de chunks: {deleted_count}")
        return {"message": f"Documento '{source_file}' y sus {deleted_count} chunks eliminados.", "deleted_chunks": deleted_count}
    except Exception as e:
        db.rollback()
        logger.error(f"Error al eliminar el documento '{source_file}' para el usuario {current_user.email}: {e}", exc_info=True)
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error interno al eliminar: {e}")

from services.search_engine import SearchEngine

@router.post("/suggest-questions", response_model=schemas.SuggestedQuestionsResponse)
async def suggest_questions(request: schemas.SuggestedQuestionsRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth_service.get_current_active_user)):
    if not request.source_files:
        return {"questions": []}
    
    # Obtener contenido de los documentos seleccionados (limitado para no exceder tokens)
    # Tomamos los primeros 3 chunks de cada documento para tener una idea del contenido
    documents_content = []
    for filename in request.source_files:
        docs = db.query(models.Document).filter(
            cast(models.Document.chunk_metadata['source_file'], String) == filename,
            models.Document.owner_id == current_user.id
        ).limit(3).all()
        
        if docs:
            documents_content.append(f"Documento: {filename}\n" + "\n".join([d.content for d in docs]))
            
    if not documents_content:
        return {"questions": []}
        
    full_context = "\n\n".join(documents_content)
    
    search_engine = SearchEngine()
    questions = await search_engine.generate_suggested_questions(full_context, api_key=current_user.decrypted_api_key)
    
    return {"questions": questions}

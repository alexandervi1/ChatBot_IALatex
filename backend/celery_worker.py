import os
import logging
import json
import redis
from celery import Celery
from sqlalchemy.orm import Session

# Importaciones locales
from database.connection import SessionLocal
from services.pdf_processor import PDFProcessor
from services.embedding_system import AdvancedEmbeddingSystem
from services.database_service import DatabaseService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Configuración de Celery y Redis ---
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
NOTIFICATION_CHANNEL = "task_notifications"  # Canal para notificaciones

celery_app = Celery("pdf_tasks", broker=REDIS_URL, backend=REDIS_URL)
redis_client = redis.from_url(REDIS_URL)

# --- Sistemas Pre-cargados ---
embedding_system = AdvancedEmbeddingSystem()

# --- Funciones de Ayuda ---
def get_db_celery():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def publish_notification(owner_id: int, payload: dict):
    """Publica una notificación para un usuario específico en el canal de Redis."""
    try:
        message = json.dumps({"owner_id": str(owner_id), "payload": payload})
        redis_client.publish(NOTIFICATION_CHANNEL, message)
        logger.info(f"Notificación para owner_id={owner_id} publicada en el canal '{NOTIFICATION_CHANNEL}'.")
    except Exception as e:
        logger.error(f"Error al publicar notificación en Redis: {e}", exc_info=True)

# --- Tarea de Celery ---
@celery_app.task(name="process_file_task")
def process_file_task(file_content: bytes, filename: str, owner_id: int):
    """
    Tarea de Celery para procesar un archivo: extraer texto, crear embeddings,
    guardar en DB y notificar el resultado vía Redis Pub/Sub.
    """
    logger.info(f"Celery: Iniciando tarea para {filename} (propietario: {owner_id})")
    temp_file_path = f"/tmp/{filename}"

    with open(temp_file_path, "wb") as f:
        f.write(file_content)

    db = next(get_db_celery())
    try:
        # 1. Procesar el archivo y extraer chunks
        processor = PDFProcessor()
        chunks = processor.process_file(temp_file_path)

        if not chunks:
            logger.warning(f"Celery: No se pudo extraer contenido de {filename}.")
            notification = {"status": "failed", "filename": filename, "message": "No se pudo extraer contenido del archivo."}
            publish_notification(owner_id, notification)
            return notification

        # 2. Generar embeddings
        chunk_contents = [chunk['content'] for chunk in chunks]
        embeddings = embedding_system.create_embeddings(chunk_contents)

        # 3. Guardar en la base de datos
        db_service = DatabaseService()
        db_service.save_document_chunks(db=db, chunks=chunks, embeddings=embeddings, owner_id=owner_id)
        logger.info(f"Celery: Archivo '{filename}' guardado en DB para usuario {owner_id}.")

        # 4. Publicar notificación de éxito
        notification = {"status": "completed", "filename": filename, "total_chunks": len(chunks)}
        publish_notification(owner_id, notification)

        return {"status": "completed", "filename": filename}

    except Exception as e:
        logger.error(f"Celery: Error procesando '{filename}': {e}", exc_info=True)
        # Publicar notificación de error
        notification = {"status": "failed", "filename": filename, "message": "Ocurrió un error interno durante el procesamiento."}
        publish_notification(owner_id, notification)
        return {"status": "failed", "filename": filename, "message": str(e)}
    finally:
        db.close()
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
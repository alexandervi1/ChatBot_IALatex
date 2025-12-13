import os
import json
import asyncio
from contextlib import asynccontextmanager
import redis.asyncio as redis
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

# Importaciones locales
from database.connection import Base, engine
from .routers import auth, documents, chat, admin, providers
from .connection_manager import manager
from .exception_handlers import register_exception_handlers
from .rate_limiter import get_rate_limiter
from .security_middleware import SecurityHeadersMiddleware
from .metrics import get_metrics_response
from logging_config import setup_logging, get_logger

# --- Configuración de Logging Estructurado ---
# Usa JSON en producción, formato coloreado en desarrollo
setup_logging()
logger = get_logger(__name__)

# --- Rate Limiter ---
# Enhanced rate limiting with user-based identification and tier-based limits
limiter = get_rate_limiter()

# --- Constantes ---
NOTIFICATION_CHANNEL = "task_notifications"

# --- Lógica del Ciclo de Vida (Lifespan) ---
async def notification_listener():
    """Escucha un canal de Redis y retransmite los mensajes al WebSocket apropiado."""
    redis_client = None
    while True:
        try:
            if not redis_client:
                redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))
                pubsub = redis_client.pubsub()
                await pubsub.subscribe(NOTIFICATION_CHANNEL)
                logger.info(f"Oyente de Redis suscrito a '{NOTIFICATION_CHANNEL}' y corriendo en segundo plano.")

            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=None)
            if message:
                logger.info(f"Notificación recibida de Redis: {message['data']}")
                data = json.loads(message['data'])
                owner_id = data.get("owner_id")
                payload = data.get("payload")
                if owner_id and payload:
                    await manager.send_personal_message(json.dumps(payload), owner_id)

        except asyncio.CancelledError:
            logger.info("El oyente de Redis está siendo cancelado.")
            break
        except Exception as e:
            logger.error(f"Error en el oyente de notificaciones de Redis: {e}", exc_info=True)
            # En caso de error (ej. Redis se reinicia), espera antes de reintentar
            if redis_client:
                await redis_client.close()
                redis_client = None
            await asyncio.sleep(5)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestiona el inicio y fin de tareas en segundo plano."""
    # Iniciar el oyente en segundo plano
    task = asyncio.create_task(notification_listener())
    yield
    # Limpiar la tarea cuando la aplicación se apaga
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        logger.info("Tarea del oyente de Redis cancelada exitosamente.")

# --- Metadata OpenAPI ---
API_DESCRIPTION = """
## 🤖 Chatbot Académico API

Sistema avanzado de chatbot con IA que combina **búsqueda semántica RAG**, 
**generación de respuestas con múltiples proveedores de IA**, y un **editor LaTeX inteligente**.

### Características Principales

* 🔍 **Búsqueda Híbrida**: Combina búsqueda semántica (embeddings) y búsqueda por palabras clave.
* 💬 **Multi-Proveedor IA**: Soporta Gemini, OpenAI, Anthropic y modelos locales (Ollama).
* 📝 **Editor LaTeX**: Copiloto inteligente para edición de documentos académicos.
* 📊 **Procesamiento Asíncrono**: Cola de tareas con Celery para operaciones pesadas.

### Autenticación

La API usa **JWT Bearer tokens**. Obtén tu token en `/auth/login` y úsalo en el header:
```
Authorization: Bearer <tu_token>
```
"""

TAGS_METADATA = [
    {
        "name": "Autenticación",
        "description": "Registro, login y gestión de usuarios. Incluye configuración de API keys para proveedores de IA.",
    },
    {
        "name": "Chat",
        "description": "Búsqueda semántica RAG y generación de respuestas con IA. Soporta streaming.",
    },
    {
        "name": "Documentos",
        "description": "Carga, listado y eliminación de documentos. Soporta PDF, DOCX, TXT y PPTX.",
    },
    {
        "name": "Copilot",
        "description": "Asistente de escritura LaTeX con acciones contextuales y compilación PDF.",
    },
    {
        "name": "Administración",
        "description": "Gestión de usuarios, analytics y logs. Requiere rol de administrador.",
    },
    {
        "name": "Proveedores IA",
        "description": "Listado de proveedores de IA disponibles y sus modelos.",
    },
    {
        "name": "Operaciones",
        "description": "Endpoints de operaciones y monitoreo del sistema.",
    },
]

# --- Creación de la App FastAPI ---
app = FastAPI(
    title="Chatbot Académico API",
    version="4.1.0",
    description=API_DESCRIPTION,
    openapi_tags=TAGS_METADATA,
    contact={
        "name": "Soporte Técnico",
        "email": "soporte@chatbot-academico.com",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# --- Configuración de Rate Limiting ---
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- Registrar Exception Handlers Centralizados ---
register_exception_handlers(app)

# --- Configuración de CORS ---
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:8501")
origins = [origin.strip() for origin in CORS_ORIGINS.split(",")]
logger.info(f"Orígenes CORS permitidos: {origins}")

# Configura el middleware CORS para permitir peticiones desde el frontend
# Esto es crucial para que el navegador no bloquee las solicitudes a la API
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Security Headers Middleware ---
# Adds X-Content-Type-Options, X-Frame-Options, CSP, HSTS, etc.
app.add_middleware(SecurityHeadersMiddleware)

# --- Database Setup ---
# Create tables and extensions on startup (skip in test mode)
if os.getenv("TEST_MODE") != "True":
    logger.info("Starting database initialization...")
    try:
        with engine.connect() as connection:
            # Create 'vector' extension if not exists (for pgvector)
            connection.execute(text('CREATE EXTENSION IF NOT EXISTS vector;'))
            connection.commit()
    except Exception as e:
        logger.warning(f"Could not create 'vector' extension: {e}")

    # Create all tables defined in models
    Base.metadata.create_all(bind=engine)
    
    # --- Vector Search Index ---
    # IVFFlat is faster than HNSW for small/medium datasets
    try:
        with engine.connect() as connection:
            result = connection.execute(text(
                "SELECT 1 FROM pg_indexes WHERE indexname = 'idx_documents_embedding_ivfflat'"
            ))
            if not result.fetchone():
                connection.execute(text('''
                    CREATE INDEX IF NOT EXISTS idx_documents_embedding_ivfflat
                    ON documents USING ivfflat (embedding vector_cosine_ops)
                    WITH (lists = 100);
                '''))
                connection.commit()
                logger.info("IVFFlat index created successfully.")
            else:
                logger.debug("IVFFlat index already exists.")
    except Exception as e:
        logger.warning(f"Could not create vector index: {e}")
else:
    logger.info("Running in test mode, skipping database initialization.")

# --- Endpoints ---
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text() # Mantener la conexión viva
    except WebSocketDisconnect:
        manager.disconnect(user_id)

app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(admin.router)
app.include_router(providers.router)


# --- Metrics Endpoint ---
@app.get(
    "/metrics",
    tags=["Operaciones"],
    summary="Métricas Prometheus",
    description="Expone métricas del sistema en formato Prometheus para monitoreo y alertas.",
    include_in_schema=True,
)
async def metrics():
    """Endpoint para exponer métricas Prometheus."""
    return get_metrics_response()


@app.get(
    "/health",
    tags=["Operaciones"],
    summary="Health Check",
    description="Verifica que el servicio está funcionando correctamente.",
)
async def health_check():
    """Simple health check endpoint."""
    return {"status": "healthy", "version": "4.1.1"}
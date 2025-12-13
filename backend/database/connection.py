import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from logging import getLogger

logger = getLogger(__name__)

# --- Configuración de la URL de la Base de Datos ---
# Lee la URL desde las variables de entorno, tal como se define en docker-compose.yml
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    logger.error("La variable de entorno DATABASE_URL no está definida.")
    raise ValueError("DATABASE_URL no encontrada en el entorno.")

# --- Connection Pool Configuration ---
# These settings optimize database connections for production workloads
POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "10"))        # Base number of connections
MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", "20"))  # Extra connections under load
POOL_TIMEOUT = int(os.getenv("DB_POOL_TIMEOUT", "30"))  # Wait time for connection
POOL_RECYCLE = int(os.getenv("DB_POOL_RECYCLE", "1800"))  # Recycle connections after 30min

# --- Motor de SQLAlchemy ---
# El motor es el punto de entrada a la base de datos.
# Configured with connection pooling for better performance and resilience
engine = create_engine(
    DATABASE_URL,
    pool_size=POOL_SIZE,
    max_overflow=MAX_OVERFLOW,
    pool_timeout=POOL_TIMEOUT,
    pool_recycle=POOL_RECYCLE,
    pool_pre_ping=True,  # Validate connections before use (prevents stale connections)
    echo=os.getenv("DB_ECHO", "false").lower() == "true",  # SQL logging for debugging
)

logger.info(
    f"Database engine created with pool_size={POOL_SIZE}, "
    f"max_overflow={MAX_OVERFLOW}, pool_pre_ping=True"
)

# --- Sesión de la Base de Datos ---
# Cada instancia de SessionLocal será una sesión de base de datos.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# --- Clase Base para los Modelos ORM ---
# Usaremos esta clase como base para crear nuestros modelos de tabla.
Base = declarative_base()

def get_db():
    """
    Función de dependencia para obtener una sesión de base de datos.
    Asegura que la sesión se cierre siempre después de su uso.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
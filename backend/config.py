# backend/config.py
"""
Application configuration constants.
Centralizes all magic numbers, strings, and configuration values.
Following Clean Code principle: "No Magic Numbers".
"""
from typing import Final


class SearchConfig:
    """Configuration for search functionality."""
    DEFAULT_TOP_K: Final[int] = 10
    MAX_TOP_K: Final[int] = 50
    SEMANTIC_WEIGHT: Final[float] = 0.6
    KEYWORD_WEIGHT: Final[float] = 0.4


class LLMConfig:
    """Configuration for Language Model interactions."""
    DEFAULT_MODEL: Final[str] = "gemini-1.5-flash"
    FALLBACK_MODEL: Final[str] = "gemini-1.5-pro"
    DEFAULT_TEMPERATURE: Final[float] = 0.3
    MAX_TOKENS: Final[int] = 2048
    COPILOT_TEMPERATURE: Final[float] = 0.7
    COPILOT_MAX_TOKENS: Final[int] = 4096


class EmbeddingConfig:
    """Configuration for embedding generation."""
    MODEL_NAME: Final[str] = "all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: Final[int] = 384
    CACHE_TTL_SECONDS: Final[int] = 3600  # 1 hour


class DocumentConfig:
    """Configuration for document processing."""
    MAX_FILE_SIZE_MB: Final[int] = 50
    CHUNK_SIZE: Final[int] = 512
    CHUNK_OVERLAP: Final[int] = 50
    SUPPORTED_EXTENSIONS: Final[tuple] = ('.pdf', '.docx', '.txt', '.pptx')


class RateLimitConfig:
    """Rate limiting configuration."""
    DEFAULT_LIMIT: Final[str] = "100/minute"
    SEARCH_LIMIT: Final[str] = "30/minute"
    UPLOAD_LIMIT: Final[str] = "10/minute"


class ErrorMessages:
    """Centralized error messages for consistent user experience."""
    INTERNAL_ERROR = "Ocurrió un error interno del servidor."
    SEARCH_ERROR = "Ocurrió un error interno del servidor durante la búsqueda."
    COPILOT_ERROR = "Ocurrió un error interno del servidor en el copiloto."
    PDF_COMPILE_ERROR = "Error de compilación de LaTeX."
    USER_NOT_FOUND = "Usuario no encontrado"
    ADMIN_REQUIRED = "No tienes permisos de administrador"
    NO_DOCUMENTS = "No encontré información relevante en los documentos disponibles."
    NO_DOCUMENTS_SELECTED = "No pude encontrar una respuesta en los documentos seleccionados."


class StreamingConfig:
    """Configuration for response streaming."""
    JSON_SEPARATOR: Final[str] = "|||JSON_START|||"
    MEDIA_TYPE: Final[str] = "text/event-stream"

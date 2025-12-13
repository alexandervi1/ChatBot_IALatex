"""
Exception Handlers Module.

Centralized error handling for the FastAPI application.
Provides consistent error responses and automatic logging.

Usage:
    Register handlers in main.py:
    
    from app.exception_handlers import register_exception_handlers
    register_exception_handlers(app)
"""
import logging
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import ValidationError


logger = logging.getLogger(__name__)


class AppException(Exception):
    """
    Base exception for application-specific errors.
    
    Attributes:
        message: User-friendly error message
        status_code: HTTP status code
        error_code: Internal error code for debugging
        details: Additional error context
    """
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: str = "INTERNAL_ERROR",
        details: dict = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class DocumentNotFoundError(AppException):
    """Raised when a requested document is not found."""
    def __init__(self, document_id: str):
        super().__init__(
            message=f"Documento '{document_id}' no encontrado",
            status_code=404,
            error_code="DOCUMENT_NOT_FOUND",
            details={"document_id": document_id}
        )


class AIProviderError(AppException):
    """Raised when an AI provider request fails."""
    def __init__(self, provider: str, message: str = None):
        super().__init__(
            message=message or f"Error al comunicarse con el proveedor de IA: {provider}",
            status_code=502,
            error_code="AI_PROVIDER_ERROR",
            details={"provider": provider}
        )


class RateLimitExceededError(AppException):
    """Raised when user exceeds rate limits."""
    def __init__(self, limit: str):
        super().__init__(
            message="Has excedido el límite de peticiones. Intenta de nuevo más tarde.",
            status_code=429,
            error_code="RATE_LIMIT_EXCEEDED",
            details={"limit": limit}
        )


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """
    Handle custom application exceptions.
    
    Logs the error and returns a structured JSON response.
    """
    logger.warning(
        f"App exception: {exc.error_code} - {exc.message}",
        extra={
            "error_code": exc.error_code,
            "status_code": exc.status_code,
            "path": str(request.url),
            "method": request.method,
            "details": exc.details
        }
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "code": exc.error_code,
            "message": exc.message,
            "details": exc.details
        }
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """
    Handle FastAPI HTTPExceptions with consistent format.
    """
    logger.warning(
        f"HTTP exception: {exc.status_code} - {exc.detail}",
        extra={
            "status_code": exc.status_code,
            "path": str(request.url),
            "method": request.method
        }
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "code": f"HTTP_{exc.status_code}",
            "message": exc.detail if isinstance(exc.detail, str) else str(exc.detail),
            "details": {}
        },
        headers=getattr(exc, "headers", None)
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Handle request validation errors with detailed field information.
    """
    errors = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"])
        errors.append({
            "field": field,
            "message": error["msg"],
            "type": error["type"]
        })
    
    logger.warning(
        f"Validation error on {request.url}",
        extra={"errors": errors, "method": request.method}
    )
    
    return JSONResponse(
        status_code=422,
        content={
            "error": True,
            "code": "VALIDATION_ERROR",
            "message": "Error de validación en la petición",
            "details": {"errors": errors}
        }
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Catch-all handler for unhandled exceptions.
    
    Logs full traceback for debugging while returning safe message to client.
    """
    logger.exception(
        f"Unhandled exception on {request.method} {request.url}",
        extra={"exception_type": type(exc).__name__}
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "code": "INTERNAL_ERROR",
            "message": "Ocurrió un error interno del servidor. Por favor, intenta de nuevo más tarde.",
            "details": {}
        }
    )


def register_exception_handlers(app: FastAPI) -> None:
    """
    Register all exception handlers with the FastAPI application.
    
    Args:
        app: FastAPI application instance
    """
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
    
    logger.info("Custom exception handlers registered")

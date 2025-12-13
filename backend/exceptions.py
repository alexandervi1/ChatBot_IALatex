# backend/exceptions.py
"""
Custom exceptions for the application.
Following Clean Code: "Use Exceptions Rather Than Return Codes".
"""


class ChatBotException(Exception):
    """Base exception for all application-specific exceptions."""
    
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class DocumentProcessingError(ChatBotException):
    """Raised when document processing fails."""
    
    def __init__(self, message: str = "Error al procesar el documento"):
        super().__init__(message, status_code=422)


class SearchError(ChatBotException):
    """Raised when search operation fails."""
    
    def __init__(self, message: str = "Error en la búsqueda"):
        super().__init__(message, status_code=500)


class EmbeddingGenerationError(ChatBotException):
    """Raised when embedding generation fails."""
    
    def __init__(self, message: str = "Error al generar embeddings"):
        super().__init__(message, status_code=500)


class APIKeyError(ChatBotException):
    """Raised when API key is invalid or missing."""
    
    def __init__(self, message: str = "API key inválida o no configurada"):
        super().__init__(message, status_code=401)


class RateLimitExceededError(ChatBotException):
    """Raised when rate limit is exceeded."""
    
    def __init__(self, message: str = "Has excedido el límite de solicitudes"):
        super().__init__(message, status_code=429)


class PDFCompilationError(ChatBotException):
    """Raised when LaTeX PDF compilation fails."""
    
    def __init__(self, message: str = "Error de compilación LaTeX", line_number: int = None):
        self.line_number = line_number
        if line_number:
            message = f"Error en línea {line_number}: {message}"
        super().__init__(message, status_code=400)


class AuthorizationError(ChatBotException):
    """Raised when user lacks required permissions."""
    
    def __init__(self, message: str = "No tienes permisos para esta acción"):
        super().__init__(message, status_code=403)

# backend/app/decorators.py
"""
Reusable decorators for Clean Code.
Following DRY principle: Don't Repeat Yourself.
"""
from functools import wraps
from fastapi import HTTPException, status
from config import ErrorMessages


def require_admin(func):
    """
    Decorator to ensure the current user has admin privileges.
    
    Usage:
        @router.get("/users")
        @require_admin
        async def list_users(current_user, ...):
            ...
    """
    @wraps(func)
    async def wrapper(*args, current_user=None, **kwargs):
        if current_user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        if current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=ErrorMessages.ADMIN_REQUIRED
            )
        return await func(*args, current_user=current_user, **kwargs)
    return wrapper


def log_endpoint_call(logger):
    """
    Decorator to log endpoint calls.
    
    Usage:
        @router.get("/search")
        @log_endpoint_call(logger)
        async def search_endpoint(...):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            logger.info(f"Endpoint called: {func.__name__}")
            try:
                result = await func(*args, **kwargs)
                logger.info(f"Endpoint completed: {func.__name__}")
                return result
            except Exception as e:
                logger.error(f"Endpoint failed: {func.__name__} - {str(e)}")
                raise
        return wrapper
    return decorator


def handle_errors(error_message: str = ErrorMessages.INTERNAL_ERROR):
    """
    Decorator for consistent error handling.
    
    Usage:
        @router.post("/search")
        @handle_errors(ErrorMessages.SEARCH_ERROR)
        async def search_endpoint(...):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except HTTPException:
                raise  # Re-raise HTTP exceptions as-is
            except Exception as e:
                import logging
                logger = logging.getLogger(func.__module__)
                logger.error(f"Error in {func.__name__}: {e}", exc_info=True)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=error_message
                )
        return wrapper
    return decorator

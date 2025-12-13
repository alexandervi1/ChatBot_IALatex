"""
Rate Limiting Module.

Provides enhanced rate limiting with support for:
- IP-based limiting for anonymous users
- User-based limiting for authenticated users
- Differentiated limits by user role

Usage:
    from app.rate_limiter import get_rate_limiter, RateLimitTier
    
    @app.get("/expensive")
    @limiter.limit("10/minute")
    async def expensive_endpoint():
        ...
"""
import os
import logging
from typing import Optional, Callable
from enum import Enum

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

logger = logging.getLogger(__name__)


class RateLimitTier(str, Enum):
    """Rate limit tiers based on user type."""
    ANONYMOUS = "anonymous"
    AUTHENTICATED = "authenticated"
    PREMIUM = "premium"
    ADMIN = "admin"


# Default limits per tier (requests per minute)
DEFAULT_LIMITS = {
    RateLimitTier.ANONYMOUS: "30/minute",
    RateLimitTier.AUTHENTICATED: "100/minute",
    RateLimitTier.PREMIUM: "300/minute",
    RateLimitTier.ADMIN: "1000/minute",
}

# Expensive endpoints have lower limits
EXPENSIVE_LIMITS = {
    RateLimitTier.ANONYMOUS: "5/minute",
    RateLimitTier.AUTHENTICATED: "20/minute",
    RateLimitTier.PREMIUM: "60/minute",
    RateLimitTier.ADMIN: "200/minute",
}


def get_user_identifier(request: Request) -> str:
    """
    Get a unique identifier for rate limiting.
    
    For authenticated users, uses user_id from JWT.
    For anonymous users, uses IP address.
    
    Args:
        request: FastAPI request object
        
    Returns:
        str: Unique identifier for the requester
    """
    # Check if user is authenticated (token was validated and user attached)
    user = getattr(request.state, 'user', None)
    
    if user and hasattr(user, 'id'):
        # Authenticated user - use their ID
        return f"user:{user.id}"
    
    # Anonymous user - use IP address
    return f"ip:{get_remote_address(request)}"


def get_user_tier(request: Request) -> RateLimitTier:
    """
    Determine the rate limit tier for the current request.
    
    Args:
        request: FastAPI request object
        
    Returns:
        RateLimitTier: The applicable rate limit tier
    """
    user = getattr(request.state, 'user', None)
    
    if not user:
        return RateLimitTier.ANONYMOUS
    
    # Check user role
    role = getattr(user, 'role', 'user')
    
    if role == 'admin':
        return RateLimitTier.ADMIN
    elif role == 'premium':
        return RateLimitTier.PREMIUM
    else:
        return RateLimitTier.AUTHENTICATED


def get_limit_for_tier(request: Request, expensive: bool = False) -> str:
    """
    Get the rate limit string for the current user's tier.
    
    Args:
        request: FastAPI request object
        expensive: If True, use lower limits for expensive operations
        
    Returns:
        str: Rate limit string (e.g., "100/minute")
    """
    tier = get_user_tier(request)
    limits = EXPENSIVE_LIMITS if expensive else DEFAULT_LIMITS
    return limits.get(tier, DEFAULT_LIMITS[RateLimitTier.ANONYMOUS])


def dynamic_limit_key(request: Request) -> str:
    """
    Dynamic key function that combines user identifier with their tier.
    
    This allows different rate limits for different user types while
    still using the same limiter instance.
    """
    identifier = get_user_identifier(request)
    tier = get_user_tier(request)
    return f"{tier.value}:{identifier}"


# Create limiter with user-aware key function
def create_limiter() -> Limiter:
    """
    Create a configured rate limiter instance.
    
    Uses user-aware key function for differentiated limits.
    Falls back to IP-based limiting for anonymous users.
    
    Returns:
        Limiter: Configured slowapi Limiter instance
    """
    storage_uri = os.getenv("REDIS_URL", "memory://")
    
    limiter = Limiter(
        key_func=dynamic_limit_key,
        default_limits=["100/minute"],
        storage_uri=storage_uri,
        strategy="fixed-window",  # or "moving-window" for smoother limiting
    )
    
    logger.info(f"Rate limiter created with storage: {storage_uri}")
    return limiter


# Singleton limiter instance
_limiter: Optional[Limiter] = None


def get_rate_limiter() -> Limiter:
    """
    Get the singleton rate limiter instance.
    
    Returns:
        Limiter: The application's rate limiter
    """
    global _limiter
    if _limiter is None:
        _limiter = create_limiter()
    return _limiter


# Helper decorators for common limit patterns
def limit_standard(func: Callable) -> Callable:
    """Apply standard rate limits (100/min for authenticated)."""
    limiter = get_rate_limiter()
    return limiter.limit(lambda request: get_limit_for_tier(request, expensive=False))(func)


def limit_expensive(func: Callable) -> Callable:
    """Apply expensive operation rate limits (20/min for authenticated)."""
    limiter = get_rate_limiter()
    return limiter.limit(lambda request: get_limit_for_tier(request, expensive=True))(func)

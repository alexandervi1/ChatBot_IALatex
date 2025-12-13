"""
Security Headers Middleware.

Adds essential security headers to all HTTP responses to protect against:
- XSS (Cross-Site Scripting)
- Clickjacking
- MIME type sniffing
- Man-in-the-middle attacks (via HSTS)

Usage:
    from app.security_middleware import SecurityHeadersMiddleware
    app.add_middleware(SecurityHeadersMiddleware)
"""
import os
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware that adds security headers to all responses.
    
    Headers added:
    - X-Content-Type-Options: Prevents MIME sniffing
    - X-Frame-Options: Prevents clickjacking
    - X-XSS-Protection: Legacy XSS filter (for older browsers)
    - Strict-Transport-Security: Forces HTTPS
    - Content-Security-Policy: Controls resource loading
    - Referrer-Policy: Controls referrer information
    - Permissions-Policy: Restricts browser features
    """
    
    def __init__(self, app, enable_hsts: bool = None, csp_policy: str = None):
        """
        Initialize the security headers middleware.
        
        Args:
            app: The ASGI application
            enable_hsts: Enable HSTS header (default: True in production)
            csp_policy: Custom Content-Security-Policy (default: relaxed for SPA)
        """
        super().__init__(app)
        
        # Determine environment
        is_production = os.getenv("ENVIRONMENT", "development").lower() == "production"
        
        # HSTS should be enabled in production
        self.enable_hsts = enable_hsts if enable_hsts is not None else is_production
        
        # Default CSP is relaxed for SPA with external resources
        # Customize based on your needs
        self.csp_policy = csp_policy or self._get_default_csp()
        
        logger.info(f"Security headers middleware initialized (HSTS: {self.enable_hsts})")
    
    def _get_default_csp(self) -> str:
        """
        Get default Content-Security-Policy.
        
        Configured for a SPA that:
        - Loads scripts from self and CDNs
        - Loads styles from self and inline (for dynamic styling)
        - Loads images from various sources
        - Connects to API and external services
        """
        directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https: blob:",
            "connect-src 'self' https://generativelanguage.googleapis.com https://api.openai.com https://api.anthropic.com",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ]
        return "; ".join(directives)
    
    async def dispatch(self, request: Request, call_next) -> Response:
        """
        Process request and add security headers to response.
        """
        response = await call_next(request)
        
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        
        # Legacy XSS protection (for older browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Control referrer information
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Restrict browser features
        response.headers["Permissions-Policy"] = (
            "accelerometer=(), camera=(), geolocation=(), gyroscope=(), "
            "magnetometer=(), microphone=(), payment=(), usb=()"
        )
        
        # Content Security Policy
        response.headers["Content-Security-Policy"] = self.csp_policy
        
        # HSTS - Only in production with HTTPS
        if self.enable_hsts:
            # max-age=31536000 = 1 year
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )
        
        return response


class TrustedHostMiddleware:
    """
    Middleware to validate Host header.
    
    Prevents host header injection attacks by only allowing
    requests to specified hosts.
    """
    
    def __init__(self, app, allowed_hosts: list = None):
        """
        Initialize trusted host middleware.
        
        Args:
            app: The ASGI application
            allowed_hosts: List of allowed hostnames (default: any)
        """
        self.app = app
        self.allowed_hosts = allowed_hosts or ["*"]
        
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            headers = dict(scope.get("headers", []))
            host = headers.get(b"host", b"").decode()
            
            if "*" not in self.allowed_hosts and host.split(":")[0] not in self.allowed_hosts:
                response = Response("Invalid host header", status_code=400)
                await response(scope, receive, send)
                return
        
        await self.app(scope, receive, send)

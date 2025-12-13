"""
Structured Logging Configuration

Provides consistent, configurable logging across the application.
Supports both human-readable and JSON formats based on environment.

Usage:
    from logging_config import setup_logging, get_logger
    
    setup_logging()  # Call once at app startup
    logger = get_logger(__name__)
    logger.info("Message", extra={"user_id": 123, "action": "login"})
"""
import os
import sys
import logging
import json
from datetime import datetime, timezone
from typing import Any, Dict, Optional


class JSONFormatter(logging.Formatter):
    """
    Custom formatter that outputs log records as JSON.
    Ideal for production environments and log aggregation systems.
    """
    
    def format(self, record: logging.LogRecord) -> str:
        log_data: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        # Add any extra fields passed to the logger
        if hasattr(record, "user_id"):
            log_data["user_id"] = record.user_id
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        if hasattr(record, "action"):
            log_data["action"] = record.action
        if hasattr(record, "duration_ms"):
            log_data["duration_ms"] = record.duration_ms
        if hasattr(record, "status_code"):
            log_data["status_code"] = record.status_code
        
        # Add any other extra fields
        extra_fields = {
            k: v for k, v in record.__dict__.items()
            if k not in logging.LogRecord.__dict__ 
            and k not in ["user_id", "request_id", "action", "duration_ms", "status_code"]
            and not k.startswith("_")
        }
        if extra_fields:
            log_data["extra"] = extra_fields
            
        return json.dumps(log_data, default=str, ensure_ascii=False)


class ColoredFormatter(logging.Formatter):
    """
    Human-readable formatter with colors for development.
    """
    
    COLORS = {
        "DEBUG": "\033[36m",     # Cyan
        "INFO": "\033[32m",      # Green
        "WARNING": "\033[33m",   # Yellow
        "ERROR": "\033[31m",     # Red
        "CRITICAL": "\033[35m",  # Magenta
    }
    RESET = "\033[0m"
    
    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelname, self.RESET)
        
        # Format timestamp
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Build base message
        base = f"{color}{timestamp} | {record.levelname:8}{self.RESET} | {record.name} | {record.getMessage()}"
        
        # Add extra context if present
        extras = []
        if hasattr(record, "user_id"):
            extras.append(f"user_id={record.user_id}")
        if hasattr(record, "action"):
            extras.append(f"action={record.action}")
        if hasattr(record, "duration_ms"):
            extras.append(f"duration={record.duration_ms}ms")
            
        if extras:
            base += f" [{', '.join(extras)}]"
        
        # Add exception if present
        if record.exc_info:
            base += f"\n{self.formatException(record.exc_info)}"
            
        return base


def setup_logging(
    level: Optional[str] = None,
    json_format: Optional[bool] = None
) -> None:
    """
    Configure application-wide logging.
    
    Args:
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
               Defaults to LOG_LEVEL env var or INFO
        json_format: If True, use JSON format. If None, auto-detect from environment.
                     Defaults to True in production (when not DEBUG mode)
    """
    # Determine log level
    if level is None:
        level = os.getenv("LOG_LEVEL", "INFO").upper()
    
    # Determine format
    if json_format is None:
        # Use JSON in production, colored in development
        env = os.getenv("ENVIRONMENT", "development").lower()
        json_format = env in ("production", "prod", "staging")
    
    # Create handler
    handler = logging.StreamHandler(sys.stdout)
    
    # Set formatter
    if json_format:
        handler.setFormatter(JSONFormatter())
    else:
        handler.setFormatter(ColoredFormatter())
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level, logging.INFO))
    
    # Remove existing handlers to avoid duplicates
    root_logger.handlers.clear()
    root_logger.addHandler(handler)
    
    # Set specific loggers to reduce noise
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    
    # Log startup message
    root_logger.info(
        f"Logging configured: level={level}, format={'JSON' if json_format else 'colored'}"
    )


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger with the given name.
    
    Args:
        name: Logger name (usually __name__)
        
    Returns:
        Configured logger instance
    """
    return logging.getLogger(name)


# Context manager for request logging
class LogContext:
    """
    Context manager to add consistent fields to all log messages within a scope.
    
    Usage:
        with LogContext(request_id="abc-123", user_id=42):
            logger.info("Processing request")  # Will include request_id and user_id
    """
    
    _current: Dict[str, Any] = {}
    
    def __init__(self, **kwargs):
        self.fields = kwargs
        self._previous = {}
        
    def __enter__(self):
        self._previous = LogContext._current.copy()
        LogContext._current.update(self.fields)
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        LogContext._current = self._previous
        return False
    
    @classmethod
    def get_current(cls) -> Dict[str, Any]:
        return cls._current.copy()

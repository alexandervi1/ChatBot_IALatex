"""
Application Metrics Module.

Provides Prometheus metrics for observability:
- Request counters and histograms
- AI provider usage tracking
- Document processing metrics
- Cache hit/miss ratios

Usage:
    from app.metrics import (
        REQUEST_COUNT, REQUEST_LATENCY,
        track_request, get_metrics_response
    )
    
    # In endpoint:
    with track_request("search"):
        # ... endpoint logic
"""
import time
from functools import wraps
from typing import Callable
from prometheus_client import (
    Counter,
    Histogram,
    Gauge,
    Info,
    generate_latest,
    CONTENT_TYPE_LATEST,
)
from fastapi import Response

# --- Application Info ---
APP_INFO = Info('chatbot_app', 'Application information')
APP_INFO.info({
    'version': '4.1.1',
    'name': 'Chatbot IA Premium',
})

# --- Request Metrics ---
REQUEST_COUNT = Counter(
    'chatbot_requests_total',
    'Total number of requests',
    ['endpoint', 'method', 'status']
)

REQUEST_LATENCY = Histogram(
    'chatbot_request_duration_seconds',
    'Request latency in seconds',
    ['endpoint'],
    buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0]
)

# --- AI Provider Metrics ---
AI_REQUESTS = Counter(
    'chatbot_ai_requests_total',
    'Total number of AI provider requests',
    ['provider', 'model', 'status']
)

AI_TOKEN_USAGE = Counter(
    'chatbot_ai_tokens_total',
    'Total tokens used by AI providers',
    ['provider', 'type']  # type: input/output
)

AI_LATENCY = Histogram(
    'chatbot_ai_latency_seconds',
    'AI request latency in seconds',
    ['provider'],
    buckets=[0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0]
)

# --- Document Metrics ---
DOCUMENTS_PROCESSED = Counter(
    'chatbot_documents_processed_total',
    'Total number of documents processed',
    ['status', 'file_type']
)

DOCUMENT_CHUNKS = Histogram(
    'chatbot_document_chunks',
    'Number of chunks per document',
    buckets=[5, 10, 25, 50, 100, 250, 500]
)

# --- Cache Metrics ---
CACHE_OPERATIONS = Counter(
    'chatbot_cache_operations_total',
    'Cache operations',
    ['cache_type', 'operation', 'result']  # cache_type: lru/redis, operation: get/set, result: hit/miss
)

# --- Search Metrics ---
SEARCH_RESULTS = Histogram(
    'chatbot_search_results_count',
    'Number of search results returned',
    buckets=[0, 1, 5, 10, 25, 50]
)

# --- Active Users ---
ACTIVE_USERS = Gauge(
    'chatbot_active_users',
    'Number of currently active users'
)


# --- Helper Functions ---

def track_ai_request(provider: str, model: str, status: str = 'success'):
    """Track an AI provider request."""
    AI_REQUESTS.labels(provider=provider, model=model, status=status).inc()


def track_ai_tokens(provider: str, input_tokens: int = 0, output_tokens: int = 0):
    """Track token usage for an AI provider."""
    if input_tokens > 0:
        AI_TOKEN_USAGE.labels(provider=provider, type='input').inc(input_tokens)
    if output_tokens > 0:
        AI_TOKEN_USAGE.labels(provider=provider, type='output').inc(output_tokens)


def track_document_processed(status: str, file_type: str, chunk_count: int = 0):
    """Track a document processing operation."""
    DOCUMENTS_PROCESSED.labels(status=status, file_type=file_type).inc()
    if chunk_count > 0:
        DOCUMENT_CHUNKS.observe(chunk_count)


def track_cache(cache_type: str, operation: str, hit: bool):
    """Track a cache operation."""
    result = 'hit' if hit else 'miss'
    CACHE_OPERATIONS.labels(cache_type=cache_type, operation=operation, result=result).inc()


def track_search_results(count: int):
    """Track the number of search results."""
    SEARCH_RESULTS.observe(count)


# --- Decorator for Request Tracking ---

def track_request(endpoint: str):
    """
    Decorator to track request metrics.
    
    Usage:
        @app.get("/search")
        @track_request("search")
        async def search_endpoint():
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            status = 'success'
            try:
                result = await func(*args, **kwargs)
                return result
            except Exception as e:
                status = 'error'
                raise
            finally:
                duration = time.time() - start_time
                REQUEST_COUNT.labels(
                    endpoint=endpoint,
                    method='POST',  # Most endpoints are POST
                    status=status
                ).inc()
                REQUEST_LATENCY.labels(endpoint=endpoint).observe(duration)
        return wrapper
    return decorator


# --- Metrics Endpoint Response ---

def get_metrics_response() -> Response:
    """
    Generate Prometheus metrics response.
    
    Returns:
        FastAPI Response with Prometheus metrics in text format
    """
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )

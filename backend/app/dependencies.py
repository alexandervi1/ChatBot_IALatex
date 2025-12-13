"""
Application Dependencies Module.

Provides singleton instances of heavy services using dependency injection.
Avoids creating new instances on every request, improving performance.

Usage:
    from app.dependencies import get_search_engine, get_embedding_system
    
    @router.post("/search")
    async def search(
        search_engine: SearchEngine = Depends(get_search_engine)
    ):
        ...
"""
from functools import lru_cache
import logging

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_search_engine():
    """
    Get singleton instance of SearchEngine.
    
    Uses lru_cache to ensure only one instance is created
    during the application lifecycle.
    
    Returns:
        SearchEngine: Singleton search engine instance
    """
    from services.search_engine import SearchEngine
    logger.info("Creating SearchEngine singleton instance")
    return SearchEngine()


@lru_cache(maxsize=1)
def get_embedding_system():
    """
    Get singleton instance of AdvancedEmbeddingSystem.
    
    Uses lru_cache to ensure only one instance is created,
    avoiding multiple model loads which are memory-intensive.
    
    Returns:
        AdvancedEmbeddingSystem: Singleton embedding system instance
    """
    from services.embedding_system import AdvancedEmbeddingSystem
    logger.info("Creating AdvancedEmbeddingSystem singleton instance")
    return AdvancedEmbeddingSystem()


def clear_caches():
    """
    Clear all cached singleton instances.
    
    Useful for testing or when services need to be reinitialized.
    """
    get_search_engine.cache_clear()
    get_embedding_system.cache_clear()
    logger.info("Singleton caches cleared")

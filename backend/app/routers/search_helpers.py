# app/routers/search_helpers.py
"""
Helper functions for search endpoint to comply with Clean Code principles.
Each function has a single, well-defined responsibility.
"""
from typing import List, Dict, Any, Optional, AsyncGenerator
from sqlalchemy.orm import Session
import json
import logging

from app import schemas
from database import models
from services.search_engine import SearchEngine
from services.embedding_system import AdvancedEmbeddingSystem

logger = logging.getLogger(__name__)


def clean_source_files(source_files: Optional[List[str]]) -> Optional[List[str]]:
    """Remove surrounding quotes from source file names."""
    if not source_files:
        return None
    return [sf.strip('"') for sf in source_files]


def prepare_search_context(search_results: List[Dict[str, Any]]) -> str:
    """Format search results into a context string for the LLM."""
    return "\n---\n".join([result['content'] for result in search_results])


def format_chat_history(chat_history: List[schemas.ChatMessage]) -> str:
    """Format chat history into a string for the LLM."""
    return "\n".join([f"{msg.role}: {msg.content}" for msg in chat_history])


async def create_token_updater(current_user: models.User, db: Session):
    """
    Create a closure that updates token usage for a user.
    
    Returns:
        Async function that accepts token count and updates database
    """
    async def update_token_usage(tokens: int):
        try:
            current_user.token_usage += tokens
            db.add(current_user)
            db.commit()
        except Exception as e:
            logger.error(f"Error updating token usage: {e}")
    
    return update_token_usage


async def stream_not_found_response(
    source_files: Optional[List[str]],
    corrected_query: Optional[str]
) -> AsyncGenerator[bytes, None]:
    """
    Generate a 'not found' response stream.
    
    Args:
        source_files: List of files that were searched (if any)
        corrected_query: Spell-corrected version of query (if any)
        
    Yields:
        Bytes to stream to client
    """
    # Craft appropriate message based on context
    if source_files:
        if len(source_files) == 1:
            message = f"Lo siento, no pude encontrar una respuesta a tu pregunta en el documento '{source_files[0]}'. ¿Podrías intentar reformularla?"
        else:
            message = "Lo siento, no pude encontrar una respuesta en los documentos que seleccionaste. ¿Quizás puedas reformular tu pregunta?"
    else:
        message = "Lo siento, no encontré información relevante en los documentos disponibles para responder a tu pregunta. Te sugiero reformularla con otras palabras."
    
    yield message.encode("utf-8")
    yield "|||JSON_START|||".encode("utf-8")
    yield json.dumps({
        "highlighted_source": None,
        "corrected_query": corrected_query
    }).encode("utf-8")


async def stream_search_response(
    search_engine: SearchEngine,
    query: str,
    context: str,
    chat_history: str,
    api_key: Optional[str],
    token_updater,
    corrected_query: Optional[str]
) -> AsyncGenerator[bytes, None]:
    """
    Generate and stream the AI response.
    
    Args:
        search_engine: Search engine instance
        query: User's search query
        context: Retrieved document context
        chat_history: Formatted chat history
        api_key: User's Gemini API key (if any)
        token_updater: Function to update token usage
        corrected_query: Spell-corrected query (if any)
        
    Yields:
        Bytes to stream to client
    """
    full_answer_buffer = []
    
    # Stream AI-generated response
    async for chunk in search_engine.generate_answer(
        query=query,
        context=context,
        chat_history=chat_history,
        api_key=api_key,
        on_token_usage=token_updater
    ):
        full_answer_buffer.append(chunk)
        yield chunk.encode("utf-8")
    
    # Highlight relevant sentences in the source
    generated_answer = "".join(full_answer_buffer)
    highlighted_source = search_engine._highlight_relevant_sentences(
        generated_answer,
        context
    )
    
    # Send metadata
    yield "|||JSON_START|||".encode("utf-8")
    yield json.dumps({
        "highlighted_source": highlighted_source,
        "corrected_query": corrected_query
    }).encode("utf-8")


def perform_hybrid_search(
    db: Session,
    embedding_system: AdvancedEmbeddingSystem,
    search_engine: SearchEngine,
    query: str,
    top_k: int,
    owner_id: int,
    source_files: Optional[List[str]]
) -> List[Dict[str, Any]]:
    """
    Perform hybrid semantic + keyword search.
    
    Returns:
        List of search results
    """
    query_embedding = embedding_system.create_embeddings([query])[0]
    
    return search_engine.hybrid_search(
        db=db,
        query_embedding=query_embedding,
        query_text=query,
        top_k=top_k,
        owner_id=owner_id,
        source_files=source_files
    )

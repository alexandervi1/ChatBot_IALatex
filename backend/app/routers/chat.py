"""
Chat Router Module.
Handles semantic search, copilot, and PDF compilation endpoints.

Following Clean Code principles:
- Single Responsibility: Each endpoint has one job
- Meaningful Names: Clear function and variable names
- Small Functions: Complex logic extracted to helpers
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session
import json
import tempfile
import subprocess
import os
import re
import logging

from app import schemas
from database import models
from database.connection import get_db
from services import auth_service
from services.embedding_system import AdvancedEmbeddingSystem
from services.search_engine import SearchEngine
from app.dependencies import get_search_engine, get_embedding_system
from config import ErrorMessages, StreamingConfig

logger = logging.getLogger(__name__)
router = APIRouter(
    prefix="/chat",
    tags=["Chat"],
)

# --- Service Instances ---
# Now using dependency injection for singleton instances (see app/dependencies.py)


# --- Helper Functions ---

async def _create_not_found_stream(source_files: Optional[List[str]] = None):
    """
    Generate a 'not found' response stream when no documents match.
    
    Args:
        source_files: List of files that were searched (if any)
        
    Yields:
        Encoded bytes for streaming response
    """
    if source_files:
        if len(source_files) == 1:
            message = f"Lo siento, no pude encontrar una respuesta en el documento '{source_files[0]}'. ¿Podrías reformular tu pregunta?"
        else:
            message = ErrorMessages.NO_DOCUMENTS_SELECTED
    else:
        message = ErrorMessages.NO_DOCUMENTS
    
    yield message.encode("utf-8")
    yield StreamingConfig.JSON_SEPARATOR.encode("utf-8")
    yield json.dumps({"highlighted_source": None, "corrected_query": None}).encode("utf-8")


# --- Endpoints ---

@router.post(
    "/search",
    summary="Búsqueda semántica con IA",
    description="Realiza búsqueda híbrida (semántica + palabras clave) en documentos del usuario y genera respuesta con IA.",
    responses={
        200: {"description": "Respuesta streaming con respuesta generada por IA"},
        500: {"description": "Error interno durante la búsqueda"}
    }
)
async def search_endpoint(
    request: schemas.SearchQuery,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user),
    search_engine: SearchEngine = Depends(get_search_engine),
    embedding_system: AdvancedEmbeddingSystem = Depends(get_embedding_system)
):
    """
    Semantic search endpoint with AI-generated responses.
    
    Performs hybrid search (semantic + keyword) on user's documents,
    then generates an AI response based on the found context.
    
    Args:
        request: Search query with optional filters
        db: Database session
        current_user: Authenticated user
        
    Returns:
        StreamingResponse with AI-generated answer
    """
    try:
        query = request.query
        
        # Clean source file names (remove surrounding quotes)
        source_files = None
        if request.source_files:
            source_files = [sf.strip('"') for sf in request.source_files]
            logger.debug(f"Filtered source files: {source_files}")

        # Generate embedding and perform hybrid search (using injected singletons)
        query_embedding = embedding_system.create_embeddings([query])[0]
        search_results = search_engine.hybrid_search(
            db=db, 
            query_embedding=query_embedding, 
            query_text=query, 
            top_k=request.top_k,
            owner_id=current_user.id,
            source_files=source_files
        )
        
        # Handle no results
        if not search_results:
            return StreamingResponse(
                _create_not_found_stream(source_files),
                media_type=StreamingConfig.MEDIA_TYPE
            )
            
        context = "\n---\n".join([result['content'] for result in search_results])
        formatted_chat_history = "\n".join([f"{msg.role}: {msg.content}" for msg in request.chat_history])

        async def update_token_usage(tokens: int):
            try:
                current_user.token_usage += tokens
                db.add(current_user)
                # Run commit in thread to avoid blocking loop too much (though session is sync)
                # Ideally we should use AsyncSession, but for now we stick to the pattern.
                # Since we are in async context, we should be careful. 
                # Simple commit here is fine for this scale.
                db.commit() 
            except Exception as e:
                logger.error(f"Error updating token usage: {e}")

        async def generate_and_stream_response():
            full_answer_buffer = []
            async for chunk in search_engine.generate_answer(
                query=query,  # Fixed: was final_query which doesn't exist
                context=context, 
                chat_history=formatted_chat_history,
                api_key=current_user.decrypted_api_key,
                provider=current_user.ai_provider or "gemini",
                model=current_user.ai_model,
                on_token_usage=update_token_usage
            ):
                full_answer_buffer.append(chunk)
                yield chunk.encode("utf-8")
            
            generated_answer = "".join(full_answer_buffer)
            highlighted_source = search_engine._highlight_relevant_sentences(generated_answer, context)
            
            yield "|||JSON_START|||".encode("utf-8")
            yield json.dumps({"highlighted_source": highlighted_source, "corrected_query": query}).encode("utf-8")

        return StreamingResponse(generate_and_stream_response(), media_type="text/event-stream")

    except Exception as e:
        logger.error(f"Error crítico en el endpoint de búsqueda para la consulta '{request.query}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Ocurrió un error interno del servidor durante la búsqueda.")

@router.post(
    "/copilot", 
    tags=["Copilot"],
    summary="Asistente de LaTeX con IA",
    description="Genera o modifica contenido LaTeX basado en instrucciones del usuario y contexto de documentos.",
    responses={
        200: {"description": "Respuesta streaming con LaTeX generado"},
        500: {"description": "Error en el copiloto"}
    }
)
async def copilot_endpoint(
    request: schemas.CopilotRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user),
    search_engine: SearchEngine = Depends(get_search_engine),
    embedding_system: AdvancedEmbeddingSystem = Depends(get_embedding_system)
):
    """
    AI-powered copilot for LaTeX document writing.
    
    Uses document context to help users draft and edit LaTeX content
    based on their instructions.
    
    Args:
        request: Text, instruction and source files
        db: Database session
        current_user: Authenticated user
        
    Returns:
        StreamingResponse with AI-generated LaTeX
    """
    try:
        COPILOT_TOP_K = 6  # Number of context chunks for copilot
        context_query = f"{request.instruction}\n\n{request.text[-1000:]}" 
        query_embedding = embedding_system.create_embeddings([context_query])[0]
        search_results = search_engine.hybrid_search(
            db=db, 
            query_embedding=query_embedding, 
            query_text=context_query, 
            top_k=COPILOT_TOP_K,
            owner_id=current_user.id,
            source_files=request.source_files
        )
        
        context = "\n---\n".join([f"[Documento: {result.get('chunk_metadata', {}).get('source_file', 'Desconocido')}]\n{result['content']}" for result in search_results])

        async def update_token_usage(tokens: int):
            try:
                current_user.token_usage += tokens
                db.add(current_user)
                db.commit()
            except Exception as e:
                logger.error(f"Error updating token usage: {e}")

        async def generate_and_stream_copilot_response():
            async for chunk in search_engine.generate_copilot_answer(
                request.text, 
                request.instruction, 
                context,
                api_key=current_user.decrypted_api_key,
                provider=current_user.ai_provider or "gemini",
                model=current_user.ai_model,
                on_token_usage=update_token_usage,
                selected_files=request.source_files
            ):
                yield chunk.encode("utf-8")

        return StreamingResponse(generate_and_stream_copilot_response(), media_type="text/event-stream")

    except Exception as e:
        logger.error(f"Error crítico en el endpoint de copiloto: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.COPILOT_ERROR)


def _parse_latex_error(error_log: str) -> str:
    """
    Parse pdflatex error output to extract user-friendly error message.
    
    Args:
        error_log: Raw stdout from pdflatex
        
    Returns:
        Formatted error message with line number if available
    """
    error_lines = error_log.split('\n')
    
    try:
        # Find error message line (starts with !)
        error_message_line = next(
            (line for line in error_lines if line.strip().startswith('!')), 
            None
        )
        # Find line context (starts with l.)
        line_context_line = next(
            (line for line in error_lines if line.strip().startswith('l.')), 
            None
        )
        
        if error_message_line and line_context_line:
            match = re.search(r'^l\.(\d+)', line_context_line.strip())
            line_num = match.group(1) if match else 'desconocida'
            clean_error = error_message_line.strip().lstrip('! ')
            clean_context = line_context_line.strip()
            return f"Error en la línea {line_num}: {clean_error}\nContexto: {clean_context}"
        elif error_message_line:
            return error_message_line.strip().lstrip('! ')
        else:
            return "Error desconocido en la compilación. Revisa el código LaTeX."
            
    except Exception:
        return ErrorMessages.PDF_COMPILE_ERROR


@router.post(
    "/compile-pdf", 
    tags=["Copilot"],
    summary="Compilar LaTeX a PDF",
    description="Compila código LaTeX y retorna el PDF generado. Requiere pdflatex instalado en el servidor.",
    responses={
        200: {"description": "PDF generado exitosamente", "content": {"application/pdf": {}}},
        400: {"description": "Error de compilación LaTeX"},
        500: {"description": "Error al generar PDF"}
    }
)
async def compile_pdf_endpoint(request: schemas.CopilotRequest) -> Response:
    """
    Compile LaTeX code to PDF.
    
    Takes LaTeX source code and compiles it using pdflatex,
    returning the generated PDF file.
    
    Args:
        request: Contains LaTeX source in 'text' field
        
    Returns:
        Response with PDF content
        
    Raises:
        HTTPException: 400 if LaTeX compilation fails
        HTTPException: 500 if PDF generation fails
    """
    with tempfile.TemporaryDirectory() as tempdir:
        tex_path = os.path.join(tempdir, "document.tex")
        pdf_path = os.path.join(tempdir, "document.pdf")

        # Write LaTeX source to temp file
        with open(tex_path, "w", encoding="utf-8") as f:
            f.write(request.text)

        # Compile with pdflatex
        process = subprocess.run(
            ["pdflatex", "-output-directory", tempdir, "-interaction=nonstopmode", tex_path],
            capture_output=True,
            text=True
        )

        # Handle compilation errors
        if process.returncode != 0:
            logger.error(f"pdflatex error: {process.stdout[:500]}")
            error_message = _parse_latex_error(process.stdout)
            raise HTTPException(status_code=400, detail=error_message)

        # Return PDF if generated
        if os.path.exists(pdf_path):
            with open(pdf_path, "rb") as f:
                pdf_bytes = f.read()
            return Response(content=pdf_bytes, media_type="application/pdf")
        else:
            raise HTTPException(
                status_code=500, 
                detail="No se pudo generar el archivo PDF."
            )


@router.post(
    "/feedback",
    summary="Enviar feedback",
    description="Almacena feedback del usuario sobre una respuesta del chatbot para mejorar el sistema.",
    responses={
        200: {"description": "Feedback recibido exitosamente"}
    }
)
async def post_feedback(
    feedback: schemas.FeedbackRequest,
    db: Session = Depends(get_db)
) -> dict:
    """
    Store user feedback for a chat interaction.
    
    Args:
        feedback: User's feedback including query, answer, and rating
        db: Database session
        
    Returns:
        Success message confirmation
    """
    db_feedback = models.Feedback(
        query=feedback.query,
        answer=feedback.answer,
        feedback_type=feedback.feedback_type,
        comment=feedback.comment
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    
    return {"message": "Feedback recibido exitosamente!", "id": db_feedback.id}


@router.get(
    "/search-image",
    summary="Buscar imagen ilustrativa",
    description="Busca una imagen relevante en fuentes confiables (Wikipedia, Wikimedia, etc.)",
    responses={
        200: {"description": "URL de imagen encontrada"},
        404: {"description": "No se encontró imagen"}
    }
)
async def search_image_endpoint(
    query: str,
    search_engine: SearchEngine = Depends(get_search_engine)
):
    """
    Search for an illustrative image from reliable sources.
    
    Args:
        query: Search term (preferably in English)
        search_engine: Search engine instance
        
    Returns:
        JSON with image_url and source
    """
    try:
        image_url, source = search_engine._search_image(query)
        
        if image_url:
            return {
                "success": True,
                "image_url": image_url,
                "source": source,
                "query": query
            }
        else:
            return {
                "success": False,
                "image_url": None,
                "source": None,
                "query": query
            }
    except Exception as e:
        logger.error(f"Error searching image: {e}")
        return {
            "success": False,
            "image_url": None,
            "source": None,
            "query": query
        }


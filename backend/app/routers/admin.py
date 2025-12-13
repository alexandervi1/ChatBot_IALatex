"""
Admin Router Module.
Handles user management, analytics, logs, and document administration.

Following Clean Code principles:
- DRY: Reusable admin dependency
- SRP: Each endpoint has single responsibility
- Centralized error messages
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime, timedelta
import logging

from database import models
from database.connection import get_db
from app import schemas
from services import auth_service
from services.audit_service import AuditService, AuditAction
from config import ErrorMessages
from utils.encryption import encrypt_value

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/admin",
    tags=["Administración"],
    responses={404: {"description": "Not found"}},
)


async def get_current_admin_user(
    current_user: models.User = Depends(auth_service.get_current_active_user)
) -> models.User:
    """
    Dependency to verify admin privileges.
    
    Args:
        current_user: The authenticated user
        
    Returns:
        The user if they have admin role
        
    Raises:
        HTTPException: 403 if user is not admin
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=ErrorMessages.ADMIN_REQUIRED
        )
    return current_user


@router.get("/users", response_model=List[schemas.UserPublic])
async def list_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_admin_user)
) -> List[models.User]:
    """
    List all registered users with pagination.
    
    Args:
        skip: Number of records to skip
        limit: Maximum records to return
        
    Returns:
        List of users
    """
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@router.put("/users/{user_id}", response_model=schemas.UserPublic)
async def update_user_admin(
    user_id: int, 
    user_update: schemas.UserAdminUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_admin_user)
):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if user_update.role is not None:
        db_user.role = user_update.role
    if user_update.gemini_api_key is not None:
        # Encrypt API key before storing (same as in auth.py)
        if user_update.gemini_api_key:
            try:
                db_user.gemini_api_key = encrypt_value(user_update.gemini_api_key)
                logger.info(f"Admin encrypted API key for user {user_id}")
            except Exception as e:
                logger.warning(f"Encryption not available: {e}")
                db_user.gemini_api_key = user_update.gemini_api_key
        else:
            db_user.gemini_api_key = None
    if user_update.full_name is not None:
        db_user.full_name = user_update.full_name
        
    db.commit()
    db.refresh(db_user)
    
    # Audit: admin modified user
    changes = {}
    if user_update.role is not None:
        changes["role"] = user_update.role
    if user_update.full_name is not None:
        changes["full_name"] = user_update.full_name
    if user_update.gemini_api_key is not None:
        changes["api_key"] = "changed"
    
    AuditService(db).log_admin_action(
        admin_id=current_user.id,
        target_user_id=user_id,
        action_type="role_changed" if "role" in changes else "modified",
        changes=changes
    )
    
    return db_user

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_admin_user)
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propia cuenta de administrador")
        
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Eliminar documentos asociados primero (cascade manual si no está en DB)
    db.query(models.Document).filter(models.Document.owner_id == user_id).delete()
    
    # Capture email before deletion for audit
    deleted_email = db_user.email
    
    db.delete(db_user)
    db.commit()
    
    # Audit: admin deleted user
    AuditService(db).log_admin_action(
        admin_id=current_user.id,
        target_user_id=user_id,
        action_type="deleted",
        changes={"email": deleted_email}
    )
    
    return {"message": "Usuario eliminado exitosamente"}

class PasswordResetRequest(schemas.BaseModel):
    password: str

@router.put("/users/{user_id}/password")
async def reset_user_password(
    user_id: int,
    password_request: PasswordResetRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    """Reset a user's password (admin only). Fully audited for security."""
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    db_user.hashed_password = auth_service.get_password_hash(password_request.password)
    db.commit()
    
    # Audit: password reset by admin (critical security action)
    AuditService(db).log(
        action=AuditAction.PASSWORD_RESET,
        user_id=current_user.id,
        details={
            "target_user_id": user_id,
            "target_email": db_user.email
        },
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    
    return {"message": "Contraseña actualizada exitosamente"}

# ===== ANALYTICS DASHBOARD =====
@router.get("/analytics")
async def get_analytics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    """Obtiene métricas y estadísticas del sistema para el dashboard."""
    
    total_users = db.query(models.User).count()
    total_documents = db.query(models.Document).count()
    total_feedback = db.query(models.Feedback).count()
    
    # Usuarios con API key configurada
    users_with_api_key = db.query(models.User).filter(models.User.gemini_api_key.isnot(None)).count()
    
    # Top 5 usuarios con más documentos
    top_users = db.query(
        models.User.id,
        models.User.email,
        models.User.full_name,
        func.count(models.Document.id).label('doc_count')
    ).join(models.Document, models.User.id == models.Document.owner_id, isouter=True)\
     .group_by(models.User.id)\
     .order_by(desc('doc_count'))\
     .limit(5).all()
    
    # Estadísticas de roles
    role_stats = db.query(
        models.User.role,
        func.count(models.User.id).label('count')
    ).group_by(models.User.role).all()
    
    return {
        "total_users": total_users,
        "total_documents": total_documents,
        "total_feedback": total_feedback,
        "users_with_api_key": users_with_api_key,
        "top_users": [
            {
                "id": u.id,
                "email": u.email,
                "full_name": u.full_name,
                "document_count": u.doc_count
            } for u in top_users
        ],
        "role_distribution": [
            {"role": r.role, "count": r.count} for r in role_stats
        ]
    }

# ===== ACTIVITY LOGS =====
@router.get("/logs")
async def get_activity_logs(
    skip: int = 0,
    limit: int = 50,
    action: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    """Obtiene los logs de actividad del sistema con filtros opcionales."""
    
    query = db.query(models.ActivityLog)
    
    if action:
        query = query.filter(models.ActivityLog.action == action)
    if user_id:
        query = query.filter(models.ActivityLog.user_id == user_id)
    
    total = query.count()
    logs = query.order_by(desc(models.ActivityLog.timestamp)).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "logs": [
            {
                "id": log.id,
                "user_id": log.user_id,
                "action": log.action,
                "details": log.details,
                "ip_address": log.ip_address,
                "timestamp": log.timestamp
            } for log in logs
        ]
    }

# ===== DOCUMENT MANAGEMENT =====
@router.get("/documents")
async def get_all_documents(
    skip: int = 0,
    limit: int = 50,
    owner_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    """Obtiene todos los documentos del sistema con filtros."""
    
    query = db.query(models.Document)
    
    if owner_id:
        query = query.filter(models.Document.owner_id == owner_id)
    
    total = query.count()
    
    # Agrupar por archivo fuente
    documents_grouped = db.query(
        models.Document.owner_id,
        models.Document.chunk_metadata['source_file'].astext.label('source_file'),
        func.count(models.Document.id).label('chunk_count'),
        func.max(models.Document.id).label('latest_id')
    ).group_by(
        models.Document.owner_id,
        models.Document.chunk_metadata['source_file'].astext
    ).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "documents": [
            {
                "owner_id": doc.owner_id,
                "source_file": doc.source_file,
                "chunk_count": doc.chunk_count
            } for doc in documents_grouped
        ]
    }

@router.delete("/documents/source/{owner_id}/{source_file}")
async def delete_document_by_source(
    owner_id: int,
    source_file: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    """Elimina todos los chunks de un archivo fuente específico."""
    
    deleted_count = db.query(models.Document).filter(
        models.Document.owner_id == owner_id,
        models.Document.chunk_metadata['source_file'].astext == source_file
    ).delete(synchronize_session=False)
    
    db.commit()
    
    return {
        "message": f"Eliminados {deleted_count} chunks del archivo {source_file}",
        "deleted_count": deleted_count
    }

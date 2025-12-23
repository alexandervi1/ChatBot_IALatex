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

@router.get("/analytics/timeseries")
async def get_analytics_timeseries(
    days: int = Query(7, ge=1, le=30, description="Días de datos a obtener (1-30)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    """
    Obtiene datos de series temporales para gráficos del dashboard.
    
    Returns:
        - activity_by_day: Logins, documentos subidos, mensajes por día
        - documents_by_type: Distribución de documentos por tipo de archivo
        - tokens_by_provider: Uso de tokens por proveedor de IA
        - hourly_activity: Actividad por hora del día (últimas 24h)
    """
    from collections import defaultdict
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # ===== Actividad por día =====
    # Logs de actividad agrupados por día
    activity_logs = db.query(
        func.date(models.ActivityLog.timestamp).label('date'),
        models.ActivityLog.action,
        func.count(models.ActivityLog.id).label('count')
    ).filter(
        models.ActivityLog.timestamp >= start_date
    ).group_by(
        func.date(models.ActivityLog.timestamp),
        models.ActivityLog.action
    ).all()
    
    # Construir estructura de datos por día
    activity_by_day = defaultdict(lambda: {"logins": 0, "documents": 0, "chats": 0, "date": None})
    
    for log in activity_logs:
        date_str = log.date.isoformat() if log.date else None
        if date_str:
            activity_by_day[date_str]["date"] = date_str
            if log.action in ["login", "LOGIN"]:
                activity_by_day[date_str]["logins"] += log.count
            elif log.action in ["document_upload", "DOCUMENT_UPLOAD"]:
                activity_by_day[date_str]["documents"] += log.count
            elif log.action in ["chat", "CHAT"]:
                activity_by_day[date_str]["chats"] += log.count
    
    # Rellenar días sin actividad
    activity_result = []
    for i in range(days):
        day = (start_date + timedelta(days=i)).date()
        day_str = day.isoformat()
        if day_str in activity_by_day:
            activity_result.append(activity_by_day[day_str])
        else:
            activity_result.append({
                "date": day_str,
                "logins": 0,
                "documents": 0,
                "chats": 0
            })
    
    # ===== Documentos por tipo =====
    # Obtener tipos de documentos desde metadata
    all_docs = db.query(
        models.Document.chunk_metadata['source_file'].astext.label('source_file')
    ).distinct().all()
    
    type_counts = defaultdict(int)
    for doc in all_docs:
        if doc.source_file:
            ext = doc.source_file.split('.')[-1].lower() if '.' in doc.source_file else 'unknown'
            type_counts[ext] += 1
    
    documents_by_type = [
        {"type": ext.upper(), "count": count, "color": get_color_for_type(ext)}
        for ext, count in type_counts.items()
    ]
    
    # ===== Usuarios registrados por día =====
    # Nota: Si el modelo User tiene campo created_at, usarlo
    # Por ahora simulamos con distribución uniforme
    total_users = db.query(models.User).count()
    users_by_day = []
    cumulative = 0
    avg_per_day = max(1, total_users // days)
    
    for i in range(days):
        day = (start_date + timedelta(days=i)).date()
        # Simular crecimiento gradual
        daily_new = avg_per_day if i < days - 1 else total_users - cumulative
        cumulative += daily_new
        users_by_day.append({
            "date": day.isoformat(),
            "users": min(cumulative, total_users),
            "new_users": daily_new
        })
    
    # ===== Actividad por hora (últimas 24h) =====
    last_24h = end_date - timedelta(hours=24)
    hourly_logs = db.query(
        func.extract('hour', models.ActivityLog.timestamp).label('hour'),
        func.count(models.ActivityLog.id).label('count')
    ).filter(
        models.ActivityLog.timestamp >= last_24h
    ).group_by(
        func.extract('hour', models.ActivityLog.timestamp)
    ).all()
    
    hourly_activity = [{"hour": h, "activity": 0} for h in range(24)]
    for log in hourly_logs:
        if log.hour is not None:
            hourly_activity[int(log.hour)]["activity"] = log.count
    
    return {
        "period": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat(),
            "days": days
        },
        "activity_by_day": activity_result,
        "documents_by_type": documents_by_type,
        "users_growth": users_by_day,
        "hourly_activity": hourly_activity
    }


def get_color_for_type(ext: str) -> str:
    """Retorna un color para cada tipo de archivo."""
    colors = {
        "pdf": "#E53935",
        "docx": "#1E88E5",
        "doc": "#1565C0",
        "txt": "#43A047",
        "pptx": "#FB8C00",
        "ppt": "#EF6C00",
        "xlsx": "#2E7D32",
        "xls": "#1B5E20",
        "md": "#6D4C41",
        "tex": "#7B1FA2",
        "unknown": "#9E9E9E"
    }
    return colors.get(ext.lower(), "#757575")


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


# ===== SYSTEM ALERTS =====

@router.get("/alerts")
async def get_system_alerts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    """
    Genera alertas automáticas basadas en el estado del sistema.
    
    Tipos de alertas:
    - warning: Advertencias que requieren atención
    - error: Errores críticos que necesitan acción inmediata
    - info: Información general del sistema
    """
    alerts = []
    
    # ===== Usuarios sin API Key (más de 7 días) =====
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    users_without_api = db.query(models.User).filter(
        models.User.gemini_api_key.is_(None)
    ).count()
    
    if users_without_api > 0:
        alerts.append({
            "id": "users_no_api",
            "type": "warning",
            "title": "Usuarios sin API Key",
            "message": f"{users_without_api} usuario(s) no tienen API Key configurada",
            "action": "Revisar en la pestaña de Usuarios",
            "priority": 2,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    # ===== Errores recientes en logs (últimas 24h) =====
    last_24h = datetime.utcnow() - timedelta(hours=24)
    error_logs = db.query(models.ActivityLog).filter(
        models.ActivityLog.timestamp >= last_24h,
        models.ActivityLog.action.ilike('%error%')
    ).count()
    
    if error_logs > 0:
        alerts.append({
            "id": "recent_errors",
            "type": "error",
            "title": "Errores Recientes",
            "message": f"{error_logs} error(es) registrado(s) en las últimas 24 horas",
            "action": "Revisar en la pestaña de Logs",
            "priority": 1,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    # ===== Usuarios con alto uso de tokens =====
    high_token_users = db.query(models.User).filter(
        models.User.token_usage > 100000
    ).count()
    
    if high_token_users > 0:
        alerts.append({
            "id": "high_token_usage",
            "type": "info",
            "title": "Alto Uso de Tokens",
            "message": f"{high_token_users} usuario(s) superan 100K tokens",
            "action": "Considerar revisar límites",
            "priority": 3,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    # ===== Documentos grandes (más de 100 chunks) =====
    large_docs = db.query(
        models.Document.chunk_metadata['source_file'].astext.label('source_file'),
        func.count(models.Document.id).label('chunk_count')
    ).group_by(
        models.Document.chunk_metadata['source_file'].astext
    ).having(
        func.count(models.Document.id) > 100
    ).count()
    
    if large_docs > 0:
        alerts.append({
            "id": "large_documents",
            "type": "info",
            "title": "Documentos Grandes",
            "message": f"{large_docs} documento(s) tienen más de 100 chunks",
            "action": "Puede afectar el rendimiento de búsqueda",
            "priority": 4,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    # ===== Estadísticas generales como info =====
    total_users = db.query(models.User).count()
    total_docs = db.query(models.Document).count()
    
    if total_users > 0 and total_docs == 0:
        alerts.append({
            "id": "no_documents",
            "type": "info",
            "title": "Sin Documentos",
            "message": "El sistema tiene usuarios pero ningún documento procesado",
            "action": "Los usuarios pueden subir documentos desde el chat",
            "priority": 5,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    # Ordenar por prioridad (menor = más importante)
    alerts.sort(key=lambda x: x.get("priority", 99))
    
    return {
        "alerts": alerts,
        "count": len(alerts),
        "has_critical": any(a["type"] == "error" for a in alerts),
        "generated_at": datetime.utcnow().isoformat()
    }


# ===== SYSTEM CONFIGURATION =====

# In-memory config storage (in production, use database or config file)
_system_config = {
    "rate_limits": {
        "anonymous": 30,
        "user": 100,
        "admin": 1000
    },
    "max_file_size_mb": 50,
    "max_tokens_per_user": 500000,
    "allowed_providers": ["gemini", "openai", "anthropic"],
    "log_retention_days": 90,
    "enable_analytics": True,
    "maintenance_mode": False
}

@router.get("/config")
async def get_system_config(
    current_user: models.User = Depends(get_current_admin_user)
):
    """
    Obtiene la configuración actual del sistema.
    """
    return {
        "config": _system_config,
        "last_updated": datetime.utcnow().isoformat()
    }


@router.put("/config")
async def update_system_config(
    config_update: dict,
    current_user: models.User = Depends(get_current_admin_user)
):
    """
    Actualiza la configuración del sistema.
    Solo actualiza las claves proporcionadas.
    """
    global _system_config
    
    # Validate and update only allowed keys
    allowed_keys = set(_system_config.keys())
    
    for key, value in config_update.items():
        if key in allowed_keys:
            # Type validation
            if key == "rate_limits" and isinstance(value, dict):
                _system_config[key].update(value)
            elif key == "allowed_providers" and isinstance(value, list):
                _system_config[key] = value
            elif key in ["max_file_size_mb", "max_tokens_per_user", "log_retention_days"]:
                if isinstance(value, (int, float)):
                    _system_config[key] = int(value)
            elif key in ["enable_analytics", "maintenance_mode"]:
                if isinstance(value, bool):
                    _system_config[key] = value
    
    logger.info(f"Admin {current_user.email} updated system config: {list(config_update.keys())}")
    
    return {
        "message": "Configuración actualizada",
        "config": _system_config
    }


@router.get("/config/health")
async def get_system_health(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    """
    Obtiene el estado de salud del sistema.
    """
    import psutil
    
    # System metrics
    cpu_percent = psutil.cpu_percent(interval=0.1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    # Database stats
    total_users = db.query(models.User).count()
    total_documents = db.query(models.Document).count()
    total_logs = db.query(models.ActivityLog).count()
    
    return {
        "status": "healthy" if not _system_config.get("maintenance_mode") else "maintenance",
        "system": {
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "memory_used_gb": round(memory.used / (1024**3), 2),
            "memory_total_gb": round(memory.total / (1024**3), 2),
            "disk_percent": disk.percent,
            "disk_used_gb": round(disk.used / (1024**3), 2),
            "disk_total_gb": round(disk.total / (1024**3), 2)
        },
        "database": {
            "total_users": total_users,
            "total_documents": total_documents,
            "total_logs": total_logs
        },
        "timestamp": datetime.utcnow().isoformat()
    }



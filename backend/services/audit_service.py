"""
Audit Service Module.

Provides comprehensive logging for sensitive actions and security events.
All actions are stored in the activity_logs table for compliance and analysis.

Features:
- Automatic user and request context capture
- Categorized action types
- IP address and user agent tracking
- Async-friendly design

Usage:
    from services.audit_service import AuditService, AuditAction
    
    audit = AuditService(db)
    await audit.log(AuditAction.LOGIN, user_id=1, details={"ip": "..."})
"""
import logging
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from database import models

logger = logging.getLogger(__name__)


class AuditAction(str, Enum):
    """
    Enumeration of auditable actions.
    
    Categorized by sensitivity level:
    - AUTH: Authentication events
    - DATA: Data access/modification
    - ADMIN: Administrative actions
    - SECURITY: Security-related events
    """
    # Authentication
    LOGIN = "auth.login"
    LOGIN_FAILED = "auth.login_failed"
    LOGOUT = "auth.logout"
    LOGOUT_ALL = "auth.logout_all"
    TOKEN_REFRESH = "auth.token_refresh"
    TOKEN_REVOKED = "auth.token_revoked"
    PASSWORD_CHANGED = "auth.password_changed"
    PASSWORD_RESET = "auth.password_reset"
    
    # User Management
    USER_REGISTERED = "user.registered"
    USER_UPDATED = "user.updated"
    USER_DELETED = "user.deleted"
    API_KEY_CHANGED = "user.api_key_changed"
    
    # Document Operations
    DOCUMENT_UPLOADED = "document.uploaded"
    DOCUMENT_DELETED = "document.deleted"
    DOCUMENT_ACCESSED = "document.accessed"
    
    # Admin Actions
    ADMIN_USER_CREATED = "admin.user_created"
    ADMIN_USER_MODIFIED = "admin.user_modified"
    ADMIN_USER_DELETED = "admin.user_deleted"
    ADMIN_ROLE_CHANGED = "admin.role_changed"
    ADMIN_DOCUMENT_DELETED = "admin.document_deleted"
    
    # Security Events
    SUSPICIOUS_ACTIVITY = "security.suspicious"
    TOKEN_REUSE_DETECTED = "security.token_reuse"
    RATE_LIMIT_EXCEEDED = "security.rate_limit"
    UNAUTHORIZED_ACCESS = "security.unauthorized"


class AuditService:
    """
    Service for logging auditable actions.
    
    Handles creation of activity log entries with full context.
    Thread-safe and async-compatible.
    
    Attributes:
        db: Database session
    """
    
    def __init__(self, db: Session):
        """
        Initialize audit service.
        
        Args:
            db: SQLAlchemy database session
        """
        self.db = db
    
    def log(
        self,
        action: AuditAction,
        user_id: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> models.ActivityLog:
        """
        Log an auditable action.
        
        Args:
            action: The action being logged
            user_id: ID of the user performing the action (None for system)
            details: Additional context as dict
            ip_address: Client IP address
            user_agent: Client user agent string
            
        Returns:
            The created ActivityLog record
        """
        # Build details with metadata
        full_details = details.copy() if details else {}
        if user_agent:
            full_details["user_agent"] = user_agent
        
        # Create log entry
        log_entry = models.ActivityLog(
            user_id=user_id,
            action=action.value,
            details=full_details if full_details else None,
            ip_address=ip_address,
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        
        self.db.add(log_entry)
        self.db.commit()
        
        # Also log to application logger for real-time monitoring
        log_level = logging.WARNING if self._is_security_event(action) else logging.INFO
        logger.log(
            log_level,
            f"AUDIT: {action.value}",
            extra={
                "audit_action": action.value,
                "user_id": user_id,
                "ip_address": ip_address,
                "details": details
            }
        )
        
        return log_entry
    
    def _is_security_event(self, action: AuditAction) -> bool:
        """Check if action is a security event that needs higher visibility."""
        security_actions = {
            AuditAction.LOGIN_FAILED,
            AuditAction.SUSPICIOUS_ACTIVITY,
            AuditAction.TOKEN_REUSE_DETECTED,
            AuditAction.RATE_LIMIT_EXCEEDED,
            AuditAction.UNAUTHORIZED_ACCESS,
            AuditAction.PASSWORD_RESET,
            AuditAction.ADMIN_USER_DELETED,
            AuditAction.ADMIN_ROLE_CHANGED,
        }
        return action in security_actions
    
    def log_login(
        self,
        user_id: int,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        success: bool = True
    ) -> models.ActivityLog:
        """
        Log a login attempt.
        
        Args:
            user_id: ID of the user attempting login
            ip_address: Client IP
            user_agent: Client browser info
            success: Whether login was successful
            
        Returns:
            The created ActivityLog record
        """
        action = AuditAction.LOGIN if success else AuditAction.LOGIN_FAILED
        return self.log(
            action=action,
            user_id=user_id if success else None,
            details={"attempted_user_id": user_id} if not success else None,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    def log_logout(
        self,
        user_id: int,
        logout_all: bool = False,
        ip_address: Optional[str] = None
    ) -> models.ActivityLog:
        """
        Log a logout event.
        
        Args:
            user_id: ID of the user logging out
            logout_all: Whether all sessions were terminated
            ip_address: Client IP
            
        Returns:
            The created ActivityLog record
        """
        action = AuditAction.LOGOUT_ALL if logout_all else AuditAction.LOGOUT
        return self.log(
            action=action,
            user_id=user_id,
            ip_address=ip_address
        )
    
    def log_document_action(
        self,
        user_id: int,
        filename: str,
        action_type: str,  # "uploaded", "deleted", "accessed"
        ip_address: Optional[str] = None
    ) -> models.ActivityLog:
        """
        Log a document-related action.
        
        Args:
            user_id: ID of the user
            filename: Name of the document
            action_type: Type of action (uploaded, deleted, accessed)
            ip_address: Client IP
            
        Returns:
            The created ActivityLog record
        """
        action_map = {
            "uploaded": AuditAction.DOCUMENT_UPLOADED,
            "deleted": AuditAction.DOCUMENT_DELETED,
            "accessed": AuditAction.DOCUMENT_ACCESSED,
        }
        action = action_map.get(action_type, AuditAction.DOCUMENT_ACCESSED)
        
        return self.log(
            action=action,
            user_id=user_id,
            details={"filename": filename},
            ip_address=ip_address
        )
    
    def log_admin_action(
        self,
        admin_id: int,
        target_user_id: int,
        action_type: str,
        changes: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ) -> models.ActivityLog:
        """
        Log an administrative action on a user.
        
        Args:
            admin_id: ID of the admin performing action
            target_user_id: ID of the affected user
            action_type: Type of admin action
            changes: What was changed
            ip_address: Client IP
            
        Returns:
            The created ActivityLog record
        """
        action_map = {
            "created": AuditAction.ADMIN_USER_CREATED,
            "modified": AuditAction.ADMIN_USER_MODIFIED,
            "deleted": AuditAction.ADMIN_USER_DELETED,
            "role_changed": AuditAction.ADMIN_ROLE_CHANGED,
            "document_deleted": AuditAction.ADMIN_DOCUMENT_DELETED,
        }
        action = action_map.get(action_type, AuditAction.ADMIN_USER_MODIFIED)
        
        details = {
            "target_user_id": target_user_id,
        }
        if changes:
            details["changes"] = changes
        
        return self.log(
            action=action,
            user_id=admin_id,
            details=details,
            ip_address=ip_address
        )
    
    def log_security_event(
        self,
        event_type: str,
        user_id: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ) -> models.ActivityLog:
        """
        Log a security-related event.
        
        Args:
            event_type: Type of security event
            user_id: Related user ID if applicable
            details: Event details
            ip_address: Source IP
            
        Returns:
            The created ActivityLog record
        """
        action_map = {
            "suspicious": AuditAction.SUSPICIOUS_ACTIVITY,
            "token_reuse": AuditAction.TOKEN_REUSE_DETECTED,
            "rate_limit": AuditAction.RATE_LIMIT_EXCEEDED,
            "unauthorized": AuditAction.UNAUTHORIZED_ACCESS,
        }
        action = action_map.get(event_type, AuditAction.SUSPICIOUS_ACTIVITY)
        
        return self.log(
            action=action,
            user_id=user_id,
            details=details,
            ip_address=ip_address
        )


# --- Helper function for quick access ---

def create_audit_log(
    db: Session,
    action: AuditAction,
    user_id: Optional[int] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None
) -> models.ActivityLog:
    """
    Quick helper to create an audit log entry.
    
    Args:
        db: Database session
        action: The action to log
        user_id: User performing action
        details: Additional context
        ip_address: Client IP
        
    Returns:
        The created ActivityLog record
    """
    service = AuditService(db)
    return service.log(
        action=action,
        user_id=user_id,
        details=details,
        ip_address=ip_address
    )

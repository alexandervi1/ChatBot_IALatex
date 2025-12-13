# backend/services/auth_service.py
"""
Authentication Service Module.
Handles password hashing, JWT token creation, and user authentication.

Security features:
- BCrypt password hashing (72-byte limit)
- JWT with configurable expiration
- Secure token validation
- Refresh token rotation with family tracking

Following Clean Code principles:
- Single Responsibility: Each function has one job
- Meaningful error messages
- Type hints throughout
"""
import os
import secrets
import hashlib
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from database.connection import get_db
from database import models

logger = logging.getLogger(__name__)

# --- Configuración --- 

# SEGURIDAD: JWT_SECRET_KEY es OBLIGATORIA - debe configurarse en .env
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise ValueError(
        "CRÍTICO: JWT_SECRET_KEY no está configurada. "
        "Debe definirla en el archivo .env con un valor seguro de al menos 32 caracteres."
    )
if len(SECRET_KEY) < 32:
    raise ValueError(
        f"CRÍTICO: JWT_SECRET_KEY debe tener al menos 32 caracteres (actual: {len(SECRET_KEY)}). "
        "Genere una clave segura con: python -c \"import secrets; print(secrets.token_hex(32))\""
    )
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # Reduced from 24h for security
REFRESH_TOKEN_EXPIRE_DAYS = 7    # Refresh tokens last 7 days

# Esquema de seguridad para obtener el token de las cabeceras
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Contexto para el hasheo de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Funciones de Contraseña ---

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    # Genera un hash seguro de la contraseña usando bcrypt
    # Nota: bcrypt trunca contraseñas a 72 bytes
    return pwd_context.hash(password[:72])

# --- Funciones de JWT ---

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    # Crea un token JWT con tiempo de expiracion
    # Codifica los datos del usuario (claims) en el token
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- Dependencia para obtener el usuario actual ---

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: models.User = Depends(get_current_user)) -> models.User:
    # En un futuro, aquí se podría comprobar si el usuario está activo (ej. no baneado)
    # Por ahora, solo devolvemos el usuario si existe.
    return current_user


# --- Refresh Token Functions ---

def _hash_token(token: str) -> str:
    """Hash a token using SHA-256 for secure storage."""
    return hashlib.sha256(token.encode()).hexdigest()


def create_refresh_token(
    db: Session,
    user_id: int,
    family_id: Optional[str] = None,
    user_agent: Optional[str] = None,
    ip_address: Optional[str] = None
) -> Tuple[str, datetime]:
    """
    Create a new refresh token for a user.
    
    Args:
        db: Database session
        user_id: ID of the user
        family_id: Token family ID for rotation tracking (created if None)
        user_agent: Browser/device info
        ip_address: Client IP address
        
    Returns:
        Tuple of (plain_token, expires_at)
        
    Note:
        Only the hashed token is stored in the database.
        The plain token is returned once and must be sent to the client.
    """
    # Generate secure random token
    plain_token = secrets.token_urlsafe(32)
    token_hash = _hash_token(plain_token)
    
    # Create family ID if not provided (new login)
    if family_id is None:
        family_id = secrets.token_urlsafe(16)
    
    # Calculate expiration
    expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    # Create database record
    refresh_token = models.RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        family_id=family_id,
        expires_at=expires_at.isoformat(),
        user_agent=user_agent,
        ip_address=ip_address,
        created_at=datetime.now(timezone.utc).isoformat()
    )
    
    db.add(refresh_token)
    db.commit()
    
    logger.info(f"Created refresh token for user {user_id}, family {family_id}")
    
    return plain_token, expires_at


def verify_refresh_token(
    db: Session,
    token: str
) -> Optional[models.RefreshToken]:
    """
    Verify a refresh token and return the token record if valid.
    
    Args:
        db: Database session
        token: Plain refresh token from client
        
    Returns:
        RefreshToken record if valid, None otherwise
    """
    token_hash = _hash_token(token)
    
    # Find token by hash
    db_token = db.query(models.RefreshToken).filter(
        models.RefreshToken.token_hash == token_hash
    ).first()
    
    if not db_token:
        logger.warning("Refresh token not found")
        return None
    
    # Check if revoked
    if db_token.is_revoked:
        logger.warning(f"Attempted use of revoked token, family {db_token.family_id}")
        # Potential token theft! Revoke entire family
        revoke_token_family(db, db_token.family_id)
        return None
    
    # Check expiration
    expires_at = datetime.fromisoformat(db_token.expires_at.replace('Z', '+00:00'))
    if datetime.now(timezone.utc) > expires_at:
        logger.info(f"Refresh token expired for user {db_token.user_id}")
        return None
    
    return db_token


def rotate_refresh_token(
    db: Session,
    old_token: str,
    user_agent: Optional[str] = None,
    ip_address: Optional[str] = None
) -> Optional[Tuple[str, str, datetime]]:
    """
    Rotate a refresh token (use once and generate new one).
    
    Implements secure token rotation:
    1. Verify and invalidate the old token
    2. Generate a new token in the same family
    3. Return new tokens
    
    Args:
        db: Database session
        old_token: Current refresh token
        user_agent: Browser/device info
        ip_address: Client IP address
        
    Returns:
        Tuple of (new_access_token, new_refresh_token, refresh_expires_at)
        or None if verification fails
    """
    # Verify old token
    db_token = verify_refresh_token(db, old_token)
    if not db_token:
        return None
    
    # Mark old token as used (soft revoke - reuse detection)
    db_token.is_revoked = 1
    db_token.revoked_at = datetime.now(timezone.utc).isoformat()
    
    # Get user
    user = db.query(models.User).filter(models.User.id == db_token.user_id).first()
    if not user:
        logger.error(f"User {db_token.user_id} not found during token rotation")
        return None
    
    # Create new refresh token in same family
    new_refresh_token, refresh_expires = create_refresh_token(
        db=db,
        user_id=user.id,
        family_id=db_token.family_id,
        user_agent=user_agent,
        ip_address=ip_address
    )
    
    # Create new access token
    new_access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    logger.info(f"Rotated refresh token for user {user.id}")
    
    return new_access_token, new_refresh_token, refresh_expires


def revoke_token_family(db: Session, family_id: str) -> int:
    """
    Revoke all tokens in a family (for logout or security).
    
    Args:
        db: Database session
        family_id: Token family to revoke
        
    Returns:
        Number of tokens revoked
    """
    now = datetime.now(timezone.utc).isoformat()
    
    result = db.query(models.RefreshToken).filter(
        models.RefreshToken.family_id == family_id,
        models.RefreshToken.is_revoked == 0
    ).update({
        "is_revoked": 1,
        "revoked_at": now
    })
    
    db.commit()
    
    logger.info(f"Revoked {result} tokens in family {family_id}")
    return result


def revoke_all_user_tokens(db: Session, user_id: int) -> int:
    """
    Revoke all refresh tokens for a user (logout everywhere).
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        Number of tokens revoked
    """
    now = datetime.now(timezone.utc).isoformat()
    
    result = db.query(models.RefreshToken).filter(
        models.RefreshToken.user_id == user_id,
        models.RefreshToken.is_revoked == 0
    ).update({
        "is_revoked": 1,
        "revoked_at": now
    })
    
    db.commit()
    
    logger.info(f"Revoked all {result} tokens for user {user_id}")
    return result


def cleanup_expired_tokens(db: Session) -> int:
    """
    Clean up expired refresh tokens from the database.
    
    Should be run periodically (e.g., daily via cron/celery).
    
    Args:
        db: Database session
        
    Returns:
        Number of tokens deleted
    """
    cutoff = datetime.now(timezone.utc).isoformat()
    
    result = db.query(models.RefreshToken).filter(
        models.RefreshToken.expires_at < cutoff
    ).delete()
    
    db.commit()
    
    logger.info(f"Cleaned up {result} expired refresh tokens")
    return result


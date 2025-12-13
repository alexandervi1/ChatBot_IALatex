from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
import logging
from pydantic import BaseModel

from app import schemas
from database import models
from database.connection import get_db
from services import auth_service
from services.audit_service import AuditService, AuditAction
from utils.encryption import encrypt_value

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/auth",
    tags=["Autenticación"],
)


# --- Request/Response Schemas for Tokens ---

class TokenWithRefresh(BaseModel):
    """Response with both access and refresh tokens."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # Access token lifetime in seconds


class RefreshRequest(BaseModel):
    """Request body for token refresh."""
    refresh_token: str


class LogoutRequest(BaseModel):
    """Request body for logout (optional refresh token)."""
    refresh_token: str | None = None


# --- Endpoints ---

# Endpoint para registrar nuevos usuarios
# Verifica si el email ya existe antes de crear el usuario
@router.post("/register", response_model=schemas.UserPublic, status_code=status.HTTP_201_CREATED)
async def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado",
        )
    hashed_password = auth_service.get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password, full_name=user.full_name)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Audit: user registration
    AuditService(db).log(
        action=AuditAction.USER_REGISTERED,
        user_id=db_user.id,
        details={"email": user.email}
    )
    
    return db_user


# Endpoint para iniciar sesion y obtener tokens (access + refresh)
@router.post("/login", response_model=TokenWithRefresh)
async def login_for_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    """
    Login with email and password.
    
    Returns both access token (short-lived) and refresh token (long-lived).
    Use the refresh token to get new tokens without re-authenticating.
    """
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth_service.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=auth_service.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_service.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    # Create refresh token
    user_agent = request.headers.get("User-Agent")
    ip_address = request.client.host if request.client else None
    
    refresh_token, _ = auth_service.create_refresh_token(
        db=db,
        user_id=user.id,
        user_agent=user_agent,
        ip_address=ip_address
    )
    
    logger.info(f"User {user.id} logged in from {ip_address}")
    
    # Audit: successful login
    AuditService(db).log_login(
        user_id=user.id,
        ip_address=ip_address,
        user_agent=user_agent,
        success=True
    )
    
    return TokenWithRefresh(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=auth_service.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/refresh", response_model=TokenWithRefresh)
async def refresh_tokens(
    request: Request,
    refresh_request: RefreshRequest,
    db: Session = Depends(get_db)
):
    """
    Exchange a valid refresh token for new access and refresh tokens.
    
    Implements secure token rotation:
    - The old refresh token is invalidated
    - A new refresh token is issued (same family)
    - If the old token was already used, all tokens in the family are revoked
    """
    user_agent = request.headers.get("User-Agent")
    ip_address = request.client.host if request.client else None
    
    result = auth_service.rotate_refresh_token(
        db=db,
        old_token=refresh_request.refresh_token,
        user_agent=user_agent,
        ip_address=ip_address
    )
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de refresco inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    new_access_token, new_refresh_token, _ = result
    
    return TokenWithRefresh(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        expires_in=auth_service.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/logout")
async def logout(
    logout_request: LogoutRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    """
    Logout and invalidate tokens.
    
    If refresh_token is provided, only revokes that token family.
    Otherwise, revokes all refresh tokens for the user (logout everywhere).
    """
    if logout_request.refresh_token:
        # Revoke specific token family
        db_token = auth_service.verify_refresh_token(db, logout_request.refresh_token)
        if db_token:
            auth_service.revoke_token_family(db, db_token.family_id)
            logger.info(f"User {current_user.id} logged out (family revoked)")
    else:
        # Revoke all tokens
        auth_service.revoke_all_user_tokens(db, current_user.id)
        logger.info(f"User {current_user.id} logged out everywhere")
    
    return {"message": "Sesión cerrada exitosamente"}


@router.get("/users/me", response_model=schemas.UserPublic)
async def read_users_me(current_user: models.User = Depends(auth_service.get_current_active_user)):
    return current_user


@router.put("/users/me", response_model=schemas.UserPublic)
async def update_user_me(user_update: schemas.UserUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth_service.get_current_active_user)):
    if user_update.gemini_api_key is not None:
        # Encrypt API key before storing in database
        try:
            encrypted_key = encrypt_value(user_update.gemini_api_key) if user_update.gemini_api_key else ""
            current_user.gemini_api_key = encrypted_key
            logger.info(f"API key encrypted and saved for user {current_user.id}")
        except Exception as e:
            logger.warning(f"Encryption not available, storing plain key: {e}")
            # Fallback to plain storage if encryption not configured
            current_user.gemini_api_key = user_update.gemini_api_key
    if user_update.ai_provider is not None:
        current_user.ai_provider = user_update.ai_provider
    if user_update.ai_model is not None:
        current_user.ai_model = user_update.ai_model
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

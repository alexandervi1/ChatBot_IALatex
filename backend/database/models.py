from sqlalchemy import Column, Integer, String, JSON, func, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import TSVECTOR
from pgvector.sqlalchemy import Vector
from .connection import Base
import logging

logger = logging.getLogger(__name__)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    # Keep original column name for backwards compatibility with existing database
    # Value is encrypted using Fernet (see utils/encryption.py)
    gemini_api_key = Column(String, nullable=True)
    ai_provider = Column(String, default="gemini")  # gemini, openai, anthropic
    ai_model = Column(String, nullable=True)  # Optional: specific model override
    full_name = Column(String, nullable=True)
    role = Column(String, default="user")
    token_usage = Column(Integer, default=0)

    @property
    def has_api_key(self) -> bool:
        return bool(self.gemini_api_key)

    @property
    def decrypted_api_key(self) -> str | None:
        """
        Get the decrypted API key.
        
        Returns the decrypted key if encrypted, or the plain key
        if it's not encrypted (for backwards compatibility during migration).
        """
        if not self.gemini_api_key:
            return None
        
        try:
            from utils.encryption import decrypt_value, is_encrypted
            
            if is_encrypted(self.gemini_api_key):
                return decrypt_value(self.gemini_api_key)
            else:
                # Legacy: key was stored in plaintext
                return self.gemini_api_key
        except Exception as e:
            logger.warning(f"Could not decrypt API key for user {self.id}: {e}")
            # Return as-is (might be plaintext from before encryption)
            return self.gemini_api_key

    documents = relationship("Document", back_populates="owner")

class Document(Base):
    """
    Modelo ORM para la tabla que almacenará los chunks de documentos y sus embeddings.
    """
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(String, nullable=False)
    chunk_metadata = Column(JSON, nullable=False)
    embedding = Column(Vector(384))
    search_vector = Column(TSVECTOR, nullable=True)
    
    # Foreign Key para vincular con el usuario
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="documents")

class Feedback(Base):
    """
    Modelo ORM para almacenar el feedback de los usuarios sobre las respuestas del chatbot.
    """
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    query = Column(String, nullable=False)
    answer = Column(String, nullable=False)
    feedback_type = Column(String, nullable=False)  # e.g., 'positive', 'negative'
    comment = Column(String, nullable=True)

class ActivityLog(Base):
    """
    Modelo ORM para registrar actividades del sistema y auditoría.
    """
    __tablename__ = "activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Nullable para acciones del sistema
    action = Column(String, nullable=False, index=True)  # 'login', 'upload_document', 'admin_action', etc.
    details = Column(JSON, nullable=True)  # Información adicional en formato JSON
    ip_address = Column(String, nullable=True)
    timestamp = Column(String, nullable=False, default=func.now(), index=True)
    
    # Relación con usuario
    user = relationship("User", foreign_keys=[user_id])


class RefreshToken(Base):
    """
    Modelo ORM para almacenar refresh tokens.
    
    Implements secure token rotation:
    - Each refresh token can only be used once
    - Old tokens are automatically invalidated when rotated
    - Tokens have expiration dates
    - Tokens can be manually revoked
    
    Security Features:
    - Token value is hashed (only stored as hash)
    - Family tracking for token chains
    - Revocation cascades to entire family
    """
    __tablename__ = "refresh_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Token hash (never store plain token)
    token_hash = Column(String, nullable=False, unique=True, index=True)
    
    # Token family for rotation tracking
    # All tokens from the same login share a family_id
    # If one is reused, all in family are revoked (compromise detection)
    family_id = Column(String, nullable=False, index=True)
    
    # Expiration
    expires_at = Column(String, nullable=False)  # ISO format datetime
    
    # Revocation
    is_revoked = Column(Integer, default=0)  # 0 = valid, 1 = revoked (SQLite compatible)
    revoked_at = Column(String, nullable=True)
    
    # Metadata
    created_at = Column(String, nullable=False, default=func.now())
    user_agent = Column(String, nullable=True)  # Browser/device info
    ip_address = Column(String, nullable=True)
    
    # Relation
    user = relationship("User", foreign_keys=[user_id])


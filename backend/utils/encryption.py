"""
Encryption Utilities for Sensitive Data.

Provides functions for encrypting and decrypting sensitive information
like API keys using Fernet symmetric encryption.

Security Features:
- Derives encryption key from a secret using PBKDF2
- Uses Fernet (AES-128-CBC with HMAC) for encryption
- Salt ensures unique keys per deployment

Usage:
    from utils.encryption import encrypt_value, decrypt_value
    
    encrypted = encrypt_value("my-api-key")
    original = decrypt_value(encrypted)
"""
import os
import base64
import logging
from typing import Optional
from functools import lru_cache

from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

logger = logging.getLogger(__name__)


def _get_encryption_secret() -> bytes:
    """
    Get the encryption secret from environment.
    
    Falls back to SECRET_KEY if ENCRYPTION_KEY is not set.
    This ensures backwards compatibility.
    
    Returns:
        bytes: The secret used for key derivation
        
    Raises:
        ValueError: If no secret is configured
    """
    secret = os.getenv("ENCRYPTION_KEY") or os.getenv("SECRET_KEY")
    
    if not secret:
        raise ValueError(
            "ENCRYPTION_KEY or SECRET_KEY environment variable must be set "
            "for API key encryption. Generate a secure key with: "
            "python -c \"import secrets; print(secrets.token_urlsafe(32))\""
        )
    
    return secret.encode()


def _get_salt() -> bytes:
    """
    Get encryption salt from environment.
    
    Uses a default salt if not configured, but a unique salt
    per deployment is recommended for production.
    
    Returns:
        bytes: Salt for key derivation
    """
    salt = os.getenv("ENCRYPTION_SALT", "chatbot-ia-premium-default-salt-v1")
    return salt.encode()


@lru_cache(maxsize=1)
def _get_fernet() -> Fernet:
    """
    Create and cache a Fernet encryption instance.
    
    Uses PBKDF2 to derive a secure key from the secret.
    Cached to avoid repeated key derivation.
    
    Returns:
        Fernet: Configured encryption instance
    """
    secret = _get_encryption_secret()
    salt = _get_salt()
    
    # Use PBKDF2 to derive a key from the secret
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,  # Fernet requires 32 bytes (256 bits)
        salt=salt,
        iterations=480000,  # OWASP recommended minimum for 2024
    )
    
    # Derive key and encode for Fernet
    key = base64.urlsafe_b64encode(kdf.derive(secret))
    
    return Fernet(key)


def encrypt_value(plaintext: str) -> str:
    """
    Encrypt a plaintext value.
    
    Args:
        plaintext: The value to encrypt (e.g., an API key)
        
    Returns:
        str: Base64-encoded encrypted value
        
    Example:
        >>> encrypted = encrypt_value("sk-abc123")
        >>> print(encrypted)  # Will be base64 encoded ciphertext
    """
    if not plaintext:
        return ""
    
    try:
        fernet = _get_fernet()
        encrypted = fernet.encrypt(plaintext.encode())
        return encrypted.decode()
    except Exception as e:
        logger.error(f"Encryption failed: {e}")
        raise


def decrypt_value(ciphertext: str) -> Optional[str]:
    """
    Decrypt an encrypted value.
    
    Args:
        ciphertext: Base64-encoded encrypted value
        
    Returns:
        str: Decrypted plaintext, or None if decryption fails
        
    Example:
        >>> original = decrypt_value(encrypted)
        >>> print(original)  # "sk-abc123"
    """
    if not ciphertext:
        return None
    
    try:
        fernet = _get_fernet()
        decrypted = fernet.decrypt(ciphertext.encode())
        return decrypted.decode()
    except InvalidToken:
        logger.warning("Failed to decrypt value - invalid token or wrong key")
        return None
    except Exception as e:
        logger.error(f"Decryption failed: {e}")
        return None


def is_encrypted(value: str) -> bool:
    """
    Check if a value appears to be encrypted (Fernet format).
    
    Fernet tokens start with 'gAAAAA'. This is used to detect
    if migration from plaintext to encrypted is needed.
    
    Args:
        value: The value to check
        
    Returns:
        bool: True if value appears to be Fernet encrypted
    """
    if not value:
        return False
    
    # Fernet tokens start with version byte (0x80) which encodes to 'gA'
    return value.startswith("gAAAAA")


def encrypt_if_needed(value: str) -> str:
    """
    Encrypt a value only if it's not already encrypted.
    
    Useful for migration scripts where some values might
    already be encrypted.
    
    Args:
        value: Value to potentially encrypt
        
    Returns:
        str: Encrypted value (unchanged if already encrypted)
    """
    if not value:
        return value
    
    if is_encrypted(value):
        return value
    
    return encrypt_value(value)

"""
Tests for the encryption utilities module.

These tests verify the security-critical encryption and decryption
functionality used to protect sensitive data like API keys.
"""
import os
import pytest
from unittest.mock import patch


# Set test environment variable before importing the module
@pytest.fixture(autouse=True)
def set_test_encryption_key(monkeypatch):
    """Set a test encryption key for all tests."""
    monkeypatch.setenv("ENCRYPTION_KEY", "test-secret-key-for-encryption-tests-32")
    monkeypatch.setenv("ENCRYPTION_SALT", "test-salt-for-encryption")
    # Clear the cached Fernet instance
    from utils.encryption import _get_fernet
    _get_fernet.cache_clear()


class TestEncryption:
    """Tests for the encrypt_value function."""

    def test_encrypt_returns_string(self):
        """Encrypted values should be strings."""
        from utils.encryption import encrypt_value
        
        result = encrypt_value("my-api-key")
        
        assert isinstance(result, str)
        assert len(result) > 0

    def test_encrypt_empty_string_returns_empty(self):
        """Empty strings should return empty strings without encryption."""
        from utils.encryption import encrypt_value
        
        result = encrypt_value("")
        
        assert result == ""

    def test_encrypt_produces_different_output(self):
        """Same input should produce different ciphertext (due to IV)."""
        from utils.encryption import encrypt_value
        
        result1 = encrypt_value("same-value")
        result2 = encrypt_value("same-value")
        
        # Fernet uses a random IV, so outputs should differ
        assert result1 != result2

    def test_encrypt_produces_fernet_format(self):
        """Encrypted values should be in Fernet format (starts with gAAAAA)."""
        from utils.encryption import encrypt_value
        
        result = encrypt_value("test-api-key")
        
        assert result.startswith("gAAAAA")


class TestDecryption:
    """Tests for the decrypt_value function."""

    def test_decrypt_reverses_encryption(self):
        """Decryption should reverse encryption."""
        from utils.encryption import encrypt_value, decrypt_value
        
        original = "sk-my-secret-api-key-12345"
        encrypted = encrypt_value(original)
        decrypted = decrypt_value(encrypted)
        
        assert decrypted == original

    def test_decrypt_empty_returns_none(self):
        """Empty or None input should return None."""
        from utils.encryption import decrypt_value
        
        assert decrypt_value("") is None
        assert decrypt_value(None) is None

    def test_decrypt_invalid_token_returns_none(self):
        """Invalid ciphertext should return None, not raise exception."""
        from utils.encryption import decrypt_value
        
        result = decrypt_value("not-a-valid-fernet-token")
        
        assert result is None

    def test_decrypt_with_wrong_key_returns_none(self, monkeypatch):
        """Decryption with wrong key should fail gracefully."""
        from utils.encryption import encrypt_value, decrypt_value, _get_fernet
        
        # Encrypt with current key
        encrypted = encrypt_value("secret-data")
        
        # Change the key
        monkeypatch.setenv("ENCRYPTION_KEY", "different-key-for-testing-32char")
        _get_fernet.cache_clear()
        
        # Attempt decryption with new key should fail
        result = decrypt_value(encrypted)
        
        assert result is None

    def test_decrypt_preserves_special_characters(self):
        """Decryption should preserve special characters."""
        from utils.encryption import encrypt_value, decrypt_value
        
        original = "api-key-with-spëcíäl-chars-!@#$%^&*()"
        encrypted = encrypt_value(original)
        decrypted = decrypt_value(encrypted)
        
        assert decrypted == original

    def test_decrypt_preserves_unicode(self):
        """Decryption should preserve unicode characters."""
        from utils.encryption import encrypt_value, decrypt_value
        
        original = "key-with-unicode-中文日本語한국어🔐"
        encrypted = encrypt_value(original)
        decrypted = decrypt_value(encrypted)
        
        assert decrypted == original


class TestIsEncrypted:
    """Tests for the is_encrypted detection function."""

    def test_is_encrypted_detects_fernet_tokens(self):
        """Should detect Fernet-encrypted values."""
        from utils.encryption import encrypt_value, is_encrypted
        
        encrypted = encrypt_value("api-key")
        
        assert is_encrypted(encrypted) is True

    def test_is_encrypted_rejects_plaintext(self):
        """Should reject plaintext values."""
        from utils.encryption import is_encrypted
        
        assert is_encrypted("sk-plaintext-api-key") is False
        assert is_encrypted("AIzaSy...") is False

    def test_is_encrypted_handles_empty(self):
        """Should handle empty values."""
        from utils.encryption import is_encrypted
        
        assert is_encrypted("") is False
        assert is_encrypted(None) is False


class TestEncryptIfNeeded:
    """Tests for the encrypt_if_needed migration helper."""

    def test_encrypt_if_needed_encrypts_plaintext(self):
        """Should encrypt plaintext values."""
        from utils.encryption import encrypt_if_needed, is_encrypted
        
        result = encrypt_if_needed("plaintext-api-key")
        
        assert is_encrypted(result)

    def test_encrypt_if_needed_preserves_encrypted(self):
        """Should not re-encrypt already encrypted values."""
        from utils.encryption import encrypt_value, encrypt_if_needed
        
        encrypted = encrypt_value("my-key")
        result = encrypt_if_needed(encrypted)
        
        assert result == encrypted

    def test_encrypt_if_needed_handles_empty(self):
        """Should handle empty values."""
        from utils.encryption import encrypt_if_needed
        
        assert encrypt_if_needed("") == ""
        assert encrypt_if_needed(None) is None


class TestKeyConfiguration:
    """Tests for encryption key configuration."""

    def test_missing_key_raises_error(self, monkeypatch):
        """Should raise ValueError if no encryption key is configured."""
        from utils.encryption import _get_fernet, _get_encryption_secret
        
        monkeypatch.delenv("ENCRYPTION_KEY", raising=False)
        monkeypatch.delenv("SECRET_KEY", raising=False)
        _get_fernet.cache_clear()
        
        with pytest.raises(ValueError) as exc_info:
            _get_encryption_secret()
        
        assert "ENCRYPTION_KEY" in str(exc_info.value)

    def test_uses_secret_key_as_fallback(self, monkeypatch):
        """Should use SECRET_KEY if ENCRYPTION_KEY is not set."""
        from utils.encryption import _get_fernet, _get_encryption_secret
        
        monkeypatch.delenv("ENCRYPTION_KEY", raising=False)
        monkeypatch.setenv("SECRET_KEY", "fallback-secret-key-for-tests")
        _get_fernet.cache_clear()
        
        # Should not raise
        secret = _get_encryption_secret()
        assert secret == b"fallback-secret-key-for-tests"


class TestRoundTrip:
    """Integration tests for full encryption/decryption cycles."""

    @pytest.mark.parametrize("value", [
        "simple-key",
        "a" * 1000,  # Long value
        "key-with-newlines\n\nand\ttabs",
        "key-with-quotes-'single'-\"double\"",
        "",  # Edge case: empty
    ])
    def test_roundtrip_various_values(self, value):
        """Various values should survive encryption/decryption roundtrip."""
        from utils.encryption import encrypt_value, decrypt_value
        
        if value == "":
            assert encrypt_value(value) == ""
        else:
            encrypted = encrypt_value(value)
            decrypted = decrypt_value(encrypted)
            assert decrypted == value

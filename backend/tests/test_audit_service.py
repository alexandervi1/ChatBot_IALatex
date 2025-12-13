"""
Tests for the Audit Service module.

These tests verify that security-critical audit logging functionality
works correctly for compliance and security monitoring.
"""
import pytest
from datetime import datetime
from unittest.mock import MagicMock, patch

# Test mode to avoid actual database operations
import os
os.environ["TEST_MODE"] = "True"


class MockActivityLog:
    """Mock ActivityLog model for testing."""
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)
        self.id = 1


@pytest.fixture
def mock_db():
    """Create a mock database session."""
    db = MagicMock()
    db.add = MagicMock()
    db.commit = MagicMock()
    return db


@pytest.fixture
def audit_service(mock_db):
    """Create an AuditService instance with mock database."""
    from services.audit_service import AuditService
    return AuditService(mock_db)


class TestAuditAction:
    """Tests for the AuditAction enum."""

    def test_auth_actions_exist(self):
        """All authentication actions should be defined."""
        from services.audit_service import AuditAction
        
        assert AuditAction.LOGIN.value == "auth.login"
        assert AuditAction.LOGIN_FAILED.value == "auth.login_failed"
        assert AuditAction.LOGOUT.value == "auth.logout"
        assert AuditAction.LOGOUT_ALL.value == "auth.logout_all"

    def test_security_actions_exist(self):
        """All security actions should be defined."""
        from services.audit_service import AuditAction
        
        assert AuditAction.SUSPICIOUS_ACTIVITY.value == "security.suspicious"
        assert AuditAction.TOKEN_REUSE_DETECTED.value == "security.token_reuse"
        assert AuditAction.RATE_LIMIT_EXCEEDED.value == "security.rate_limit"
        assert AuditAction.UNAUTHORIZED_ACCESS.value == "security.unauthorized"

    def test_admin_actions_exist(self):
        """All admin actions should be defined."""
        from services.audit_service import AuditAction
        
        assert AuditAction.ADMIN_USER_CREATED.value == "admin.user_created"
        assert AuditAction.ADMIN_USER_MODIFIED.value == "admin.user_modified"
        assert AuditAction.ADMIN_USER_DELETED.value == "admin.user_deleted"
        assert AuditAction.ADMIN_ROLE_CHANGED.value == "admin.role_changed"


class TestAuditServiceLog:
    """Tests for the main log() method."""

    def test_log_creates_activity_log(self, audit_service, mock_db):
        """Should create an ActivityLog entry."""
        from services.audit_service import AuditAction
        
        with patch('services.audit_service.models') as mock_models:
            mock_models.ActivityLog = MockActivityLog
            
            result = audit_service.log(
                action=AuditAction.LOGIN,
                user_id=123,
                ip_address="192.168.1.1"
            )
            
            mock_db.add.assert_called_once()
            mock_db.commit.assert_called_once()

    def test_log_includes_user_agent_in_details(self, audit_service):
        """User agent should be stored in details."""
        from services.audit_service import AuditAction
        
        with patch('services.audit_service.models') as mock_models:
            mock_models.ActivityLog = MockActivityLog
            
            result = audit_service.log(
                action=AuditAction.LOGIN,
                user_id=1,
                user_agent="Mozilla/5.0 (Windows NT 10.0)"
            )
            
            assert result.details["user_agent"] == "Mozilla/5.0 (Windows NT 10.0)"

    def test_log_includes_custom_details(self, audit_service):
        """Custom details should be preserved."""
        from services.audit_service import AuditAction
        
        with patch('services.audit_service.models') as mock_models:
            mock_models.ActivityLog = MockActivityLog
            
            result = audit_service.log(
                action=AuditAction.API_KEY_CHANGED,
                user_id=1,
                details={"provider": "openai"}
            )
            
            assert result.details["provider"] == "openai"


class TestSecurityEventDetection:
    """Tests for security event classification."""

    def test_security_events_flagged_correctly(self, audit_service):
        """Security events should be correctly identified."""
        from services.audit_service import AuditAction
        
        security_actions = [
            AuditAction.LOGIN_FAILED,
            AuditAction.SUSPICIOUS_ACTIVITY,
            AuditAction.TOKEN_REUSE_DETECTED,
            AuditAction.RATE_LIMIT_EXCEEDED,
            AuditAction.UNAUTHORIZED_ACCESS,
        ]
        
        for action in security_actions:
            assert audit_service._is_security_event(action) is True

    def test_normal_events_not_flagged(self, audit_service):
        """Normal events should not be flagged as security events."""
        from services.audit_service import AuditAction
        
        normal_actions = [
            AuditAction.LOGIN,
            AuditAction.LOGOUT,
            AuditAction.DOCUMENT_UPLOADED,
            AuditAction.USER_UPDATED,
        ]
        
        for action in normal_actions:
            assert audit_service._is_security_event(action) is False


class TestLoginLogging:
    """Tests for login-specific logging."""

    def test_successful_login_logged(self, audit_service):
        """Successful logins should be logged with LOGIN action."""
        from services.audit_service import AuditAction
        
        with patch('services.audit_service.models') as mock_models:
            mock_models.ActivityLog = MockActivityLog
            
            result = audit_service.log_login(
                user_id=1,
                ip_address="10.0.0.1",
                success=True
            )
            
            assert result.action == AuditAction.LOGIN.value
            assert result.user_id == 1

    def test_failed_login_logged(self, audit_service):
        """Failed logins should be logged with LOGIN_FAILED action."""
        from services.audit_service import AuditAction
        
        with patch('services.audit_service.models') as mock_models:
            mock_models.ActivityLog = MockActivityLog
            
            result = audit_service.log_login(
                user_id=1,
                ip_address="10.0.0.1",
                success=False
            )
            
            assert result.action == AuditAction.LOGIN_FAILED.value
            # Failed login should NOT set user_id in log
            assert result.user_id is None
            # But should include attempted user in details
            assert result.details["attempted_user_id"] == 1


class TestLogoutLogging:
    """Tests for logout-specific logging."""

    def test_single_session_logout(self, audit_service):
        """Single session logout should use LOGOUT action."""
        from services.audit_service import AuditAction
        
        with patch('services.audit_service.models') as mock_models:
            mock_models.ActivityLog = MockActivityLog
            
            result = audit_service.log_logout(user_id=1, logout_all=False)
            
            assert result.action == AuditAction.LOGOUT.value

    def test_all_sessions_logout(self, audit_service):
        """Logout all should use LOGOUT_ALL action."""
        from services.audit_service import AuditAction
        
        with patch('services.audit_service.models') as mock_models:
            mock_models.ActivityLog = MockActivityLog
            
            result = audit_service.log_logout(user_id=1, logout_all=True)
            
            assert result.action == AuditAction.LOGOUT_ALL.value


class TestDocumentLogging:
    """Tests for document-related logging."""

    def test_document_upload_logged(self, audit_service):
        """Document uploads should be logged correctly."""
        from services.audit_service import AuditAction
        
        with patch('services.audit_service.models') as mock_models:
            mock_models.ActivityLog = MockActivityLog
            
            result = audit_service.log_document_action(
                user_id=1,
                filename="report.pdf",
                action_type="uploaded"
            )
            
            assert result.action == AuditAction.DOCUMENT_UPLOADED.value
            assert result.details["filename"] == "report.pdf"

    def test_document_delete_logged(self, audit_service):
        """Document deletions should be logged correctly."""
        from services.audit_service import AuditAction
        
        with patch('services.audit_service.models') as mock_models:
            mock_models.ActivityLog = MockActivityLog
            
            result = audit_service.log_document_action(
                user_id=1,
                filename="old-file.docx",
                action_type="deleted"
            )
            
            assert result.action == AuditAction.DOCUMENT_DELETED.value


class TestAdminLogging:
    """Tests for admin action logging."""

    def test_admin_role_change_logged(self, audit_service):
        """Admin role changes should be logged with details."""
        from services.audit_service import AuditAction
        
        with patch('services.audit_service.models') as mock_models:
            mock_models.ActivityLog = MockActivityLog
            
            result = audit_service.log_admin_action(
                admin_id=1,
                target_user_id=2,
                action_type="role_changed",
                changes={"old_role": "user", "new_role": "admin"}
            )
            
            assert result.action == AuditAction.ADMIN_ROLE_CHANGED.value
            assert result.details["target_user_id"] == 2
            assert result.details["changes"]["old_role"] == "user"

    def test_admin_user_delete_logged(self, audit_service):
        """Admin user deletions should be logged."""
        from services.audit_service import AuditAction
        
        with patch('services.audit_service.models') as mock_models:
            mock_models.ActivityLog = MockActivityLog
            
            result = audit_service.log_admin_action(
                admin_id=1,
                target_user_id=5,
                action_type="deleted"
            )
            
            assert result.action == AuditAction.ADMIN_USER_DELETED.value


class TestSecurityEventLogging:
    """Tests for security event logging."""

    def test_token_reuse_logged(self, audit_service):
        """Token reuse detection should be logged."""
        from services.audit_service import AuditAction
        
        with patch('services.audit_service.models') as mock_models:
            mock_models.ActivityLog = MockActivityLog
            
            result = audit_service.log_security_event(
                event_type="token_reuse",
                user_id=1,
                details={"family_id": "abc123"},
                ip_address="192.168.1.100"
            )
            
            assert result.action == AuditAction.TOKEN_REUSE_DETECTED.value
            assert result.details["family_id"] == "abc123"

    def test_rate_limit_logged(self, audit_service):
        """Rate limit exceeded should be logged."""
        from services.audit_service import AuditAction
        
        with patch('services.audit_service.models') as mock_models:
            mock_models.ActivityLog = MockActivityLog
            
            result = audit_service.log_security_event(
                event_type="rate_limit",
                ip_address="10.0.0.50"
            )
            
            assert result.action == AuditAction.RATE_LIMIT_EXCEEDED.value


class TestHelperFunction:
    """Tests for the create_audit_log helper function."""

    def test_helper_creates_log(self, mock_db):
        """Helper function should create log entries."""
        from services.audit_service import create_audit_log, AuditAction
        
        with patch('services.audit_service.models') as mock_models:
            mock_models.ActivityLog = MockActivityLog
            
            result = create_audit_log(
                db=mock_db,
                action=AuditAction.USER_REGISTERED,
                user_id=1,
                details={"email": "test@example.com"}
            )
            
            assert result.action == AuditAction.USER_REGISTERED.value
            mock_db.add.assert_called_once()
            mock_db.commit.assert_called_once()

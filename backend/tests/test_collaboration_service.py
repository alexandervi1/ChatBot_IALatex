"""
Tests for Collaboration Service

Unit tests for project collaboration features.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
import json

# Import the service being tested
from services.collaboration_service import CollaborationManager


class TestCollaborationManager:
    """Tests for CollaborationManager class."""
    
    @pytest.fixture
    def manager(self):
        """Create a fresh manager instance for each test."""
        return CollaborationManager()
    
    @pytest.fixture
    def mock_websocket(self):
        """Create a mock WebSocket."""
        ws = AsyncMock()
        ws.send_json = AsyncMock()
        ws.close = AsyncMock()
        return ws
    
    # =========================================================================
    # Room Management Tests
    # =========================================================================
    
    def test_create_room(self, manager):
        """Test room creation."""
        project_id = "test-project-123"
        room = manager.create_room(project_id)
        
        assert room is not None
        assert project_id in manager.rooms
        assert manager.rooms[project_id]["connections"] == {}
    
    def test_get_room_nonexistent(self, manager):
        """Test getting a room that doesn't exist."""
        room = manager.get_room("nonexistent")
        assert room is None
    
    def test_get_room_existing(self, manager):
        """Test getting an existing room."""
        project_id = "test-project"
        manager.create_room(project_id)
        
        room = manager.get_room(project_id)
        assert room is not None
    
    # =========================================================================
    # Connection Tests
    # =========================================================================
    
    @pytest.mark.asyncio
    async def test_connect_to_room(self, manager, mock_websocket):
        """Test connecting a user to a room."""
        project_id = "test-project"
        user_id = "user-123"
        
        manager.create_room(project_id)
        await manager.connect(project_id, user_id, mock_websocket)
        
        room = manager.get_room(project_id)
        assert user_id in room["connections"]
        assert room["connections"][user_id] == mock_websocket
    
    @pytest.mark.asyncio
    async def test_connect_auto_creates_room(self, manager, mock_websocket):
        """Test that connecting to a non-existent room creates it."""
        project_id = "new-project"
        user_id = "user-123"
        
        await manager.connect(project_id, user_id, mock_websocket)
        
        assert project_id in manager.rooms
    
    @pytest.mark.asyncio
    async def test_disconnect_from_room(self, manager, mock_websocket):
        """Test disconnecting a user from a room."""
        project_id = "test-project"
        user_id = "user-123"
        
        manager.create_room(project_id)
        await manager.connect(project_id, user_id, mock_websocket)
        await manager.disconnect(project_id, user_id)
        
        room = manager.get_room(project_id)
        assert user_id not in room["connections"]
    
    # =========================================================================
    # Broadcast Tests
    # =========================================================================
    
    @pytest.mark.asyncio
    async def test_broadcast_to_room(self, manager):
        """Test broadcasting message to all users in a room."""
        project_id = "test-project"
        
        # Create mock websockets
        ws1 = AsyncMock()
        ws2 = AsyncMock()
        
        manager.create_room(project_id)
        await manager.connect(project_id, "user1", ws1)
        await manager.connect(project_id, "user2", ws2)
        
        message = {"type": "test", "data": "hello"}
        await manager.broadcast(project_id, message)
        
        ws1.send_json.assert_called_once_with(message)
        ws2.send_json.assert_called_once_with(message)
    
    @pytest.mark.asyncio
    async def test_broadcast_excludes_sender(self, manager):
        """Test broadcasting message excludes the sender."""
        project_id = "test-project"
        
        ws1 = AsyncMock()
        ws2 = AsyncMock()
        
        manager.create_room(project_id)
        await manager.connect(project_id, "user1", ws1)
        await manager.connect(project_id, "user2", ws2)
        
        message = {"type": "test", "data": "hello"}
        await manager.broadcast(project_id, message, exclude="user1")
        
        ws1.send_json.assert_not_called()
        ws2.send_json.assert_called_once_with(message)
    
    # =========================================================================
    # Presence Tests
    # =========================================================================
    
    @pytest.mark.asyncio
    async def test_get_users_in_room(self, manager, mock_websocket):
        """Test getting list of users in a room."""
        project_id = "test-project"
        
        manager.create_room(project_id)
        await manager.connect(project_id, "user1", mock_websocket)
        await manager.connect(project_id, "user2", AsyncMock())
        
        users = manager.get_users(project_id)
        
        assert len(users) == 2
        assert "user1" in users
        assert "user2" in users
    
    def test_get_users_empty_room(self, manager):
        """Test getting users from empty room."""
        project_id = "test-project"
        manager.create_room(project_id)
        
        users = manager.get_users(project_id)
        assert users == []
    
    def test_get_users_nonexistent_room(self, manager):
        """Test getting users from non-existent room."""
        users = manager.get_users("nonexistent")
        assert users == []


class TestCursorSync:
    """Tests for cursor synchronization."""
    
    @pytest.fixture
    def manager(self):
        return CollaborationManager()
    
    @pytest.mark.asyncio
    async def test_update_cursor_position(self, manager):
        """Test updating user cursor position."""
        project_id = "test-project"
        user_id = "user-123"
        
        ws = AsyncMock()
        manager.create_room(project_id)
        await manager.connect(project_id, user_id, ws)
        
        cursor_data = {
            "line": 10,
            "column": 5,
            "selection": {"start": {"line": 10, "column": 5}, "end": {"line": 10, "column": 20}}
        }
        
        await manager.update_cursor(project_id, user_id, cursor_data)
        
        room = manager.get_room(project_id)
        assert room["cursors"].get(user_id) == cursor_data


class TestChatMessages:
    """Tests for chat message functionality."""
    
    @pytest.fixture
    def manager(self):
        return CollaborationManager()
    
    @pytest.mark.asyncio
    async def test_send_chat_message(self, manager):
        """Test sending a chat message."""
        project_id = "test-project"
        
        ws1 = AsyncMock()
        ws2 = AsyncMock()
        
        manager.create_room(project_id)
        await manager.connect(project_id, "user1", ws1)
        await manager.connect(project_id, "user2", ws2)
        
        message = {
            "type": "chat",
            "user_id": "user1",
            "message": "Hello everyone!",
            "timestamp": datetime.now().isoformat()
        }
        
        await manager.broadcast(project_id, message)
        
        # Both users should receive the message
        assert ws1.send_json.called
        assert ws2.send_json.called


# ============================================================================
# Integration Tests
# ============================================================================

class TestCollaborationIntegration:
    """Integration tests for collaboration workflow."""
    
    @pytest.fixture
    def manager(self):
        return CollaborationManager()
    
    @pytest.mark.asyncio
    async def test_full_collaboration_workflow(self, manager):
        """Test complete collaboration workflow."""
        project_id = "project-abc"
        
        # User 1 joins
        ws1 = AsyncMock()
        await manager.connect(project_id, "alice", ws1)
        
        # User 2 joins
        ws2 = AsyncMock()
        await manager.connect(project_id, "bob", ws2)
        
        # Verify both users are in room
        users = manager.get_users(project_id)
        assert len(users) == 2
        
        # User 1 updates cursor
        await manager.update_cursor(project_id, "alice", {"line": 1, "column": 1})
        
        # Broadcast edit
        edit = {"type": "edit", "content": "\\section{Introduction}"}
        await manager.broadcast(project_id, edit, exclude="alice")
        
        # Bob should receive the edit
        ws2.send_json.assert_called()
        
        # User 1 disconnects
        await manager.disconnect(project_id, "alice")
        assert len(manager.get_users(project_id)) == 1
        
        # User 2 disconnects
        await manager.disconnect(project_id, "bob")
        assert len(manager.get_users(project_id)) == 0

"""
Collaboration Service

Handles real-time collaboration features:
- WebSocket connection management
- Document state synchronization
- Presence awareness (active users)
- Message broadcasting
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, Set, Optional, Any
from dataclasses import dataclass, field
from fastapi import WebSocket, WebSocketDisconnect
import hashlib
import secrets

logger = logging.getLogger(__name__)


@dataclass
class ConnectedUser:
    """Represents a connected user in a collaboration room."""
    user_id: int
    user_name: str
    user_color: str
    websocket: WebSocket
    cursor_position: Optional[Dict[str, int]] = None  # {lineNumber, column}
    selection: Optional[Dict[str, Any]] = None  # {startLine, startCol, endLine, endCol}
    connected_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class CollaborationRoom:
    """A collaboration room for a project."""
    project_id: int
    users: Dict[int, ConnectedUser] = field(default_factory=dict)
    document_content: str = ""
    last_updated: datetime = field(default_factory=datetime.utcnow)
    version: int = 0


class CollaborationManager:
    """
    Manages real-time collaboration sessions.
    
    For production, this should be backed by Redis for horizontal scaling.
    Current implementation is in-memory for single-server deployment.
    """
    
    def __init__(self):
        self.rooms: Dict[int, CollaborationRoom] = {}
        self._lock = asyncio.Lock()
        
        # Colors for user cursors
        self._user_colors = [
            "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
            "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
            "#BB8FCE", "#85C1E9", "#F8B500", "#00CED1",
        ]
        self._color_index = 0
    
    def _get_next_color(self) -> str:
        """Get next user color in rotation."""
        color = self._user_colors[self._color_index % len(self._user_colors)]
        self._color_index += 1
        return color
    
    async def connect(
        self,
        websocket: WebSocket,
        project_id: int,
        user_id: int,
        user_name: str,
    ) -> ConnectedUser:
        """
        Connect a user to a collaboration room.
        
        Creates the room if it doesn't exist.
        Broadcasts join notification to other users.
        """
        await websocket.accept()
        
        async with self._lock:
            # Get or create room
            if project_id not in self.rooms:
                self.rooms[project_id] = CollaborationRoom(project_id=project_id)
            
            room = self.rooms[project_id]
            
            # Create connected user
            user = ConnectedUser(
                user_id=user_id,
                user_name=user_name,
                user_color=self._get_next_color(),
                websocket=websocket,
            )
            
            # Add to room
            room.users[user_id] = user
        
        # Send initial state to new user
        await self._send_initial_state(websocket, room)
        
        # Broadcast join to others
        await self._broadcast_user_joined(room, user)
        
        logger.info(f"User {user_name} (ID: {user_id}) joined room {project_id}")
        
        return user
    
    async def disconnect(self, project_id: int, user_id: int):
        """
        Disconnect a user from a collaboration room.
        
        Broadcasts leave notification to other users.
        Cleans up empty rooms.
        """
        async with self._lock:
            if project_id not in self.rooms:
                return
            
            room = self.rooms[project_id]
            
            if user_id not in room.users:
                return
            
            user = room.users.pop(user_id)
            
            # Broadcast leave
            await self._broadcast_user_left(room, user)
            
            # Cleanup empty room
            if not room.users:
                del self.rooms[project_id]
                logger.info(f"Room {project_id} closed (no users)")
        
        logger.info(f"User {user_id} left room {project_id}")
    
    async def handle_message(
        self,
        project_id: int,
        user_id: int,
        message: Dict[str, Any],
    ):
        """
        Handle incoming WebSocket message.
        
        Message types:
        - 'cursor': Cursor position update
        - 'selection': Text selection update
        - 'edit': Document edit operation
        - 'chat': Chat message
        """
        if project_id not in self.rooms:
            return
        
        room = self.rooms[project_id]
        
        if user_id not in room.users:
            return
        
        msg_type = message.get("type")
        
        if msg_type == "cursor":
            await self._handle_cursor_update(room, user_id, message)
        
        elif msg_type == "selection":
            await self._handle_selection_update(room, user_id, message)
        
        elif msg_type == "edit":
            await self._handle_edit(room, user_id, message)
        
        elif msg_type == "chat":
            await self._handle_chat(room, user_id, message)
        
        elif msg_type == "sync_request":
            await self._handle_sync_request(room, user_id)
    
    async def _send_initial_state(self, websocket: WebSocket, room: CollaborationRoom):
        """Send the current room state to a newly connected user."""
        # List of other users
        users = [
            {
                "userId": u.user_id,
                "userName": u.user_name,
                "userColor": u.user_color,
                "cursor": u.cursor_position,
                "selection": u.selection,
            }
            for u in room.users.values()
        ]
        
        await websocket.send_json({
            "type": "init",
            "content": room.document_content,
            "version": room.version,
            "users": users,
        })
    
    async def _broadcast_user_joined(self, room: CollaborationRoom, user: ConnectedUser):
        """Notify all users in room that a new user joined."""
        message = {
            "type": "user_joined",
            "user": {
                "userId": user.user_id,
                "userName": user.user_name,
                "userColor": user.user_color,
            },
        }
        
        for other_user in room.users.values():
            if other_user.user_id != user.user_id:
                try:
                    await other_user.websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Failed to send join notification: {e}")
    
    async def _broadcast_user_left(self, room: CollaborationRoom, user: ConnectedUser):
        """Notify all users in room that a user left."""
        message = {
            "type": "user_left",
            "userId": user.user_id,
        }
        
        for other_user in room.users.values():
            try:
                await other_user.websocket.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send leave notification: {e}")
    
    async def _handle_cursor_update(
        self,
        room: CollaborationRoom,
        user_id: int,
        message: Dict[str, Any],
    ):
        """Handle cursor position update."""
        user = room.users[user_id]
        user.cursor_position = message.get("position")
        
        # Broadcast to others
        broadcast = {
            "type": "cursor_update",
            "userId": user_id,
            "position": user.cursor_position,
        }
        
        await self._broadcast_to_others(room, user_id, broadcast)
    
    async def _handle_selection_update(
        self,
        room: CollaborationRoom,
        user_id: int,
        message: Dict[str, Any],
    ):
        """Handle text selection update."""
        user = room.users[user_id]
        user.selection = message.get("selection")
        
        # Broadcast to others
        broadcast = {
            "type": "selection_update",
            "userId": user_id,
            "selection": user.selection,
        }
        
        await self._broadcast_to_others(room, user_id, broadcast)
    
    async def _handle_edit(
        self,
        room: CollaborationRoom,
        user_id: int,
        message: Dict[str, Any],
    ):
        """
        Handle document edit operation.
        
        For a production system, this should use Operational Transformation (OT)
        or CRDT (like Yjs) for conflict resolution.
        
        Simple implementation: last-write-wins with version checking.
        """
        client_version = message.get("version", 0)
        operations = message.get("operations", [])
        
        # Simple conflict detection
        if client_version != room.version:
            # Send full sync to client
            await self._handle_sync_request(room, user_id)
            return
        
        # Apply operations to document
        new_content = room.document_content
        for op in operations:
            op_type = op.get("type")
            if op_type == "insert":
                pos = op.get("position", 0)
                text = op.get("text", "")
                new_content = new_content[:pos] + text + new_content[pos:]
            elif op_type == "delete":
                pos = op.get("position", 0)
                length = op.get("length", 0)
                new_content = new_content[:pos] + new_content[pos + length:]
        
        room.document_content = new_content
        room.version += 1
        room.last_updated = datetime.utcnow()
        
        # Broadcast to all (including sender for confirmation)
        broadcast = {
            "type": "edit",
            "userId": user_id,
            "version": room.version,
            "operations": operations,
        }
        
        await self._broadcast_to_all(room, broadcast)
    
    async def _handle_chat(
        self,
        room: CollaborationRoom,
        user_id: int,
        message: Dict[str, Any],
    ):
        """Handle chat message."""
        user = room.users[user_id]
        
        broadcast = {
            "type": "chat",
            "userId": user_id,
            "userName": user.user_name,
            "userColor": user.user_color,
            "content": message.get("content", ""),
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        await self._broadcast_to_all(room, broadcast)
    
    async def _handle_sync_request(self, room: CollaborationRoom, user_id: int):
        """Send full document sync to a user."""
        user = room.users.get(user_id)
        if not user:
            return
        
        try:
            await user.websocket.send_json({
                "type": "sync",
                "content": room.document_content,
                "version": room.version,
            })
        except Exception as e:
            logger.error(f"Failed to send sync: {e}")
    
    async def _broadcast_to_others(
        self,
        room: CollaborationRoom,
        sender_id: int,
        message: Dict[str, Any],
    ):
        """Broadcast message to all users except sender."""
        for user in room.users.values():
            if user.user_id != sender_id:
                try:
                    await user.websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Failed to broadcast: {e}")
    
    async def _broadcast_to_all(
        self,
        room: CollaborationRoom,
        message: Dict[str, Any],
    ):
        """Broadcast message to all users in room."""
        for user in room.users.values():
            try:
                await user.websocket.send_json(message)
            except Exception as e:
                logger.error(f"Failed to broadcast: {e}")
    
    def get_room_info(self, project_id: int) -> Optional[Dict[str, Any]]:
        """Get information about a room."""
        if project_id not in self.rooms:
            return None
        
        room = self.rooms[project_id]
        return {
            "projectId": project_id,
            "userCount": len(room.users),
            "users": [
                {
                    "userId": u.user_id,
                    "userName": u.user_name,
                }
                for u in room.users.values()
            ],
            "version": room.version,
            "lastUpdated": room.last_updated.isoformat(),
        }


# Singleton instance
collaboration_manager = CollaborationManager()

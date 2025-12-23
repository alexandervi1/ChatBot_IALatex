"""
Collaboration Router

WebSocket and REST endpoints for real-time collaboration features.
"""

import logging
import secrets
import hashlib
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database.connection import get_db
from database.models import User
from database.collaboration_models import Project, ProjectCollaborator, ProjectVersion, ProjectComment
from services.collaboration_service import collaboration_manager
from app.routers.auth import get_current_user_ws
from services.auth_service import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/collaboration", tags=["collaboration"])


# ============================================================================
# Pydantic Models
# ============================================================================

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    content: Optional[str] = ""


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    owner_id: int
    is_public: bool
    share_token: Optional[str]
    created_at: str
    updated_at: str
    role: str  # User's role in this project
    collaborator_count: int

    class Config:
        from_attributes = True


class InviteRequest(BaseModel):
    email: Optional[str] = None
    role: str = "editor"


class InviteResponse(BaseModel):
    invite_link: str
    invite_token: str


class CommentCreate(BaseModel):
    content: str
    start_line: Optional[int] = None
    start_column: Optional[int] = None
    end_line: Optional[int] = None
    end_column: Optional[int] = None
    selected_text: Optional[str] = None
    parent_id: Optional[int] = None


class CommentResponse(BaseModel):
    id: int
    content: str
    author_id: int
    author_name: str
    start_line: Optional[int]
    end_line: Optional[int]
    is_resolved: bool
    created_at: str
    replies: list = []

    class Config:
        from_attributes = True


# ============================================================================
# Helper Functions
# ============================================================================

def get_user_role_in_project(db: Session, project: Project, user_id: int) -> Optional[str]:
    """Get the user's role in a project."""
    if project.owner_id == user_id:
        return "owner"
    
    collab = db.query(ProjectCollaborator).filter(
        ProjectCollaborator.project_id == project.id,
        ProjectCollaborator.user_id == user_id,
    ).first()
    
    if collab:
        return collab.role
    
    if project.is_public:
        return "viewer"
    
    return None


def generate_share_token() -> str:
    """Generate a unique share token."""
    return secrets.token_urlsafe(32)


# ============================================================================
# Project CRUD Endpoints
# ============================================================================

@router.post("/projects", response_model=ProjectResponse)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new collaborative project."""
    project = Project(
        name=project_data.name,
        description=project_data.description,
        content=project_data.content or "",
        owner_id=current_user.id,
        share_token=generate_share_token(),
    )
    
    db.add(project)
    db.commit()
    db.refresh(project)
    
    logger.info(f"User {current_user.id} created project {project.id}")
    
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        owner_id=project.owner_id,
        is_public=project.is_public,
        share_token=project.share_token,
        created_at=project.created_at,
        updated_at=project.updated_at,
        role="owner",
        collaborator_count=0,
    )


@router.get("/projects", response_model=list[ProjectResponse])
async def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all projects the user has access to."""
    # Owner projects
    owned = db.query(Project).filter(Project.owner_id == current_user.id).all()
    
    # Collaborated projects
    collaborated_ids = db.query(ProjectCollaborator.project_id).filter(
        ProjectCollaborator.user_id == current_user.id
    ).all()
    collaborated = db.query(Project).filter(
        Project.id.in_([c[0] for c in collaborated_ids])
    ).all() if collaborated_ids else []
    
    result = []
    
    for project in owned:
        collab_count = db.query(ProjectCollaborator).filter(
            ProjectCollaborator.project_id == project.id
        ).count()
        
        result.append(ProjectResponse(
            id=project.id,
            name=project.name,
            description=project.description,
            owner_id=project.owner_id,
            is_public=project.is_public,
            share_token=project.share_token,
            created_at=project.created_at,
            updated_at=project.updated_at,
            role="owner",
            collaborator_count=collab_count,
        ))
    
    for project in collaborated:
        role = get_user_role_in_project(db, project, current_user.id)
        collab_count = db.query(ProjectCollaborator).filter(
            ProjectCollaborator.project_id == project.id
        ).count()
        
        result.append(ProjectResponse(
            id=project.id,
            name=project.name,
            description=project.description,
            owner_id=project.owner_id,
            is_public=project.is_public,
            share_token=None,  # Don't expose share token to non-owners
            created_at=project.created_at,
            updated_at=project.updated_at,
            role=role or "viewer",
            collaborator_count=collab_count,
        ))
    
    return result


@router.get("/projects/{project_id}")
async def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a project by ID with full content."""
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    role = get_user_role_in_project(db, project, current_user.id)
    
    if not role:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "content": project.content,
        "owner_id": project.owner_id,
        "is_public": project.is_public,
        "share_token": project.share_token if role == "owner" else None,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
        "role": role,
        "last_compile_status": project.last_compile_status,
    }


@router.delete("/projects/{project_id}")
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a project (owner only)."""
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner can delete project")
    
    db.delete(project)
    db.commit()
    
    logger.info(f"User {current_user.id} deleted project {project_id}")
    
    return {"status": "deleted"}


# ============================================================================
# Sharing & Collaboration
# ============================================================================

@router.post("/projects/{project_id}/invite", response_model=InviteResponse)
async def create_invite(
    project_id: int,
    invite_data: InviteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create an invitation link for a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    role = get_user_role_in_project(db, project, current_user.id)
    
    if role != "owner":
        raise HTTPException(status_code=403, detail="Only owner can invite")
    
    invite_token = secrets.token_urlsafe(24)
    
    collaborator = ProjectCollaborator(
        project_id=project_id,
        user_id=0,  # Placeholder, will be set when accepting
        role=invite_data.role,
        invited_by_id=current_user.id,
        invite_token=invite_token,
        invite_email=invite_data.email,
    )
    
    db.add(collaborator)
    db.commit()
    
    # In a real app, this would be the full URL
    invite_link = f"/join/{invite_token}"
    
    return InviteResponse(
        invite_link=invite_link,
        invite_token=invite_token,
    )


@router.post("/join/{invite_token}")
async def accept_invite(
    invite_token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Accept an invitation to join a project."""
    invite = db.query(ProjectCollaborator).filter(
        ProjectCollaborator.invite_token == invite_token,
        ProjectCollaborator.user_id == 0,  # Not yet claimed
    ).first()
    
    if not invite:
        raise HTTPException(status_code=404, detail="Invalid or expired invite")
    
    # Claim the invite
    invite.user_id = current_user.id
    invite.accepted_at = datetime.utcnow().isoformat()
    invite.invite_token = None  # Invalidate token
    
    db.commit()
    
    logger.info(f"User {current_user.id} joined project {invite.project_id}")
    
    return {
        "status": "joined",
        "project_id": invite.project_id,
        "role": invite.role,
    }


# ============================================================================
# WebSocket Collaboration
# ============================================================================

@router.websocket("/ws/{project_id}")
async def websocket_collaboration(
    websocket: WebSocket,
    project_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    """
    WebSocket endpoint for real-time collaboration.
    
    Connect with: ws://server/collaboration/ws/{project_id}?token={jwt_token}
    """
    # Authenticate user from token
    try:
        user = await get_current_user_ws(token, db)
    except Exception as e:
        await websocket.close(code=4001, reason="Authentication failed")
        return
    
    # Check project access
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        await websocket.close(code=4004, reason="Project not found")
        return
    
    role = get_user_role_in_project(db, project, user.id)
    
    if not role:
        await websocket.close(code=4003, reason="Access denied")
        return
    
    # Connect to collaboration room
    connected_user = await collaboration_manager.connect(
        websocket=websocket,
        project_id=project_id,
        user_id=user.id,
        user_name=user.full_name or user.email,
    )
    
    try:
        # Message loop
        while True:
            data = await websocket.receive_json()
            await collaboration_manager.handle_message(
                project_id=project_id,
                user_id=user.id,
                message=data,
            )
    
    except WebSocketDisconnect:
        await collaboration_manager.disconnect(project_id, user.id)
    
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await collaboration_manager.disconnect(project_id, user.id)


# ============================================================================
# Comments
# ============================================================================

@router.post("/projects/{project_id}/comments", response_model=CommentResponse)
async def create_comment(
    project_id: int,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a comment to a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    role = get_user_role_in_project(db, project, current_user.id)
    
    if not role or role == "viewer":
        raise HTTPException(status_code=403, detail="Cannot add comments")
    
    comment = ProjectComment(
        project_id=project_id,
        author_id=current_user.id,
        content=comment_data.content,
        start_line=comment_data.start_line,
        start_column=comment_data.start_column,
        end_line=comment_data.end_line,
        end_column=comment_data.end_column,
        selected_text=comment_data.selected_text,
        parent_id=comment_data.parent_id,
    )
    
    db.add(comment)
    db.commit()
    db.refresh(comment)
    
    return CommentResponse(
        id=comment.id,
        content=comment.content,
        author_id=comment.author_id,
        author_name=current_user.full_name or current_user.email,
        start_line=comment.start_line,
        end_line=comment.end_line,
        is_resolved=comment.is_resolved,
        created_at=comment.created_at,
    )


@router.get("/projects/{project_id}/comments", response_model=list[CommentResponse])
async def get_comments(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all comments for a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    role = get_user_role_in_project(db, project, current_user.id)
    
    if not role:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get top-level comments with authors
    comments = db.query(ProjectComment, User).join(
        User, ProjectComment.author_id == User.id
    ).filter(
        ProjectComment.project_id == project_id,
        ProjectComment.parent_id.is_(None),
    ).order_by(ProjectComment.created_at.desc()).all()
    
    result = []
    for comment, author in comments:
        result.append(CommentResponse(
            id=comment.id,
            content=comment.content,
            author_id=comment.author_id,
            author_name=author.full_name or author.email,
            start_line=comment.start_line,
            end_line=comment.end_line,
            is_resolved=comment.is_resolved,
            created_at=comment.created_at,
        ))
    
    return result


@router.post("/comments/{comment_id}/resolve")
async def resolve_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a comment as resolved."""
    comment = db.query(ProjectComment).filter(ProjectComment.id == comment_id).first()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    project = db.query(Project).filter(Project.id == comment.project_id).first()
    role = get_user_role_in_project(db, project, current_user.id)
    
    if role not in ["owner", "editor"]:
        raise HTTPException(status_code=403, detail="Cannot resolve comments")
    
    comment.is_resolved = True
    comment.resolved_by_id = current_user.id
    comment.resolved_at = datetime.utcnow().isoformat()
    
    db.commit()
    
    return {"status": "resolved"}

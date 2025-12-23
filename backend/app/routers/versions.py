"""
Version Control Router

REST endpoints for document version history and management.
"""

import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database.connection import get_db
from database.models import User
from database.collaboration_models import Project
from services.version_service import VersionService
from services.auth_service import get_current_active_user
from app.routers.collaboration import get_user_role_in_project

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/versions", tags=["versions"])


# ============================================================================
# Pydantic Models
# ============================================================================

class VersionCreate(BaseModel):
    content: str
    label: Optional[str] = None
    change_summary: Optional[str] = None


class VersionLabel(BaseModel):
    label: str


class VersionInfo(BaseModel):
    id: int
    version_number: int
    label: Optional[str]
    author_id: int
    change_summary: Optional[str]
    created_at: str
    content_length: int

    class Config:
        from_attributes = True


class DiffStats(BaseModel):
    additions: int
    deletions: int
    modifications: int
    old_lines: int
    new_lines: int


class CompareResult(BaseModel):
    from_version: dict
    to_version: dict
    unified_diff: str
    stats: DiffStats


# ============================================================================
# Version Endpoints
# ============================================================================

@router.get("/projects/{project_id}/versions", response_model=List[VersionInfo])
async def get_version_history(
    project_id: int,
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get version history for a project.
    
    Returns list of version metadata without full content.
    """
    # Check access
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    role = get_user_role_in_project(db, project, current_user.id)
    if not role:
        raise HTTPException(status_code=403, detail="Access denied")
    
    service = VersionService(db)
    history = service.get_project_history(project_id, limit, offset)
    
    return history


@router.get("/projects/{project_id}/versions/{version_number}")
async def get_version(
    project_id: int,
    version_number: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get a specific version with full content.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    role = get_user_role_in_project(db, project, current_user.id)
    if not role:
        raise HTTPException(status_code=403, detail="Access denied")
    
    service = VersionService(db)
    version = service.get_version_by_number(project_id, version_number)
    
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    return {
        "id": version.id,
        "project_id": project_id,
        "version_number": version.version_number,
        "label": version.label,
        "author_id": version.author_id,
        "content": version.content,
        "change_summary": version.change_summary,
        "created_at": version.created_at,
    }


@router.post("/projects/{project_id}/versions")
async def create_version(
    project_id: int,
    version_data: VersionCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Create a new version snapshot.
    
    Typically called when user explicitly saves or before major changes.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    role = get_user_role_in_project(db, project, current_user.id)
    if role not in ["owner", "editor"]:
        raise HTTPException(status_code=403, detail="Cannot create versions")
    
    service = VersionService(db)
    version = service.create_version(
        project_id=project_id,
        content=version_data.content,
        author_id=current_user.id,
        label=version_data.label,
        change_summary=version_data.change_summary,
    )
    
    return {
        "id": version.id,
        "version_number": version.version_number,
        "label": version.label,
        "created_at": version.created_at,
    }


@router.patch("/versions/{version_id}/label")
async def update_version_label(
    version_id: int,
    label_data: VersionLabel,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Add or update a label on a version.
    
    Labels help users identify important versions (e.g., "First Draft", "Final").
    """
    service = VersionService(db)
    version = service.get_version(version_id)
    
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    project = db.query(Project).filter(Project.id == version.project_id).first()
    role = get_user_role_in_project(db, project, current_user.id)
    
    if role not in ["owner", "editor"]:
        raise HTTPException(status_code=403, detail="Cannot label versions")
    
    updated = service.label_version(version_id, label_data.label)
    
    return {
        "id": updated.id,
        "version_number": updated.version_number,
        "label": updated.label,
    }


# ============================================================================
# Diff & Comparison Endpoints
# ============================================================================

@router.get("/projects/{project_id}/compare")
async def compare_versions(
    project_id: int,
    from_version: int = Query(..., description="Earlier version number"),
    to_version: int = Query(..., description="Later version number"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Compare two versions and generate diff.
    
    Returns both unified diff (for display) and statistics.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    role = get_user_role_in_project(db, project, current_user.id)
    if not role:
        raise HTTPException(status_code=403, detail="Access denied")
    
    service = VersionService(db)
    result = service.compare_versions(project_id, from_version, to_version)
    
    if not result:
        raise HTTPException(status_code=404, detail="One or both versions not found")
    
    return result


@router.get("/projects/{project_id}/diff/{version_number}")
async def get_version_diff(
    project_id: int,
    version_number: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get the diff for a specific version (compared to previous).
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    role = get_user_role_in_project(db, project, current_user.id)
    if not role:
        raise HTTPException(status_code=403, detail="Access denied")
    
    service = VersionService(db)
    version = service.get_version_by_number(project_id, version_number)
    
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    # Get previous version for comparison
    if version_number > 1:
        prev_version = service.get_version_by_number(project_id, version_number - 1)
        if prev_version:
            diff = service.generate_diff(prev_version.content, version.content)
            stats = service._calculate_diff_stats(prev_version.content, version.content)
        else:
            diff = None
            stats = None
    else:
        diff = None
        stats = {"additions": len(version.content.splitlines()), "deletions": 0}
    
    return {
        "version_number": version_number,
        "diff": diff or version.diff_from_previous,
        "stats": stats,
    }


# ============================================================================
# Restoration Endpoints
# ============================================================================

@router.post("/projects/{project_id}/restore/{version_number}")
async def restore_version(
    project_id: int,
    version_number: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Restore a project to a previous version.
    
    This creates a new version with the old content (preserving history).
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    role = get_user_role_in_project(db, project, current_user.id)
    if role not in ["owner", "editor"]:
        raise HTTPException(status_code=403, detail="Cannot restore versions")
    
    service = VersionService(db)
    result = service.restore_version(project_id, version_number, current_user.id)
    
    if not result:
        raise HTTPException(status_code=404, detail="Version not found")
    
    project, new_version = result
    
    return {
        "status": "restored",
        "restored_from": version_number,
        "new_version": new_version.version_number,
        "project_updated_at": project.updated_at,
    }

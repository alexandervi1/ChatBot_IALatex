"""
Collaborative Project Models

Models for real-time collaboration features:
- Project: Main document container
- ProjectCollaborator: User access and roles
- ProjectVersion: Document version history
- ProjectComment: In-document comments
"""

from sqlalchemy import Column, Integer, String, Text, JSON, ForeignKey, Boolean, func
from sqlalchemy.orm import relationship
from .connection import Base


class Project(Base):
    """
    A collaborative LaTeX project.
    
    Projects can have multiple collaborators with different roles,
    and maintain version history for document recovery.
    """
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Project metadata
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Current document content
    content = Column(Text, nullable=False, default="")
    
    # Owner (creator)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Sharing
    share_token = Column(String(64), unique=True, nullable=True, index=True)
    is_public = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(String, nullable=False, default=func.now())
    updated_at = Column(String, nullable=False, default=func.now(), onupdate=func.now())
    
    # Last compiled PDF (stored as path or blob reference)
    last_pdf_path = Column(String(500), nullable=True)
    last_compile_status = Column(String(20), nullable=True)  # 'success', 'error'
    last_compile_error = Column(Text, nullable=True)
    
    # Relationships
    owner = relationship("User", foreign_keys=[owner_id])
    collaborators = relationship("ProjectCollaborator", back_populates="project", cascade="all, delete-orphan")
    versions = relationship("ProjectVersion", back_populates="project", cascade="all, delete-orphan")
    comments = relationship("ProjectComment", back_populates="project", cascade="all, delete-orphan")


class ProjectCollaborator(Base):
    """
    User access to a project with specific role.
    
    Roles:
    - owner: Full control (rename, delete, manage collaborators)
    - editor: Can edit content and add comments
    - viewer: Read-only access
    """
    __tablename__ = "project_collaborators"
    
    id = Column(Integer, primary_key=True, index=True)
    
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Role
    role = Column(String(20), nullable=False, default="viewer")  # owner, editor, viewer
    
    # Invitation
    invited_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    invited_at = Column(String, nullable=False, default=func.now())
    accepted_at = Column(String, nullable=True)
    
    # For link-based invitations
    invite_token = Column(String(64), unique=True, nullable=True)
    invite_email = Column(String(255), nullable=True)  # For email invitations
    
    # Relationships
    project = relationship("Project", back_populates="collaborators")
    user = relationship("User", foreign_keys=[user_id])
    invited_by = relationship("User", foreign_keys=[invited_by_id])


class ProjectVersion(Base):
    """
    Version history for a project.
    
    Stores snapshots of project content for recovery and diff viewing.
    """
    __tablename__ = "project_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    
    # Version metadata
    version_number = Column(Integer, nullable=False)
    label = Column(String(100), nullable=True)  # Optional user-defined label
    
    # Content snapshot
    content = Column(Text, nullable=False)
    content_hash = Column(String(64), nullable=False)  # SHA-256 hash
    
    # Author
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Timestamp
    created_at = Column(String, nullable=False, default=func.now())
    
    # Change summary (for display in history UI)
    change_summary = Column(String(500), nullable=True)
    
    # Diff from previous version (optional, for quick display)
    diff_from_previous = Column(Text, nullable=True)
    
    # Relationships
    project = relationship("Project", back_populates="versions")
    author = relationship("User", foreign_keys=[author_id])


class ProjectComment(Base):
    """
    In-document comments with threading support.
    """
    __tablename__ = "project_comments"
    
    id = Column(Integer, primary_key=True, index=True)
    
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Comment content
    content = Column(Text, nullable=False)
    
    # Position in document (for anchoring)
    start_line = Column(Integer, nullable=True)
    start_column = Column(Integer, nullable=True)
    end_line = Column(Integer, nullable=True)
    end_column = Column(Integer, nullable=True)
    
    # Selected text (for context when position shifts)
    selected_text = Column(Text, nullable=True)
    
    # Threading
    parent_id = Column(Integer, ForeignKey("project_comments.id"), nullable=True)
    
    # Status
    is_resolved = Column(Boolean, default=False)
    resolved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(String, nullable=False, default=func.now())
    updated_at = Column(String, nullable=True)
    
    # Relationships
    project = relationship("Project", back_populates="comments")
    author = relationship("User", foreign_keys=[author_id])
    resolved_by = relationship("User", foreign_keys=[resolved_by_id])
    parent = relationship("ProjectComment", remote_side=[id], backref="replies")

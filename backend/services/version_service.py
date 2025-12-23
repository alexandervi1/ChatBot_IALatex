"""
Version Control Service

Handles document versioning, diff generation, and history management.
Similar to Git-style version control for LaTeX documents.
"""

import hashlib
import difflib
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database.collaboration_models import Project, ProjectVersion

logger = logging.getLogger(__name__)


class VersionService:
    """
    Service for managing document versions.
    
    Features:
    - Automatic versioning on significant changes
    - Manual labeling of versions
    - Diff generation between versions
    - Version restoration
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    # =========================================================================
    # Version Creation
    # =========================================================================
    
    def create_version(
        self,
        project_id: int,
        content: str,
        author_id: int,
        label: Optional[str] = None,
        change_summary: Optional[str] = None,
        auto_generated: bool = False,
    ) -> ProjectVersion:
        """
        Create a new version snapshot of a project.
        
        Args:
            project_id: The project to version
            content: The document content
            author_id: User who made the change
            label: Optional human-readable label (e.g., "First Draft")
            change_summary: Brief description of changes
            auto_generated: Whether this was auto-created on save
            
        Returns:
            The created ProjectVersion
        """
        # Get current version number
        last_version = self.db.query(ProjectVersion).filter(
            ProjectVersion.project_id == project_id
        ).order_by(desc(ProjectVersion.version_number)).first()
        
        version_number = (last_version.version_number + 1) if last_version else 1
        
        # Generate content hash
        content_hash = hashlib.sha256(content.encode()).hexdigest()
        
        # Check if content actually changed
        if last_version and last_version.content_hash == content_hash:
            logger.debug(f"No content change for project {project_id}, skipping version")
            return last_version
        
        # Generate diff from previous version
        diff_text = None
        if last_version:
            diff_text = self.generate_diff(last_version.content, content)
        
        # Create new version
        version = ProjectVersion(
            project_id=project_id,
            version_number=version_number,
            label=label,
            content=content,
            content_hash=content_hash,
            author_id=author_id,
            change_summary=change_summary or self._auto_generate_summary(diff_text),
            diff_from_previous=diff_text,
        )
        
        self.db.add(version)
        self.db.commit()
        self.db.refresh(version)
        
        logger.info(f"Created version {version_number} for project {project_id}")
        
        return version
    
    def label_version(
        self,
        version_id: int,
        label: str,
    ) -> Optional[ProjectVersion]:
        """Add or update a label on a version."""
        version = self.db.query(ProjectVersion).filter(
            ProjectVersion.id == version_id
        ).first()
        
        if not version:
            return None
        
        version.label = label
        self.db.commit()
        self.db.refresh(version)
        
        return version
    
    # =========================================================================
    # Version Retrieval
    # =========================================================================
    
    def get_version(self, version_id: int) -> Optional[ProjectVersion]:
        """Get a specific version by ID."""
        return self.db.query(ProjectVersion).filter(
            ProjectVersion.id == version_id
        ).first()
    
    def get_version_by_number(
        self,
        project_id: int,
        version_number: int
    ) -> Optional[ProjectVersion]:
        """Get a specific version by project and version number."""
        return self.db.query(ProjectVersion).filter(
            ProjectVersion.project_id == project_id,
            ProjectVersion.version_number == version_number
        ).first()
    
    def get_project_history(
        self,
        project_id: int,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Get version history for a project.
        
        Returns list of version metadata without full content.
        """
        versions = self.db.query(ProjectVersion).filter(
            ProjectVersion.project_id == project_id
        ).order_by(
            desc(ProjectVersion.version_number)
        ).offset(offset).limit(limit).all()
        
        return [
            {
                "id": v.id,
                "version_number": v.version_number,
                "label": v.label,
                "author_id": v.author_id,
                "change_summary": v.change_summary,
                "created_at": v.created_at,
                "content_length": len(v.content),
            }
            for v in versions
        ]
    
    def get_version_count(self, project_id: int) -> int:
        """Get total number of versions for a project."""
        return self.db.query(ProjectVersion).filter(
            ProjectVersion.project_id == project_id
        ).count()
    
    # =========================================================================
    # Diff Generation
    # =========================================================================
    
    def generate_diff(
        self,
        old_content: str,
        new_content: str,
        context_lines: int = 3,
    ) -> str:
        """
        Generate a unified diff between two versions.
        
        Args:
            old_content: Previous version content
            new_content: New version content
            context_lines: Number of context lines around changes
            
        Returns:
            Unified diff string
        """
        old_lines = old_content.splitlines(keepends=True)
        new_lines = new_content.splitlines(keepends=True)
        
        diff = difflib.unified_diff(
            old_lines,
            new_lines,
            fromfile='previous',
            tofile='current',
            lineterm='',
            n=context_lines,
        )
        
        return ''.join(diff)
    
    def generate_side_by_side_diff(
        self,
        old_content: str,
        new_content: str,
    ) -> List[Dict[str, Any]]:
        """
        Generate a side-by-side diff for UI display.
        
        Returns list of diff operations:
        - equal: Lines that are the same
        - insert: Lines added
        - delete: Lines removed
        - replace: Lines changed
        """
        old_lines = old_content.splitlines()
        new_lines = new_content.splitlines()
        
        matcher = difflib.SequenceMatcher(None, old_lines, new_lines)
        result = []
        
        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == 'equal':
                for line in old_lines[i1:i2]:
                    result.append({
                        'type': 'equal',
                        'old_line': line,
                        'new_line': line,
                        'old_number': i1 + 1,
                        'new_number': j1 + 1,
                    })
                    i1 += 1
                    j1 += 1
            
            elif tag == 'replace':
                old_chunk = old_lines[i1:i2]
                new_chunk = new_lines[j1:j2]
                max_len = max(len(old_chunk), len(new_chunk))
                
                for k in range(max_len):
                    result.append({
                        'type': 'replace',
                        'old_line': old_chunk[k] if k < len(old_chunk) else None,
                        'new_line': new_chunk[k] if k < len(new_chunk) else None,
                        'old_number': (i1 + k + 1) if k < len(old_chunk) else None,
                        'new_number': (j1 + k + 1) if k < len(new_chunk) else None,
                    })
            
            elif tag == 'delete':
                for line in old_lines[i1:i2]:
                    result.append({
                        'type': 'delete',
                        'old_line': line,
                        'new_line': None,
                        'old_number': i1 + 1,
                        'new_number': None,
                    })
                    i1 += 1
            
            elif tag == 'insert':
                for line in new_lines[j1:j2]:
                    result.append({
                        'type': 'insert',
                        'old_line': None,
                        'new_line': line,
                        'old_number': None,
                        'new_number': j1 + 1,
                    })
                    j1 += 1
        
        return result
    
    def compare_versions(
        self,
        project_id: int,
        from_version: int,
        to_version: int,
    ) -> Optional[Dict[str, Any]]:
        """
        Compare two specific versions of a project.
        
        Args:
            project_id: The project ID
            from_version: Earlier version number
            to_version: Later version number
            
        Returns:
            Comparison result with unified and side-by-side diffs
        """
        v_from = self.get_version_by_number(project_id, from_version)
        v_to = self.get_version_by_number(project_id, to_version)
        
        if not v_from or not v_to:
            return None
        
        unified_diff = self.generate_diff(v_from.content, v_to.content)
        side_by_side = self.generate_side_by_side_diff(v_from.content, v_to.content)
        
        # Calculate statistics
        stats = self._calculate_diff_stats(v_from.content, v_to.content)
        
        return {
            "from_version": {
                "number": v_from.version_number,
                "label": v_from.label,
                "created_at": v_from.created_at,
            },
            "to_version": {
                "number": v_to.version_number,
                "label": v_to.label,
                "created_at": v_to.created_at,
            },
            "unified_diff": unified_diff,
            "side_by_side": side_by_side,
            "stats": stats,
        }
    
    def _calculate_diff_stats(
        self,
        old_content: str,
        new_content: str,
    ) -> Dict[str, int]:
        """Calculate statistics about changes between versions."""
        old_lines = old_content.splitlines()
        new_lines = new_content.splitlines()
        
        matcher = difflib.SequenceMatcher(None, old_lines, new_lines)
        
        additions = 0
        deletions = 0
        modifications = 0
        
        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == 'insert':
                additions += j2 - j1
            elif tag == 'delete':
                deletions += i2 - i1
            elif tag == 'replace':
                modifications += max(i2 - i1, j2 - j1)
        
        return {
            "additions": additions,
            "deletions": deletions,
            "modifications": modifications,
            "old_lines": len(old_lines),
            "new_lines": len(new_lines),
        }
    
    # =========================================================================
    # Version Restoration
    # =========================================================================
    
    def restore_version(
        self,
        project_id: int,
        version_number: int,
        author_id: int,
    ) -> Optional[Tuple[Project, ProjectVersion]]:
        """
        Restore a project to a previous version.
        
        This creates a new version with the old content, preserving history.
        
        Args:
            project_id: The project to restore
            version_number: The version to restore to
            author_id: User performing the restoration
            
        Returns:
            Tuple of (updated Project, new Version) or None if not found
        """
        # Get the version to restore
        old_version = self.get_version_by_number(project_id, version_number)
        if not old_version:
            return None
        
        # Get the project
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return None
        
        # Create a new version with the restored content
        new_version = self.create_version(
            project_id=project_id,
            content=old_version.content,
            author_id=author_id,
            label=f"Restored from v{version_number}",
            change_summary=f"Restored to version {version_number}" + 
                          (f" ({old_version.label})" if old_version.label else ""),
        )
        
        # Update project content
        project.content = old_version.content
        project.updated_at = datetime.utcnow().isoformat()
        self.db.commit()
        
        logger.info(f"Restored project {project_id} to version {version_number}")
        
        return project, new_version
    
    # =========================================================================
    # Utilities
    # =========================================================================
    
    def _auto_generate_summary(self, diff_text: Optional[str]) -> str:
        """Generate a summary of changes from diff text."""
        if not diff_text:
            return "Initial version"
        
        additions = diff_text.count('\n+') - diff_text.count('\n+++')
        deletions = diff_text.count('\n-') - diff_text.count('\n---')
        
        if additions > 0 and deletions > 0:
            return f"+{additions} -{deletions} lines"
        elif additions > 0:
            return f"+{additions} lines"
        elif deletions > 0:
            return f"-{deletions} lines"
        else:
            return "Minor changes"
    
    def should_auto_version(
        self,
        project_id: int,
        new_content: str,
        min_change_ratio: float = 0.05,
    ) -> bool:
        """
        Determine if changes are significant enough for auto-versioning.
        
        Args:
            project_id: The project
            new_content: New content to compare
            min_change_ratio: Minimum ratio of changed lines (0.05 = 5%)
            
        Returns:
            True if should create a new version
        """
        last_version = self.db.query(ProjectVersion).filter(
            ProjectVersion.project_id == project_id
        ).order_by(desc(ProjectVersion.version_number)).first()
        
        if not last_version:
            return True
        
        # Check hash first
        new_hash = hashlib.sha256(new_content.encode()).hexdigest()
        if new_hash == last_version.content_hash:
            return False
        
        # Calculate change ratio
        old_lines = last_version.content.splitlines()
        new_lines = new_content.splitlines()
        
        matcher = difflib.SequenceMatcher(None, old_lines, new_lines)
        ratio = 1 - matcher.ratio()
        
        return ratio >= min_change_ratio

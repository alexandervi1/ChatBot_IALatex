"""
GitHub Integration Service

Provides GitHub sync capabilities for LaTeX projects:
- Repository creation and connection
- Push/pull changes
- Branch management
- Commit history
"""

import base64
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
import httpx

logger = logging.getLogger(__name__)


@dataclass
class GitHubFile:
    """Represents a file in a GitHub repository."""
    path: str
    content: str
    sha: Optional[str] = None


@dataclass
class GitHubCommit:
    """Represents a commit."""
    sha: str
    message: str
    author: str
    date: str
    url: str


class GitHubService:
    """
    Service for GitHub integration.
    
    Provides sync capabilities between LaTeX projects and GitHub repositories.
    """
    
    BASE_URL = "https://api.github.com"
    
    def __init__(self, access_token: str):
        """
        Initialize with user's GitHub access token.
        
        Token should have 'repo' scope for full repository access.
        """
        self.token = access_token
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github.v3+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
    
    async def _request(
        self,
        method: str,
        endpoint: str,
        **kwargs
    ) -> Dict[str, Any]:
        """Make authenticated request to GitHub API."""
        async with httpx.AsyncClient() as client:
            response = await client.request(
                method,
                f"{self.BASE_URL}{endpoint}",
                headers=self.headers,
                **kwargs
            )
            
            if response.status_code >= 400:
                logger.error(f"GitHub API error: {response.status_code} - {response.text}")
                response.raise_for_status()
            
            return response.json() if response.content else {}
    
    # =========================================================================
    # User & Auth
    # =========================================================================
    
    async def get_user(self) -> Dict[str, Any]:
        """Get authenticated user info."""
        return await self._request("GET", "/user")
    
    async def verify_token(self) -> bool:
        """Verify the access token is valid."""
        try:
            await self.get_user()
            return True
        except Exception:
            return False
    
    # =========================================================================
    # Repository Operations
    # =========================================================================
    
    async def list_repos(
        self,
        sort: str = "updated",
        per_page: int = 30,
    ) -> List[Dict[str, Any]]:
        """List user's repositories."""
        return await self._request(
            "GET",
            f"/user/repos?sort={sort}&per_page={per_page}"
        )
    
    async def create_repo(
        self,
        name: str,
        description: str = "",
        private: bool = True,
        auto_init: bool = True,
    ) -> Dict[str, Any]:
        """
        Create a new repository.
        
        Args:
            name: Repository name
            description: Repository description
            private: Whether repo should be private
            auto_init: Initialize with README
        """
        return await self._request(
            "POST",
            "/user/repos",
            json={
                "name": name,
                "description": description,
                "private": private,
                "auto_init": auto_init,
            }
        )
    
    async def get_repo(self, owner: str, repo: str) -> Dict[str, Any]:
        """Get repository info."""
        return await self._request("GET", f"/repos/{owner}/{repo}")
    
    async def delete_repo(self, owner: str, repo: str) -> None:
        """Delete a repository."""
        await self._request("DELETE", f"/repos/{owner}/{repo}")
    
    # =========================================================================
    # File Operations
    # =========================================================================
    
    async def get_file(
        self,
        owner: str,
        repo: str,
        path: str,
        ref: str = "main",
    ) -> GitHubFile:
        """
        Get file content from repository.
        
        Args:
            owner: Repository owner
            repo: Repository name
            path: File path
            ref: Branch or commit SHA
        """
        data = await self._request(
            "GET",
            f"/repos/{owner}/{repo}/contents/{path}?ref={ref}"
        )
        
        content = base64.b64decode(data["content"]).decode("utf-8")
        return GitHubFile(
            path=path,
            content=content,
            sha=data["sha"],
        )
    
    async def create_or_update_file(
        self,
        owner: str,
        repo: str,
        path: str,
        content: str,
        message: str,
        sha: Optional[str] = None,
        branch: str = "main",
    ) -> Dict[str, Any]:
        """
        Create or update a file in the repository.
        
        Args:
            owner: Repository owner
            repo: Repository name
            path: File path
            content: File content
            message: Commit message
            sha: File SHA (required for updates)
            branch: Target branch
        """
        encoded_content = base64.b64encode(content.encode()).decode()
        
        payload = {
            "message": message,
            "content": encoded_content,
            "branch": branch,
        }
        
        if sha:
            payload["sha"] = sha
        
        return await self._request(
            "PUT",
            f"/repos/{owner}/{repo}/contents/{path}",
            json=payload
        )
    
    async def delete_file(
        self,
        owner: str,
        repo: str,
        path: str,
        sha: str,
        message: str,
        branch: str = "main",
    ) -> Dict[str, Any]:
        """Delete a file from repository."""
        return await self._request(
            "DELETE",
            f"/repos/{owner}/{repo}/contents/{path}",
            json={
                "message": message,
                "sha": sha,
                "branch": branch,
            }
        )
    
    async def get_tree(
        self,
        owner: str,
        repo: str,
        sha: str = "main",
        recursive: bool = True,
    ) -> List[Dict[str, Any]]:
        """
        Get repository tree (file listing).
        
        Returns list of all files and directories.
        """
        params = "?recursive=1" if recursive else ""
        data = await self._request(
            "GET",
            f"/repos/{owner}/{repo}/git/trees/{sha}{params}"
        )
        return data.get("tree", [])
    
    # =========================================================================
    # Commit Operations
    # =========================================================================
    
    async def get_commits(
        self,
        owner: str,
        repo: str,
        sha: str = "main",
        per_page: int = 30,
    ) -> List[GitHubCommit]:
        """Get commit history."""
        data = await self._request(
            "GET",
            f"/repos/{owner}/{repo}/commits?sha={sha}&per_page={per_page}"
        )
        
        return [
            GitHubCommit(
                sha=c["sha"],
                message=c["commit"]["message"],
                author=c["commit"]["author"]["name"],
                date=c["commit"]["author"]["date"],
                url=c["html_url"],
            )
            for c in data
        ]
    
    async def get_commit(
        self,
        owner: str,
        repo: str,
        sha: str,
    ) -> Dict[str, Any]:
        """Get specific commit details."""
        return await self._request(
            "GET",
            f"/repos/{owner}/{repo}/commits/{sha}"
        )
    
    # =========================================================================
    # Branch Operations
    # =========================================================================
    
    async def list_branches(
        self,
        owner: str,
        repo: str,
    ) -> List[Dict[str, Any]]:
        """List repository branches."""
        return await self._request(
            "GET",
            f"/repos/{owner}/{repo}/branches"
        )
    
    async def create_branch(
        self,
        owner: str,
        repo: str,
        branch_name: str,
        from_sha: str,
    ) -> Dict[str, Any]:
        """Create a new branch."""
        return await self._request(
            "POST",
            f"/repos/{owner}/{repo}/git/refs",
            json={
                "ref": f"refs/heads/{branch_name}",
                "sha": from_sha,
            }
        )
    
    # =========================================================================
    # Sync Operations
    # =========================================================================
    
    async def sync_project(
        self,
        owner: str,
        repo: str,
        files: List[GitHubFile],
        message: str = "Update from LaTeX Copilot",
        branch: str = "main",
    ) -> Dict[str, Any]:
        """
        Sync multiple files to repository.
        
        Creates or updates all files in a single operation.
        """
        results = {
            "created": [],
            "updated": [],
            "errors": [],
        }
        
        for file in files:
            try:
                # Check if file exists
                existing_sha = None
                try:
                    existing = await self.get_file(owner, repo, file.path, branch)
                    existing_sha = existing.sha
                except Exception:
                    pass  # File doesn't exist
                
                # Create or update
                await self.create_or_update_file(
                    owner=owner,
                    repo=repo,
                    path=file.path,
                    content=file.content,
                    message=f"{message}: {file.path}",
                    sha=existing_sha,
                    branch=branch,
                )
                
                if existing_sha:
                    results["updated"].append(file.path)
                else:
                    results["created"].append(file.path)
                    
            except Exception as e:
                logger.error(f"Error syncing {file.path}: {e}")
                results["errors"].append({"path": file.path, "error": str(e)})
        
        return results
    
    async def pull_project(
        self,
        owner: str,
        repo: str,
        branch: str = "main",
    ) -> List[GitHubFile]:
        """
        Pull all LaTeX files from repository.
        
        Returns list of .tex, .bib, and .sty files.
        """
        files = []
        tree = await self.get_tree(owner, repo, branch)
        
        # Filter for LaTeX-related files
        latex_extensions = {".tex", ".bib", ".sty", ".cls", ".bst"}
        
        for item in tree:
            if item["type"] == "blob":
                path = item["path"]
                ext = "." + path.split(".")[-1] if "." in path else ""
                
                if ext in latex_extensions:
                    try:
                        file = await self.get_file(owner, repo, path, branch)
                        files.append(file)
                    except Exception as e:
                        logger.error(f"Error pulling {path}: {e}")
        
        return files

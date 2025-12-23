"""
Integrations Router

REST API endpoints for external integrations:
- GitHub sync
- CrossRef citations
- Cloud storage (Google Drive, Dropbox)
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

from services.auth_service import get_current_user
from services.github_service import GitHubService, GitHubFile
from services.crossref_service import CrossRefService, Citation
from services.cloud_storage_service import CloudStorageService

router = APIRouter(prefix="/integrations", tags=["integrations"])


# ============================================================================
# Schemas
# ============================================================================

# GitHub
class GitHubConnectRequest(BaseModel):
    access_token: str
    
class GitHubRepoCreate(BaseModel):
    name: str
    description: str = ""
    private: bool = True

class GitHubFileSync(BaseModel):
    path: str
    content: str

class GitHubSyncRequest(BaseModel):
    owner: str
    repo: str
    files: List[GitHubFileSync]
    message: str = "Update from LaTeX Copilot"
    branch: str = "main"

class GitHubCommitResponse(BaseModel):
    sha: str
    message: str
    author: str
    date: str
    url: str

# CrossRef
class CitationResponse(BaseModel):
    doi: str
    title: str
    authors: List[Dict[str, str]]
    journal: str
    volume: str
    issue: str
    pages: str
    year: int
    publisher: str
    abstract: str
    url: str
    bibtex: str
    apa: str
    ieee: str
    mla: str
    chicago: str

class CrossRefSearchRequest(BaseModel):
    query: str
    limit: int = 10
    type_filter: Optional[str] = None

# Cloud Storage
class CloudConnectRequest(BaseModel):
    provider: str  # "google_drive" or "dropbox"
    access_token: str

class CloudFileResponse(BaseModel):
    id: str
    name: str
    path: str
    size: int
    modified: datetime
    is_folder: bool
    provider: str

class CloudUploadRequest(BaseModel):
    name: str
    content: str
    folder_id: Optional[str] = None


# ============================================================================
# GitHub Endpoints
# ============================================================================

@router.post("/github/verify")
async def verify_github_token(
    request: GitHubConnectRequest,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Verify GitHub access token and get user info."""
    service = GitHubService(request.access_token)
    
    if not await service.verify_token():
        raise HTTPException(status_code=401, detail="Invalid GitHub token")
    
    user = await service.get_user()
    return {
        "valid": True,
        "user": {
            "login": user.get("login"),
            "name": user.get("name"),
            "avatar_url": user.get("avatar_url"),
        }
    }


@router.get("/github/repos")
async def list_github_repos(
    access_token: str = Query(..., description="GitHub access token"),
    current_user: dict = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """List user's GitHub repositories."""
    service = GitHubService(access_token)
    repos = await service.list_repos()
    
    return [
        {
            "id": r.get("id"),
            "name": r.get("name"),
            "full_name": r.get("full_name"),
            "private": r.get("private"),
            "description": r.get("description"),
            "html_url": r.get("html_url"),
            "updated_at": r.get("updated_at"),
        }
        for r in repos
    ]


@router.post("/github/repos")
async def create_github_repo(
    access_token: str = Query(...),
    request: GitHubRepoCreate = Body(...),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Create a new GitHub repository."""
    service = GitHubService(access_token)
    
    repo = await service.create_repo(
        name=request.name,
        description=request.description,
        private=request.private,
    )
    
    return {
        "id": repo.get("id"),
        "name": repo.get("name"),
        "full_name": repo.get("full_name"),
        "html_url": repo.get("html_url"),
    }


@router.post("/github/sync")
async def sync_to_github(
    access_token: str = Query(...),
    request: GitHubSyncRequest = Body(...),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Sync files to GitHub repository."""
    service = GitHubService(access_token)
    
    files = [
        GitHubFile(path=f.path, content=f.content)
        for f in request.files
    ]
    
    result = await service.sync_project(
        owner=request.owner,
        repo=request.repo,
        files=files,
        message=request.message,
        branch=request.branch,
    )
    
    return result


@router.get("/github/pull/{owner}/{repo}")
async def pull_from_github(
    owner: str,
    repo: str,
    access_token: str = Query(...),
    branch: str = Query("main"),
    current_user: dict = Depends(get_current_user),
) -> List[Dict[str, str]]:
    """Pull LaTeX files from GitHub repository."""
    service = GitHubService(access_token)
    
    files = await service.pull_project(owner, repo, branch)
    
    return [
        {"path": f.path, "content": f.content}
        for f in files
    ]


@router.get("/github/commits/{owner}/{repo}")
async def get_github_commits(
    owner: str,
    repo: str,
    access_token: str = Query(...),
    branch: str = Query("main"),
    per_page: int = Query(20),
    current_user: dict = Depends(get_current_user),
) -> List[GitHubCommitResponse]:
    """Get commit history from GitHub repository."""
    service = GitHubService(access_token)
    
    commits = await service.get_commits(owner, repo, branch, per_page)
    
    return [
        GitHubCommitResponse(
            sha=c.sha,
            message=c.message,
            author=c.author,
            date=c.date,
            url=c.url,
        )
        for c in commits
    ]


# ============================================================================
# CrossRef Endpoints
# ============================================================================

@router.get("/crossref/doi/{doi:path}")
async def lookup_doi(
    doi: str,
    current_user: dict = Depends(get_current_user),
) -> CitationResponse:
    """Look up a citation by DOI."""
    service = CrossRefService()
    citation = await service.get_by_doi(doi)
    
    if not citation:
        raise HTTPException(status_code=404, detail="DOI not found")
    
    return _citation_to_response(citation)


@router.post("/crossref/search")
async def search_citations(
    request: CrossRefSearchRequest = Body(...),
    current_user: dict = Depends(get_current_user),
) -> List[CitationResponse]:
    """Search CrossRef for citations."""
    service = CrossRefService()
    
    citations = await service.search(
        query=request.query,
        rows=request.limit,
        filter_type=request.type_filter,
    )
    
    return [_citation_to_response(c) for c in citations]


@router.get("/crossref/search/title")
async def search_by_title(
    title: str = Query(..., min_length=3),
    limit: int = Query(5, ge=1, le=20),
    current_user: dict = Depends(get_current_user),
) -> List[CitationResponse]:
    """Search citations by title."""
    service = CrossRefService()
    citations = await service.search_by_title(title, limit)
    return [_citation_to_response(c) for c in citations]


@router.get("/crossref/search/author")
async def search_by_author(
    author: str = Query(..., min_length=2),
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
) -> List[CitationResponse]:
    """Search citations by author."""
    service = CrossRefService()
    citations = await service.search_by_author(author, limit)
    return [_citation_to_response(c) for c in citations]


def _citation_to_response(citation: Citation) -> CitationResponse:
    """Convert Citation to response model."""
    return CitationResponse(
        doi=citation.doi,
        title=citation.title,
        authors=[{"given": a.given, "family": a.family} for a in citation.authors],
        journal=citation.journal,
        volume=citation.volume,
        issue=citation.issue,
        pages=citation.pages,
        year=citation.year,
        publisher=citation.publisher,
        abstract=citation.abstract,
        url=citation.url,
        bibtex=citation.to_bibtex(),
        apa=citation.to_apa(),
        ieee=citation.to_ieee(),
        mla=citation.to_mla(),
        chicago=citation.to_chicago(),
    )


# ============================================================================
# Cloud Storage Endpoints
# ============================================================================

@router.post("/cloud/verify")
async def verify_cloud_token(
    request: CloudConnectRequest = Body(...),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, bool]:
    """Verify cloud storage access token."""
    try:
        provider = CloudStorageService.get_provider(
            request.provider,
            request.access_token
        )
        valid = await provider.authenticate(request.access_token)
        return {"valid": valid}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/cloud/files")
async def list_cloud_files(
    provider: str = Query(...),
    access_token: str = Query(...),
    folder_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
) -> List[CloudFileResponse]:
    """List files from cloud storage."""
    try:
        cloud_provider = CloudStorageService.get_provider(provider, access_token)
        files = await cloud_provider.list_files(folder_id)
        
        return [
            CloudFileResponse(
                id=f.id,
                name=f.name,
                path=f.path,
                size=f.size,
                modified=f.modified,
                is_folder=f.is_folder,
                provider=f.provider,
            )
            for f in files
        ]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/cloud/download/{file_id}")
async def download_cloud_file(
    file_id: str,
    provider: str = Query(...),
    access_token: str = Query(...),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, str]:
    """Download file from cloud storage."""
    try:
        cloud_provider = CloudStorageService.get_provider(provider, access_token)
        content = await cloud_provider.download_file(file_id)
        
        return {
            "content": content.decode("utf-8", errors="replace"),
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/cloud/upload")
async def upload_cloud_file(
    provider: str = Query(...),
    access_token: str = Query(...),
    request: CloudUploadRequest = Body(...),
    current_user: dict = Depends(get_current_user),
) -> CloudFileResponse:
    """Upload file to cloud storage."""
    try:
        cloud_provider = CloudStorageService.get_provider(provider, access_token)
        
        file = await cloud_provider.upload_file(
            name=request.name,
            content=request.content.encode("utf-8"),
            folder_id=request.folder_id,
        )
        
        return CloudFileResponse(
            id=file.id,
            name=file.name,
            path=file.path,
            size=file.size,
            modified=file.modified,
            is_folder=file.is_folder,
            provider=file.provider,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/cloud/{file_id}")
async def delete_cloud_file(
    file_id: str,
    provider: str = Query(...),
    access_token: str = Query(...),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, bool]:
    """Delete file from cloud storage."""
    try:
        cloud_provider = CloudStorageService.get_provider(provider, access_token)
        success = await cloud_provider.delete_file(file_id)
        return {"deleted": success}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/cloud/providers")
async def list_cloud_providers() -> List[str]:
    """List available cloud storage providers."""
    return CloudStorageService.list_providers()

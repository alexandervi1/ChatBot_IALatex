"""
Cloud Storage Integration Service

Provides integration with cloud storage providers:
- Google Drive
- Dropbox
- OneDrive (placeholder)
"""

import logging
from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any, BinaryIO
from dataclasses import dataclass
from datetime import datetime
import httpx

logger = logging.getLogger(__name__)


@dataclass
class CloudFile:
    """Represents a file in cloud storage."""
    id: str
    name: str
    path: str
    size: int
    modified: datetime
    is_folder: bool
    mime_type: str = ""
    download_url: str = ""
    provider: str = ""


@dataclass
class CloudFolder:
    """Represents a folder in cloud storage."""
    id: str
    name: str
    path: str
    files: List[CloudFile]
    folders: List["CloudFolder"]


class CloudStorageProvider(ABC):
    """Abstract base class for cloud storage providers."""
    
    @abstractmethod
    async def authenticate(self, token: str) -> bool:
        """Verify authentication token."""
        pass
    
    @abstractmethod
    async def list_files(self, folder_id: str = None) -> List[CloudFile]:
        """List files in a folder."""
        pass
    
    @abstractmethod
    async def download_file(self, file_id: str) -> bytes:
        """Download file content."""
        pass
    
    @abstractmethod
    async def upload_file(
        self,
        name: str,
        content: bytes,
        folder_id: str = None,
        mime_type: str = "text/plain"
    ) -> CloudFile:
        """Upload a file."""
        pass
    
    @abstractmethod
    async def create_folder(self, name: str, parent_id: str = None) -> CloudFolder:
        """Create a new folder."""
        pass
    
    @abstractmethod
    async def delete_file(self, file_id: str) -> bool:
        """Delete a file."""
        pass


# ============================================================================
# Google Drive Provider
# ============================================================================

class GoogleDriveProvider(CloudStorageProvider):
    """Google Drive integration."""
    
    BASE_URL = "https://www.googleapis.com/drive/v3"
    UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3"
    
    def __init__(self, access_token: str = None):
        self.token = access_token
        self.headers = {}
        if access_token:
            self.headers["Authorization"] = f"Bearer {access_token}"
    
    async def authenticate(self, token: str) -> bool:
        """Verify token and set authentication."""
        self.token = token
        self.headers["Authorization"] = f"Bearer {token}"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/about",
                    headers=self.headers,
                    params={"fields": "user"}
                )
                return response.status_code == 200
        except Exception:
            return False
    
    async def list_files(
        self,
        folder_id: str = None,
        page_size: int = 100,
    ) -> List[CloudFile]:
        """List files in Google Drive."""
        query = "trashed = false"
        if folder_id:
            query += f" and '{folder_id}' in parents"
        
        params = {
            "q": query,
            "pageSize": page_size,
            "fields": "files(id,name,mimeType,size,modifiedTime,webContentLink)",
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/files",
                headers=self.headers,
                params=params
            )
            response.raise_for_status()
            data = response.json()
        
        files = []
        for item in data.get("files", []):
            is_folder = item.get("mimeType") == "application/vnd.google-apps.folder"
            
            modified_str = item.get("modifiedTime", "")
            modified = datetime.fromisoformat(modified_str.replace("Z", "+00:00")) if modified_str else datetime.now()
            
            files.append(CloudFile(
                id=item["id"],
                name=item.get("name", ""),
                path=f"/{item.get('name', '')}",
                size=int(item.get("size", 0)),
                modified=modified,
                is_folder=is_folder,
                mime_type=item.get("mimeType", ""),
                download_url=item.get("webContentLink", ""),
                provider="google_drive",
            ))
        
        return files
    
    async def download_file(self, file_id: str) -> bytes:
        """Download file from Google Drive."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/files/{file_id}",
                headers=self.headers,
                params={"alt": "media"}
            )
            response.raise_for_status()
            return response.content
    
    async def upload_file(
        self,
        name: str,
        content: bytes,
        folder_id: str = None,
        mime_type: str = "text/plain"
    ) -> CloudFile:
        """Upload file to Google Drive."""
        import json
        
        metadata = {"name": name}
        if folder_id:
            metadata["parents"] = [folder_id]
        
        # Multipart upload
        boundary = "-------314159265358979323846"
        
        body = (
            f"--{boundary}\r\n"
            f"Content-Type: application/json; charset=UTF-8\r\n\r\n"
            f"{json.dumps(metadata)}\r\n"
            f"--{boundary}\r\n"
            f"Content-Type: {mime_type}\r\n\r\n"
        ).encode() + content + f"\r\n--{boundary}--".encode()
        
        headers = {
            **self.headers,
            "Content-Type": f"multipart/related; boundary={boundary}",
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.UPLOAD_URL}/files",
                headers=headers,
                params={"uploadType": "multipart", "fields": "id,name,mimeType,size,modifiedTime"},
                content=body
            )
            response.raise_for_status()
            data = response.json()
        
        return CloudFile(
            id=data["id"],
            name=data.get("name", name),
            path=f"/{data.get('name', name)}",
            size=int(data.get("size", len(content))),
            modified=datetime.now(),
            is_folder=False,
            mime_type=data.get("mimeType", mime_type),
            provider="google_drive",
        )
    
    async def create_folder(self, name: str, parent_id: str = None) -> CloudFolder:
        """Create folder in Google Drive."""
        metadata = {
            "name": name,
            "mimeType": "application/vnd.google-apps.folder",
        }
        if parent_id:
            metadata["parents"] = [parent_id]
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/files",
                headers={**self.headers, "Content-Type": "application/json"},
                json=metadata
            )
            response.raise_for_status()
            data = response.json()
        
        return CloudFolder(
            id=data["id"],
            name=name,
            path=f"/{name}",
            files=[],
            folders=[],
        )
    
    async def delete_file(self, file_id: str) -> bool:
        """Delete file from Google Drive."""
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.BASE_URL}/files/{file_id}",
                headers=self.headers
            )
            return response.status_code == 204


# ============================================================================
# Dropbox Provider
# ============================================================================

class DropboxProvider(CloudStorageProvider):
    """Dropbox integration."""
    
    API_URL = "https://api.dropboxapi.com/2"
    CONTENT_URL = "https://content.dropboxapi.com/2"
    
    def __init__(self, access_token: str = None):
        self.token = access_token
        self.headers = {}
        if access_token:
            self.headers["Authorization"] = f"Bearer {access_token}"
    
    async def authenticate(self, token: str) -> bool:
        """Verify Dropbox token."""
        self.token = token
        self.headers["Authorization"] = f"Bearer {token}"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.API_URL}/users/get_current_account",
                    headers=self.headers
                )
                return response.status_code == 200
        except Exception:
            return False
    
    async def list_files(self, folder_id: str = None) -> List[CloudFile]:
        """List files in Dropbox folder."""
        path = folder_id or ""
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.API_URL}/files/list_folder",
                headers={**self.headers, "Content-Type": "application/json"},
                json={"path": path, "recursive": False}
            )
            response.raise_for_status()
            data = response.json()
        
        files = []
        for item in data.get("entries", []):
            is_folder = item.get(".tag") == "folder"
            
            modified_str = item.get("server_modified", "")
            modified = datetime.fromisoformat(modified_str.replace("Z", "+00:00")) if modified_str else datetime.now()
            
            files.append(CloudFile(
                id=item.get("id", item.get("path_lower", "")),
                name=item.get("name", ""),
                path=item.get("path_display", ""),
                size=item.get("size", 0),
                modified=modified,
                is_folder=is_folder,
                provider="dropbox",
            ))
        
        return files
    
    async def download_file(self, file_id: str) -> bytes:
        """Download file from Dropbox."""
        import json
        
        headers = {
            **self.headers,
            "Dropbox-API-Arg": json.dumps({"path": file_id}),
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.CONTENT_URL}/files/download",
                headers=headers
            )
            response.raise_for_status()
            return response.content
    
    async def upload_file(
        self,
        name: str,
        content: bytes,
        folder_id: str = None,
        mime_type: str = "text/plain"
    ) -> CloudFile:
        """Upload file to Dropbox."""
        import json
        
        path = f"{folder_id or ''}/{name}"
        
        headers = {
            **self.headers,
            "Content-Type": "application/octet-stream",
            "Dropbox-API-Arg": json.dumps({
                "path": path,
                "mode": "overwrite",
                "autorename": True,
            }),
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.CONTENT_URL}/files/upload",
                headers=headers,
                content=content
            )
            response.raise_for_status()
            data = response.json()
        
        return CloudFile(
            id=data.get("id", path),
            name=data.get("name", name),
            path=data.get("path_display", path),
            size=data.get("size", len(content)),
            modified=datetime.now(),
            is_folder=False,
            provider="dropbox",
        )
    
    async def create_folder(self, name: str, parent_id: str = None) -> CloudFolder:
        """Create folder in Dropbox."""
        path = f"{parent_id or ''}/{name}"
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.API_URL}/files/create_folder_v2",
                headers={**self.headers, "Content-Type": "application/json"},
                json={"path": path, "autorename": True}
            )
            response.raise_for_status()
            data = response.json()
        
        metadata = data.get("metadata", {})
        return CloudFolder(
            id=metadata.get("id", path),
            name=metadata.get("name", name),
            path=metadata.get("path_display", path),
            files=[],
            folders=[],
        )
    
    async def delete_file(self, file_id: str) -> bool:
        """Delete file from Dropbox."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.API_URL}/files/delete_v2",
                headers={**self.headers, "Content-Type": "application/json"},
                json={"path": file_id}
            )
            return response.status_code == 200


# ============================================================================
# Cloud Storage Service (Factory)
# ============================================================================

class CloudStorageService:
    """
    Factory service for cloud storage providers.
    """
    
    PROVIDERS = {
        "google_drive": GoogleDriveProvider,
        "dropbox": DropboxProvider,
    }
    
    @classmethod
    def get_provider(cls, provider_name: str, access_token: str) -> CloudStorageProvider:
        """
        Get a cloud storage provider instance.
        
        Args:
            provider_name: "google_drive" or "dropbox"
            access_token: OAuth access token
        """
        provider_class = cls.PROVIDERS.get(provider_name)
        if not provider_class:
            raise ValueError(f"Unknown provider: {provider_name}")
        
        return provider_class(access_token)
    
    @classmethod
    def list_providers(cls) -> List[str]:
        """List available providers."""
        return list(cls.PROVIDERS.keys())

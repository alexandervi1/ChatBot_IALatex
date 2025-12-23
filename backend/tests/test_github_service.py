"""
Tests for GitHub Service

Unit tests for GitHub integration.
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import base64

from services.github_service import GitHubService, GitHubFile, GitHubCommit


class TestGitHubService:
    """Tests for GitHubService class."""
    
    @pytest.fixture
    def service(self):
        """Create service instance with mock token."""
        return GitHubService(access_token="ghp_test_token_123")
    
    # =========================================================================
    # Authentication Tests
    # =========================================================================
    
    @pytest.mark.asyncio
    async def test_verify_token_valid(self, service):
        """Test token verification with valid token."""
        with patch.object(service, 'get_user', new_callable=AsyncMock) as mock:
            mock.return_value = {"login": "testuser"}
            
            result = await service.verify_token()
            assert result is True
    
    @pytest.mark.asyncio
    async def test_verify_token_invalid(self, service):
        """Test token verification with invalid token."""
        with patch.object(service, 'get_user', new_callable=AsyncMock) as mock:
            mock.side_effect = Exception("Unauthorized")
            
            result = await service.verify_token()
            assert result is False
    
    @pytest.mark.asyncio
    async def test_get_user(self, service):
        """Test getting user info."""
        mock_response = {
            "login": "testuser",
            "name": "Test User",
            "avatar_url": "https://example.com/avatar.png"
        }
        
        with patch.object(service, '_request', new_callable=AsyncMock) as mock:
            mock.return_value = mock_response
            
            user = await service.get_user()
            
            assert user["login"] == "testuser"
            mock.assert_called_once_with("GET", "/user")
    
    # =========================================================================
    # Repository Tests
    # =========================================================================
    
    @pytest.mark.asyncio
    async def test_list_repos(self, service):
        """Test listing repositories."""
        mock_repos = [
            {"id": 1, "name": "repo1", "full_name": "user/repo1"},
            {"id": 2, "name": "repo2", "full_name": "user/repo2"},
        ]
        
        with patch.object(service, '_request', new_callable=AsyncMock) as mock:
            mock.return_value = mock_repos
            
            repos = await service.list_repos()
            
            assert len(repos) == 2
            assert repos[0]["name"] == "repo1"
    
    @pytest.mark.asyncio
    async def test_create_repo(self, service):
        """Test creating a new repository."""
        mock_response = {
            "id": 12345,
            "name": "my-latex-project",
            "full_name": "testuser/my-latex-project",
            "private": True,
        }
        
        with patch.object(service, '_request', new_callable=AsyncMock) as mock:
            mock.return_value = mock_response
            
            repo = await service.create_repo(
                name="my-latex-project",
                description="My LaTeX thesis",
                private=True,
            )
            
            assert repo["name"] == "my-latex-project"
            mock.assert_called_once()
            call_args = mock.call_args
            assert call_args[0][0] == "POST"
            assert call_args[0][1] == "/user/repos"
    
    @pytest.mark.asyncio
    async def test_get_repo(self, service):
        """Test getting repository info."""
        mock_response = {
            "id": 12345,
            "name": "repo",
            "full_name": "owner/repo",
        }
        
        with patch.object(service, '_request', new_callable=AsyncMock) as mock:
            mock.return_value = mock_response
            
            repo = await service.get_repo("owner", "repo")
            
            assert repo["full_name"] == "owner/repo"
            mock.assert_called_once_with("GET", "/repos/owner/repo")
    
    # =========================================================================
    # File Operations Tests
    # =========================================================================
    
    @pytest.mark.asyncio
    async def test_get_file(self, service):
        """Test getting file content."""
        content = "\\documentclass{article}\n\\begin{document}\nHello\n\\end{document}"
        encoded_content = base64.b64encode(content.encode()).decode()
        
        mock_response = {
            "content": encoded_content,
            "sha": "abc123",
            "path": "main.tex",
        }
        
        with patch.object(service, '_request', new_callable=AsyncMock) as mock:
            mock.return_value = mock_response
            
            file = await service.get_file("owner", "repo", "main.tex")
            
            assert file.path == "main.tex"
            assert file.content == content
            assert file.sha == "abc123"
    
    @pytest.mark.asyncio
    async def test_create_or_update_file(self, service):
        """Test creating/updating a file."""
        content = "\\documentclass{article}"
        
        mock_response = {
            "content": {"sha": "new_sha_123"},
            "commit": {"sha": "commit_sha"},
        }
        
        with patch.object(service, '_request', new_callable=AsyncMock) as mock:
            mock.return_value = mock_response
            
            result = await service.create_or_update_file(
                owner="owner",
                repo="repo",
                path="new_file.tex",
                content=content,
                message="Add new file",
            )
            
            mock.assert_called_once()
            call_args = mock.call_args
            assert call_args[0][0] == "PUT"
            assert "new_file.tex" in call_args[0][1]
    
    @pytest.mark.asyncio
    async def test_update_file_with_sha(self, service):
        """Test updating existing file with SHA."""
        with patch.object(service, '_request', new_callable=AsyncMock) as mock:
            mock.return_value = {}
            
            await service.create_or_update_file(
                owner="owner",
                repo="repo",
                path="existing.tex",
                content="updated content",
                message="Update file",
                sha="existing_sha",
            )
            
            call_args = mock.call_args
            json_payload = call_args[1]["json"]
            assert json_payload["sha"] == "existing_sha"
    
    @pytest.mark.asyncio
    async def test_delete_file(self, service):
        """Test deleting a file."""
        with patch.object(service, '_request', new_callable=AsyncMock) as mock:
            mock.return_value = {}
            
            await service.delete_file(
                owner="owner",
                repo="repo",
                path="to_delete.tex",
                sha="file_sha",
                message="Remove file",
            )
            
            mock.assert_called_once()
            assert mock.call_args[0][0] == "DELETE"
    
    # =========================================================================
    # Tree Operations Tests
    # =========================================================================
    
    @pytest.mark.asyncio
    async def test_get_tree(self, service):
        """Test getting repository tree."""
        mock_response = {
            "tree": [
                {"type": "blob", "path": "main.tex"},
                {"type": "blob", "path": "refs.bib"},
                {"type": "tree", "path": "images"},
            ]
        }
        
        with patch.object(service, '_request', new_callable=AsyncMock) as mock:
            mock.return_value = mock_response
            
            tree = await service.get_tree("owner", "repo")
            
            assert len(tree) == 3
            assert tree[0]["path"] == "main.tex"
    
    # =========================================================================
    # Commit Operations Tests
    # =========================================================================
    
    @pytest.mark.asyncio
    async def test_get_commits(self, service):
        """Test getting commit history."""
        mock_response = [
            {
                "sha": "abc123",
                "commit": {
                    "message": "Initial commit",
                    "author": {
                        "name": "Test User",
                        "date": "2024-01-15T10:00:00Z",
                    }
                },
                "html_url": "https://github.com/owner/repo/commit/abc123",
            },
            {
                "sha": "def456",
                "commit": {
                    "message": "Add references",
                    "author": {
                        "name": "Test User",
                        "date": "2024-01-16T11:00:00Z",
                    }
                },
                "html_url": "https://github.com/owner/repo/commit/def456",
            },
        ]
        
        with patch.object(service, '_request', new_callable=AsyncMock) as mock:
            mock.return_value = mock_response
            
            commits = await service.get_commits("owner", "repo")
            
            assert len(commits) == 2
            assert commits[0].sha == "abc123"
            assert commits[0].message == "Initial commit"
            assert isinstance(commits[0], GitHubCommit)
    
    # =========================================================================
    # Branch Operations Tests
    # =========================================================================
    
    @pytest.mark.asyncio
    async def test_list_branches(self, service):
        """Test listing branches."""
        mock_response = [
            {"name": "main", "commit": {"sha": "abc"}},
            {"name": "develop", "commit": {"sha": "def"}},
        ]
        
        with patch.object(service, '_request', new_callable=AsyncMock) as mock:
            mock.return_value = mock_response
            
            branches = await service.list_branches("owner", "repo")
            
            assert len(branches) == 2
            assert branches[0]["name"] == "main"
    
    @pytest.mark.asyncio
    async def test_create_branch(self, service):
        """Test creating a branch."""
        mock_response = {"ref": "refs/heads/feature-branch"}
        
        with patch.object(service, '_request', new_callable=AsyncMock) as mock:
            mock.return_value = mock_response
            
            result = await service.create_branch(
                owner="owner",
                repo="repo",
                branch_name="feature-branch",
                from_sha="source_sha",
            )
            
            mock.assert_called_once()
            call_args = mock.call_args[1]["json"]
            assert call_args["ref"] == "refs/heads/feature-branch"
    
    # =========================================================================
    # Sync Operations Tests
    # =========================================================================
    
    @pytest.mark.asyncio
    async def test_sync_project(self, service):
        """Test syncing multiple files."""
        files = [
            GitHubFile(path="main.tex", content="\\documentclass{article}"),
            GitHubFile(path="refs.bib", content="@article{test}"),
        ]
        
        # Mock get_file to simulate file doesn't exist
        async def mock_get_file(*args, **kwargs):
            raise Exception("Not found")
        
        with patch.object(service, 'get_file', side_effect=mock_get_file):
            with patch.object(service, 'create_or_update_file', new_callable=AsyncMock) as mock_create:
                mock_create.return_value = {}
                
                result = await service.sync_project(
                    owner="owner",
                    repo="repo",
                    files=files,
                    message="Sync from Copilot",
                )
                
                assert len(result["created"]) == 2
                assert len(result["errors"]) == 0
    
    @pytest.mark.asyncio
    async def test_pull_project(self, service):
        """Test pulling LaTeX files from repo."""
        mock_tree = [
            {"type": "blob", "path": "main.tex"},
            {"type": "blob", "path": "refs.bib"},
            {"type": "blob", "path": "README.md"},  # Should be ignored
            {"type": "blob", "path": "style.sty"},
        ]
        
        content = base64.b64encode(b"content").decode()
        mock_file_response = {"content": content, "sha": "abc"}
        
        with patch.object(service, 'get_tree', new_callable=AsyncMock) as mock_tree_fn:
            mock_tree_fn.return_value = mock_tree
            
            with patch.object(service, '_request', new_callable=AsyncMock) as mock_request:
                mock_request.return_value = mock_file_response
                
                files = await service.pull_project("owner", "repo")
                
                # Should only pull .tex, .bib, .sty files
                assert len(files) == 3


class TestGitHubFile:
    """Tests for GitHubFile dataclass."""
    
    def test_create_file(self):
        """Test creating a GitHubFile."""
        file = GitHubFile(
            path="test.tex",
            content="\\documentclass{article}",
            sha="abc123"
        )
        
        assert file.path == "test.tex"
        assert file.content == "\\documentclass{article}"
        assert file.sha == "abc123"
    
    def test_create_file_no_sha(self):
        """Test creating a GitHubFile without SHA."""
        file = GitHubFile(
            path="new.tex",
            content="content"
        )
        
        assert file.sha is None


class TestGitHubCommit:
    """Tests for GitHubCommit dataclass."""
    
    def test_create_commit(self):
        """Test creating a GitHubCommit."""
        commit = GitHubCommit(
            sha="abc123",
            message="Test commit",
            author="Test User",
            date="2024-01-15T10:00:00Z",
            url="https://github.com/owner/repo/commit/abc123"
        )
        
        assert commit.sha == "abc123"
        assert commit.message == "Test commit"
        assert commit.author == "Test User"

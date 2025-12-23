"""
Tests for CrossRef Service

Unit tests for citation lookup and formatting.
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import httpx

from services.crossref_service import (
    CrossRefService,
    Citation,
    Author,
    lookup_doi,
    search_citations,
)


class TestAuthor:
    """Tests for Author dataclass."""
    
    def test_full_name(self):
        """Test full name generation."""
        author = Author(given="John", family="Doe")
        assert author.full_name == "John Doe"
    
    def test_full_name_missing_given(self):
        """Test full name with missing given name."""
        author = Author(given="", family="Doe")
        assert author.full_name == "Doe"
    
    def test_citation_name(self):
        """Test citation format name."""
        author = Author(given="John", family="Doe")
        assert author.citation_name == "Doe, J."
    
    def test_citation_name_no_given(self):
        """Test citation name without given name."""
        author = Author(given="", family="Smith")
        assert author.citation_name == "Smith"


class TestCitation:
    """Tests for Citation dataclass."""
    
    @pytest.fixture
    def sample_citation(self):
        """Create a sample citation for testing."""
        return Citation(
            doi="10.1234/test.2024",
            title="A Test Paper on Testing",
            authors=[
                Author(given="John", family="Doe"),
                Author(given="Jane", family="Smith"),
            ],
            journal="Journal of Testing",
            volume="42",
            issue="3",
            pages="100-110",
            year=2024,
            publisher="Test Publisher",
            abstract="This is a test abstract.",
            url="https://doi.org/10.1234/test.2024",
            citation_type="journal-article",
        )
    
    def test_bibtex_key(self, sample_citation):
        """Test BibTeX key generation."""
        assert sample_citation.bibtex_key == "doe2024"
    
    def test_bibtex_key_special_chars(self):
        """Test BibTeX key with special characters in name."""
        citation = Citation(
            doi="10.1234/test",
            title="Test",
            authors=[Author(given="José", family="García-López")],
            year=2023,
        )
        assert citation.bibtex_key == "garcalopez2023"
    
    def test_to_bibtex(self, sample_citation):
        """Test BibTeX output."""
        bibtex = sample_citation.to_bibtex()
        
        assert "@article{doe2024," in bibtex
        assert "author = {John Doe and Jane Smith}" in bibtex
        assert "title = {A Test Paper on Testing}" in bibtex
        assert "journal = {Journal of Testing}" in bibtex
        assert "year = {2024}" in bibtex
        assert "volume = {42}" in bibtex
        assert "doi = {10.1234/test.2024}" in bibtex
    
    def test_to_apa(self, sample_citation):
        """Test APA format output."""
        apa = sample_citation.to_apa()
        
        assert "Doe, J., & Smith, J." in apa
        assert "(2024)" in apa
        assert "A Test Paper on Testing" in apa
        assert "*Journal of Testing*" in apa
        assert "https://doi.org/10.1234/test.2024" in apa
    
    def test_to_ieee(self, sample_citation):
        """Test IEEE format output."""
        ieee = sample_citation.to_ieee()
        
        assert "J. Doe" in ieee
        assert "J. Smith" in ieee
        assert '"A Test Paper on Testing,"' in ieee
        assert "vol. 42" in ieee
        assert "pp. 100-110" in ieee
    
    def test_to_mla(self, sample_citation):
        """Test MLA format output."""
        mla = sample_citation.to_mla()
        
        assert "Doe, John, et al." in mla
        assert '"A Test Paper on Testing."' in mla
        assert "*Journal of Testing*" in mla
    
    def test_to_chicago(self, sample_citation):
        """Test Chicago format output."""
        chicago = sample_citation.to_chicago()
        
        assert "Doe, John" in chicago
        assert '"A Test Paper on Testing."' in chicago
    
    def test_single_author_apa(self):
        """Test APA with single author."""
        citation = Citation(
            doi="10.1234/test",
            title="Solo Paper",
            authors=[Author(given="Alice", family="Johnson")],
            year=2023,
            journal="Test Journal",
        )
        apa = citation.to_apa()
        assert "Johnson, A." in apa
        assert "et al." not in apa


class TestCrossRefService:
    """Tests for CrossRefService class."""
    
    @pytest.fixture
    def service(self):
        """Create service instance."""
        return CrossRefService(email="test@example.com")
    
    @pytest.fixture
    def mock_crossref_response(self):
        """Create mock CrossRef API response."""
        return {
            "message": {
                "DOI": "10.1234/test",
                "title": ["Test Article Title"],
                "author": [
                    {"given": "John", "family": "Doe"},
                    {"given": "Jane", "family": "Smith"},
                ],
                "container-title": ["Test Journal"],
                "volume": "10",
                "issue": "2",
                "page": "50-60",
                "published": {"date-parts": [[2024, 1, 15]]},
                "publisher": "Test Publisher",
                "type": "journal-article",
            }
        }
    
    @pytest.mark.asyncio
    async def test_get_by_doi(self, service, mock_crossref_response):
        """Test DOI lookup."""
        with patch.object(service, '_request', new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_crossref_response
            
            citation = await service.get_by_doi("10.1234/test")
            
            assert citation is not None
            assert citation.doi == "10.1234/test"
            assert citation.title == "Test Article Title"
            assert len(citation.authors) == 2
            assert citation.year == 2024
    
    @pytest.mark.asyncio
    async def test_get_by_doi_with_url_prefix(self, service, mock_crossref_response):
        """Test DOI lookup with https://doi.org/ prefix."""
        with patch.object(service, '_request', new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_crossref_response
            
            await service.get_by_doi("https://doi.org/10.1234/test")
            
            mock_request.assert_called_once_with("/works/10.1234/test")
    
    @pytest.mark.asyncio
    async def test_get_by_doi_not_found(self, service):
        """Test DOI lookup for non-existent DOI."""
        with patch.object(service, '_request', new_callable=AsyncMock) as mock_request:
            mock_request.side_effect = httpx.HTTPStatusError("Not found", request=MagicMock(), response=MagicMock())
            
            citation = await service.get_by_doi("10.9999/nonexistent")
            assert citation is None
    
    @pytest.mark.asyncio
    async def test_search(self, service):
        """Test citation search."""
        mock_response = {
            "message": {
                "items": [
                    {
                        "DOI": "10.1234/a",
                        "title": ["First Result"],
                        "author": [{"given": "A", "family": "B"}],
                        "published": {"date-parts": [[2023]]},
                    },
                    {
                        "DOI": "10.1234/b",
                        "title": ["Second Result"],
                        "author": [{"given": "C", "family": "D"}],
                        "published": {"date-parts": [[2022]]},
                    },
                ]
            }
        }
        
        with patch.object(service, '_request', new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            
            results = await service.search("machine learning", rows=10)
            
            assert len(results) == 2
            assert results[0].doi == "10.1234/a"
            assert results[1].doi == "10.1234/b"
    
    @pytest.mark.asyncio
    async def test_search_by_title(self, service):
        """Test search by title."""
        mock_response = {"message": {"items": []}}
        
        with patch.object(service, '_request', new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            
            await service.search_by_title("attention is all you need")
            
            mock_request.assert_called_once()
            call_args = mock_request.call_args
            assert "query.title" in str(call_args)
    
    @pytest.mark.asyncio
    async def test_search_by_author(self, service):
        """Test search by author."""
        mock_response = {"message": {"items": []}}
        
        with patch.object(service, '_request', new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            
            await service.search_by_author("Einstein")
            
            mock_request.assert_called_once()
            call_args = mock_request.call_args
            assert "query.author" in str(call_args)


class TestConvenienceFunctions:
    """Tests for module-level convenience functions."""
    
    @pytest.mark.asyncio
    async def test_lookup_doi_function(self):
        """Test lookup_doi convenience function."""
        mock_response = {
            "message": {
                "DOI": "10.1234/test",
                "title": ["Test"],
                "published": {"date-parts": [[2024]]},
            }
        }
        
        with patch('services.crossref_service.CrossRefService._request', new_callable=AsyncMock) as mock:
            mock.return_value = mock_response
            
            # This would need the actual implementation to work
            # Just testing the interface exists
            assert callable(lookup_doi)
    
    @pytest.mark.asyncio
    async def test_search_citations_function(self):
        """Test search_citations convenience function."""
        assert callable(search_citations)


class TestCitationEdgeCases:
    """Test edge cases in citation formatting."""
    
    def test_empty_authors(self):
        """Test citation with no authors."""
        citation = Citation(
            doi="10.1234/test",
            title="Anonymous Work",
            authors=[],
            year=2024,
        )
        
        bibtex = citation.to_bibtex()
        assert "author" not in bibtex.lower() or "author = {}" not in bibtex
    
    def test_missing_year(self):
        """Test citation with no year."""
        citation = Citation(
            doi="10.1234/test",
            title="Undated Work",
            authors=[Author(given="A", family="B")],
            year=0,
        )
        
        bibtex = citation.to_bibtex()
        assert "year" not in bibtex or "year = {0}" not in bibtex
    
    def test_html_in_abstract(self):
        """Test that HTML is stripped from abstracts."""
        # This tests the parsing logic
        mock_data = {
            "DOI": "10.1234/test",
            "title": ["Test"],
            "abstract": "<p>This is <b>bold</b> text.</p>",
            "published": {"date-parts": [[2024]]},
        }
        
        service = CrossRefService()
        citation = service._parse_work(mock_data)
        
        assert "<p>" not in citation.abstract
        assert "<b>" not in citation.abstract

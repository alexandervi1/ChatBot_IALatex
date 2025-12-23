"""
CrossRef Citation Service

Enhanced CrossRef integration for academic citations:
- DOI lookup
- Search by title/author
- BibTeX generation
- Multiple citation formats
"""

import logging
import re
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field
import httpx

logger = logging.getLogger(__name__)


@dataclass
class Author:
    """Represents an author."""
    given: str = ""
    family: str = ""
    orcid: Optional[str] = None
    
    @property
    def full_name(self) -> str:
        return f"{self.given} {self.family}".strip()
    
    @property
    def citation_name(self) -> str:
        """Format for citations: Family, G."""
        if self.given:
            return f"{self.family}, {self.given[0]}."
        return self.family


@dataclass
class Citation:
    """Represents a citation from CrossRef."""
    doi: str
    title: str
    authors: List[Author] = field(default_factory=list)
    journal: str = ""
    volume: str = ""
    issue: str = ""
    pages: str = ""
    year: int = 0
    publisher: str = ""
    abstract: str = ""
    url: str = ""
    citation_type: str = "article"  # article, book, inproceedings, etc.
    isbn: str = ""
    issn: str = ""
    keywords: List[str] = field(default_factory=list)
    
    @property
    def bibtex_key(self) -> str:
        """Generate BibTeX key."""
        first_author = self.authors[0].family if self.authors else "unknown"
        # Clean the author name
        key = re.sub(r'[^a-zA-Z]', '', first_author.lower())
        return f"{key}{self.year}"
    
    def to_bibtex(self) -> str:
        """Generate BibTeX entry."""
        entry_type = self._get_bibtex_type()
        
        lines = [f"@{entry_type}{{{self.bibtex_key},"]
        
        # Authors
        if self.authors:
            author_str = " and ".join(a.full_name for a in self.authors)
            lines.append(f"  author = {{{author_str}}},")
        
        # Title
        lines.append(f"  title = {{{self.title}}},")
        
        # Year
        if self.year:
            lines.append(f"  year = {{{self.year}}},")
        
        # Journal/Book specific fields
        if self.journal:
            lines.append(f"  journal = {{{self.journal}}},")
        
        if self.volume:
            lines.append(f"  volume = {{{self.volume}}},")
        
        if self.issue:
            lines.append(f"  number = {{{self.issue}}},")
        
        if self.pages:
            lines.append(f"  pages = {{{self.pages}}},")
        
        if self.publisher:
            lines.append(f"  publisher = {{{self.publisher}}},")
        
        if self.doi:
            lines.append(f"  doi = {{{self.doi}}},")
        
        if self.url:
            lines.append(f"  url = {{{self.url}}},")
        
        if self.isbn:
            lines.append(f"  isbn = {{{self.isbn}}},")
        
        lines.append("}")
        
        return "\n".join(lines)
    
    def to_apa(self) -> str:
        """Generate APA 7 citation."""
        parts = []
        
        # Authors
        if self.authors:
            if len(self.authors) == 1:
                parts.append(f"{self.authors[0].family}, {self.authors[0].given[0] if self.authors[0].given else ''}.")
            elif len(self.authors) == 2:
                parts.append(
                    f"{self.authors[0].family}, {self.authors[0].given[0] if self.authors[0].given else ''}., & "
                    f"{self.authors[1].family}, {self.authors[1].given[0] if self.authors[1].given else ''}."
                )
            else:
                first = f"{self.authors[0].family}, {self.authors[0].given[0] if self.authors[0].given else ''}."
                parts.append(f"{first}, et al.")
        
        # Year
        if self.year:
            parts.append(f"({self.year}).")
        
        # Title
        parts.append(f"{self.title}.")
        
        # Journal
        if self.journal:
            journal_part = f"*{self.journal}*"
            if self.volume:
                journal_part += f", *{self.volume}*"
            if self.issue:
                journal_part += f"({self.issue})"
            if self.pages:
                journal_part += f", {self.pages}"
            parts.append(journal_part + ".")
        
        # DOI
        if self.doi:
            parts.append(f"https://doi.org/{self.doi}")
        
        return " ".join(parts)
    
    def to_ieee(self) -> str:
        """Generate IEEE citation."""
        parts = []
        
        # Authors
        if self.authors:
            author_strs = []
            for a in self.authors[:3]:
                if a.given:
                    initials = ". ".join(a.given.split()[0][0] for _ in [1]) + "."
                    author_strs.append(f"{initials} {a.family}")
                else:
                    author_strs.append(a.family)
            
            if len(self.authors) > 3:
                author_strs.append("et al.")
            
            parts.append(", ".join(author_strs) + ",")
        
        # Title
        parts.append(f'"{self.title},"')
        
        # Journal
        if self.journal:
            parts.append(f"*{self.journal}*,")
        
        # Volume and pages
        vol_parts = []
        if self.volume:
            vol_parts.append(f"vol. {self.volume}")
        if self.issue:
            vol_parts.append(f"no. {self.issue}")
        if self.pages:
            vol_parts.append(f"pp. {self.pages}")
        if vol_parts:
            parts.append(", ".join(vol_parts) + ",")
        
        # Year
        if self.year:
            parts.append(f"{self.year}.")
        
        return " ".join(parts)
    
    def to_mla(self) -> str:
        """Generate MLA citation."""
        parts = []
        
        # Authors
        if self.authors:
            first = self.authors[0]
            parts.append(f"{first.family}, {first.given}.")
            if len(self.authors) > 1:
                parts[-1] = parts[-1][:-1] + ", et al."
        
        # Title
        parts.append(f'"{self.title}."')
        
        # Journal
        if self.journal:
            journal_part = f"*{self.journal}*"
            if self.volume:
                journal_part += f", vol. {self.volume}"
            if self.issue:
                journal_part += f", no. {self.issue}"
            if self.year:
                journal_part += f", {self.year}"
            if self.pages:
                journal_part += f", pp. {self.pages}"
            parts.append(journal_part + ".")
        
        return " ".join(parts)
    
    def to_chicago(self) -> str:
        """Generate Chicago citation."""
        parts = []
        
        # Authors
        if self.authors:
            first = self.authors[0]
            author_str = f"{first.family}, {first.given}"
            if len(self.authors) > 1:
                others = [f"{a.given} {a.family}" for a in self.authors[1:3]]
                if len(self.authors) > 3:
                    others.append("et al.")
                author_str += ", " + ", and ".join(others)
            parts.append(author_str + ".")
        
        # Title
        parts.append(f'"{self.title}."')
        
        # Journal
        if self.journal:
            parts.append(f"*{self.journal}*")
            details = []
            if self.volume:
                details.append(self.volume)
            if self.issue:
                details.append(f"no. {self.issue}")
            if self.year:
                details.append(f"({self.year})")
            if self.pages:
                details.append(self.pages)
            if details:
                parts.append(", ".join(details) + ".")
        
        return " ".join(parts)
    
    def _get_bibtex_type(self) -> str:
        """Map citation type to BibTeX entry type."""
        type_map = {
            "article": "article",
            "journal-article": "article",
            "book": "book",
            "book-chapter": "incollection",
            "proceedings-article": "inproceedings",
            "proceedings": "proceedings",
            "thesis": "phdthesis",
            "report": "techreport",
        }
        return type_map.get(self.citation_type, "misc")


class CrossRefService:
    """
    Service for CrossRef API integration.
    
    Provides DOI lookup and citation search.
    """
    
    BASE_URL = "https://api.crossref.org"
    
    def __init__(self, email: Optional[str] = None):
        """
        Initialize CrossRef service.
        
        Args:
            email: Optional email for polite pool (faster rate limits)
        """
        self.email = email
        self.headers = {
            "User-Agent": f"LaTeX-Copilot/1.0 (mailto:{email})" if email else "LaTeX-Copilot/1.0",
        }
    
    async def _request(self, endpoint: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """Make request to CrossRef API."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self.BASE_URL}{endpoint}",
                headers=self.headers,
                params=params,
            )
            response.raise_for_status()
            return response.json()
    
    async def get_by_doi(self, doi: str) -> Optional[Citation]:
        """
        Get citation by DOI.
        
        Args:
            doi: DOI string (with or without https://doi.org/ prefix)
        """
        # Clean DOI
        doi = doi.strip()
        if doi.startswith("https://doi.org/"):
            doi = doi[16:]
        elif doi.startswith("http://doi.org/"):
            doi = doi[15:]
        elif doi.startswith("doi:"):
            doi = doi[4:]
        
        try:
            data = await self._request(f"/works/{doi}")
            return self._parse_work(data.get("message", {}))
        except Exception as e:
            logger.error(f"Error fetching DOI {doi}: {e}")
            return None
    
    async def search(
        self,
        query: str,
        rows: int = 10,
        filter_type: Optional[str] = None,
    ) -> List[Citation]:
        """
        Search CrossRef for citations.
        
        Args:
            query: Search query (title, author, etc.)
            rows: Number of results to return
            filter_type: Filter by type (journal-article, book, etc.)
        """
        params = {
            "query": query,
            "rows": rows,
        }
        
        if filter_type:
            params["filter"] = f"type:{filter_type}"
        
        try:
            data = await self._request("/works", params)
            items = data.get("message", {}).get("items", [])
            return [self._parse_work(item) for item in items]
        except Exception as e:
            logger.error(f"Error searching CrossRef: {e}")
            return []
    
    async def search_by_title(self, title: str, rows: int = 5) -> List[Citation]:
        """Search by title."""
        params = {
            "query.title": title,
            "rows": rows,
        }
        
        try:
            data = await self._request("/works", params)
            items = data.get("message", {}).get("items", [])
            return [self._parse_work(item) for item in items]
        except Exception as e:
            logger.error(f"Error searching by title: {e}")
            return []
    
    async def search_by_author(self, author: str, rows: int = 10) -> List[Citation]:
        """Search by author name."""
        params = {
            "query.author": author,
            "rows": rows,
        }
        
        try:
            data = await self._request("/works", params)
            items = data.get("message", {}).get("items", [])
            return [self._parse_work(item) for item in items]
        except Exception as e:
            logger.error(f"Error searching by author: {e}")
            return []
    
    def _parse_work(self, data: Dict[str, Any]) -> Citation:
        """Parse CrossRef work into Citation object."""
        # Authors
        authors = []
        for author_data in data.get("author", []):
            authors.append(Author(
                given=author_data.get("given", ""),
                family=author_data.get("family", ""),
                orcid=author_data.get("ORCID"),
            ))
        
        # Title
        title_list = data.get("title", [])
        title = title_list[0] if title_list else ""
        
        # Container (journal/book)
        container = data.get("container-title", [])
        journal = container[0] if container else ""
        
        # Date
        date_parts = data.get("published", {}).get("date-parts", [[]])
        year = date_parts[0][0] if date_parts and date_parts[0] else 0
        
        # Pages
        pages = data.get("page", "")
        
        # Abstract
        abstract = data.get("abstract", "")
        if abstract:
            # Clean HTML from abstract
            abstract = re.sub(r'<[^>]+>', '', abstract)
        
        return Citation(
            doi=data.get("DOI", ""),
            title=title,
            authors=authors,
            journal=journal,
            volume=data.get("volume", ""),
            issue=data.get("issue", ""),
            pages=pages,
            year=year,
            publisher=data.get("publisher", ""),
            abstract=abstract,
            url=data.get("URL", ""),
            citation_type=data.get("type", "article"),
            issn=data.get("ISSN", [""])[0] if data.get("ISSN") else "",
            isbn=data.get("ISBN", [""])[0] if data.get("ISBN") else "",
        )


# ============================================================================
# Convenience Functions
# ============================================================================

async def lookup_doi(doi: str) -> Optional[Citation]:
    """Quick DOI lookup."""
    service = CrossRefService()
    return await service.get_by_doi(doi)


async def search_citations(query: str, limit: int = 10) -> List[Citation]:
    """Quick citation search."""
    service = CrossRefService()
    return await service.search(query, rows=limit)

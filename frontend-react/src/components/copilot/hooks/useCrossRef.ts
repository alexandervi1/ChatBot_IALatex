/**
 * useCrossRef Hook
 * 
 * CrossRef citation lookup and search.
 */

'use client';

import { useState, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface CrossRefAuthor {
    given: string;
    family: string;
}

export interface CrossRefCitation {
    doi: string;
    title: string;
    authors: CrossRefAuthor[];
    journal: string;
    volume: string;
    issue: string;
    pages: string;
    year: number;
    publisher: string;
    abstract: string;
    url: string;
    bibtex: string;
    apa: string;
    ieee: string;
    mla: string;
    chicago: string;
}

type CitationFormat = 'bibtex' | 'apa' | 'ieee' | 'mla' | 'chicago';

interface UseCrossRefReturn {
    // Search
    results: CrossRefCitation[];
    search: (query: string, limit?: number) => Promise<void>;
    searchByTitle: (title: string) => Promise<void>;
    searchByAuthor: (author: string) => Promise<void>;

    // Lookup
    lookupDOI: (doi: string) => Promise<CrossRefCitation | null>;

    // Selected
    selected: CrossRefCitation | null;
    select: (citation: CrossRefCitation | null) => void;

    // Format
    getFormatted: (citation: CrossRefCitation, format: CitationFormat) => string;
    copyToClipboard: (citation: CrossRefCitation, format: CitationFormat) => Promise<void>;
    insertBibTeX: (citation: CrossRefCitation) => string;

    // State
    isLoading: boolean;
    error: string | null;
    clearResults: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useCrossRef(): UseCrossRefReturn {
    const [results, setResults] = useState<CrossRefCitation[]>([]);
    const [selected, setSelected] = useState<CrossRefCitation | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    // Search CrossRef
    const search = useCallback(async (query: string, limit: number = 10) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${apiUrl}/integrations/crossref/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, limit }),
            });

            if (!response.ok) throw new Error('Search failed');

            const data = await response.json();
            setResults(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Search failed');
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, [apiUrl]);

    // Search by title
    const searchByTitle = useCallback(async (title: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${apiUrl}/integrations/crossref/search/title?title=${encodeURIComponent(title)}`
            );

            if (!response.ok) throw new Error('Search failed');

            const data = await response.json();
            setResults(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Search failed');
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, [apiUrl]);

    // Search by author
    const searchByAuthor = useCallback(async (author: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${apiUrl}/integrations/crossref/search/author?author=${encodeURIComponent(author)}`
            );

            if (!response.ok) throw new Error('Search failed');

            const data = await response.json();
            setResults(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Search failed');
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, [apiUrl]);

    // Lookup DOI
    const lookupDOI = useCallback(async (doi: string): Promise<CrossRefCitation | null> => {
        setIsLoading(true);
        setError(null);

        try {
            // Clean DOI
            let cleanDoi = doi.trim();
            if (cleanDoi.startsWith('https://doi.org/')) {
                cleanDoi = cleanDoi.slice(16);
            } else if (cleanDoi.startsWith('http://doi.org/')) {
                cleanDoi = cleanDoi.slice(15);
            } else if (cleanDoi.startsWith('doi:')) {
                cleanDoi = cleanDoi.slice(4);
            }

            const response = await fetch(
                `${apiUrl}/integrations/crossref/doi/${encodeURIComponent(cleanDoi)}`
            );

            if (!response.ok) {
                if (response.status === 404) {
                    setError('DOI not found');
                    return null;
                }
                throw new Error('Lookup failed');
            }

            const citation = await response.json();
            setSelected(citation);
            return citation;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Lookup failed');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [apiUrl]);

    // Get formatted citation
    const getFormatted = useCallback((citation: CrossRefCitation, format: CitationFormat): string => {
        switch (format) {
            case 'bibtex':
                return citation.bibtex;
            case 'apa':
                return citation.apa;
            case 'ieee':
                return citation.ieee;
            case 'mla':
                return citation.mla;
            case 'chicago':
                return citation.chicago;
            default:
                return citation.bibtex;
        }
    }, []);

    // Copy to clipboard
    const copyToClipboard = useCallback(async (
        citation: CrossRefCitation,
        format: CitationFormat
    ) => {
        const text = getFormatted(citation, format);
        await navigator.clipboard.writeText(text);
    }, [getFormatted]);

    // Insert BibTeX (returns formatted entry)
    const insertBibTeX = useCallback((citation: CrossRefCitation): string => {
        return citation.bibtex;
    }, []);

    // Clear results
    const clearResults = useCallback(() => {
        setResults([]);
        setError(null);
    }, []);

    // Select citation
    const select = useCallback((citation: CrossRefCitation | null) => {
        setSelected(citation);
    }, []);

    return {
        results,
        search,
        searchByTitle,
        searchByAuthor,
        lookupDOI,
        selected,
        select,
        getFormatted,
        copyToClipboard,
        insertBibTeX,
        isLoading,
        error,
        clearResults,
    };
}

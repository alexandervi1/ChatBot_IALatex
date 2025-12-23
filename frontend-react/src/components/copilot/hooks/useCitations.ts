/**
 * useCitations Hook
 * 
 * Manages citation generation in various academic formats.
 * Integrates with the citation-utils library.
 */

'use client';

import { useState, useCallback } from 'react';
import {
    parseCitationInput,
    generateCitation,
    generateBibTeXEntry,
    type CitationFormat
} from '@/lib/citation-utils';

// ============================================================================
// Types
// ============================================================================

export interface CitationData {
    authors: string;
    title: string;
    journal?: string;
    year: string;
    volume?: string;
    pages?: string;
    doi?: string;
    url?: string;
}

interface UseCitationsOptions {
    defaultFormat?: CitationFormat;
}

interface UseCitationsReturn {
    /** Current citation format */
    format: CitationFormat;
    /** Set citation format */
    setFormat: (format: CitationFormat) => void;
    /** Available citation formats */
    availableFormats: CitationFormat[];
    /** Generate citation from data */
    generateFormattedCitation: (data: Partial<CitationData>) => string;
    /** Generate BibTeX entry from data */
    generateBibTeX: (data: Partial<CitationData>) => string;
    /** Parse raw input text to extract citation data */
    parseInput: (input: string) => Partial<CitationData>;
    /** Generate citation from raw input */
    generateFromInput: (input: string) => string;
    /** Get format description */
    getFormatDescription: (format: CitationFormat) => string;
    /** Get format example */
    getFormatExample: (format: CitationFormat) => string;
}

// ============================================================================
// Constants
// ============================================================================

const AVAILABLE_FORMATS: CitationFormat[] = ['APA', 'IEEE', 'Chicago', 'MLA'];

const FORMAT_DESCRIPTIONS: Record<CitationFormat, string> = {
    'APA': 'American Psychological Association - Común en ciencias sociales',
    'IEEE': 'Institute of Electrical and Electronics Engineers - Ingeniería y CS',
    'Chicago': 'Chicago Manual of Style - Humanidades e historia',
    'MLA': 'Modern Language Association - Literatura y artes',
};

const FORMAT_EXAMPLES: Record<CitationFormat, string> = {
    'APA': 'Apellido, A. A. (2024). Título del artículo. Revista, 10(2), 123-145.',
    'IEEE': '[1] A. A. Apellido, "Título," Revista, vol. 10, no. 2, pp. 123-145, 2024.',
    'Chicago': 'Apellido, Nombre. "Título del artículo." Revista 10, no. 2 (2024): 123-145.',
    'MLA': 'Apellido, Nombre. "Título del artículo." Revista, vol. 10, no. 2, 2024, pp. 123-145.',
};

// ============================================================================
// Hook Implementation
// ============================================================================

export function useCitations(options: UseCitationsOptions = {}): UseCitationsReturn {
    const [format, setFormat] = useState<CitationFormat>(options.defaultFormat || 'APA');

    // Generate formatted citation from data
    const generateFormattedCitation = useCallback((data: Partial<CitationData>): string => {
        return generateCitation(data, format);
    }, [format]);

    // Generate BibTeX entry
    const generateBibTeX = useCallback((data: Partial<CitationData>): string => {
        return generateBibTeXEntry(data);
    }, []);

    // Parse raw input
    const parseInput = useCallback((input: string): Partial<CitationData> => {
        return parseCitationInput(input);
    }, []);

    // Generate citation from raw input
    const generateFromInput = useCallback((input: string): string => {
        const parsed = parseCitationInput(input);
        return generateCitation(parsed, format);
    }, [format]);

    // Get format description
    const getFormatDescription = useCallback((f: CitationFormat): string => {
        return FORMAT_DESCRIPTIONS[f];
    }, []);

    // Get format example
    const getFormatExample = useCallback((f: CitationFormat): string => {
        return FORMAT_EXAMPLES[f];
    }, []);

    return {
        format,
        setFormat,
        availableFormats: AVAILABLE_FORMATS,
        generateFormattedCitation,
        generateBibTeX,
        parseInput,
        generateFromInput,
        getFormatDescription,
        getFormatExample,
    };
}

// ============================================================================
// DOI Lookup (for future CrossRef integration)
// ============================================================================

/**
 * Fetch citation metadata from DOI using CrossRef API
 * This is a placeholder for Sprint 5 implementation
 */
export async function fetchCitationFromDOI(doi: string): Promise<CitationData | null> {
    try {
        const cleanDoi = doi.replace(/^https?:\/\/doi\.org\//, '').trim();
        const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`);

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        const work = data.message;

        // Transform CrossRef response to CitationData
        const authors = work.author
            ?.map((a: { family?: string; given?: string }) => `${a.family || ''}, ${a.given?.charAt(0) || ''}.`)
            .join(', ') || 'Unknown Author';

        return {
            authors,
            title: work.title?.[0] || 'Unknown Title',
            journal: work['container-title']?.[0],
            year: work.published?.['date-parts']?.[0]?.[0]?.toString() || 'n.d.',
            volume: work.volume,
            pages: work.page,
            doi: work.DOI,
            url: work.URL,
        };
    } catch (error) {
        console.error('Error fetching DOI:', error);
        return null;
    }
}

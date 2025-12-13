// Citation generator utilities

export type CitationFormat = 'APA' | 'IEEE' | 'Chicago' | 'MLA';

interface CitationData {
    authors: string;
    title: string;
    journal?: string;
    year: string;
    volume?: string;
    pages?: string;
    doi?: string;
    url?: string;
}

export function parseCitationInput(input: string): Partial<CitationData> {
    // Simple parser for common citation formats
    // This is a basic implementation, could be enhanced with DOI API lookup
    const data: Partial<CitationData> = {};

    // Try to extract year (4 digits)
    const yearMatch = input.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) data.year = yearMatch[0];

    // Try to extract DOI
    const doiMatch = input.match(/10\.\d{4,}\/[^\s]+/);
    if (doiMatch) data.doi = doiMatch[0];

    // Try to extract URL
    const urlMatch = input.match(/https?:\/\/[^\s]+/);
    if (urlMatch) data.url = urlMatch[0];

    return data;
}

export function generateCitation(data: Partial<CitationData>, format: CitationFormat): string {
    const authors = data.authors || 'Author, A.';
    const title = data.title || 'Title';
    const year = data.year || 'n.d.';
    const journal = data.journal || 'Journal Name';
    const volume = data.volume || 'X';
    const pages = data.pages || '1-10';
    const doi = data.doi;

    switch (format) {
        case 'APA':
            return `${authors} (${year}). ${title}. \\textit{${journal}}, \\textit{${volume}}, ${pages}.${doi ? ` \\url{https://doi.org/${doi}}` : ''}`;

        case 'IEEE':
            return `${authors}, "${title}," \\textit{${journal}}, vol. ${volume}, pp. ${pages}, ${year}.${doi ? ` doi: ${doi}` : ''}`;

        case 'Chicago':
            return `${authors}. "${title}." \\textit{${journal}} ${volume} (${year}): ${pages}.${doi ? ` https://doi.org/${doi}.` : ''}`;

        case 'MLA':
            return `${authors} "${title}." \\textit{${journal}} ${volume} (${year}): ${pages}.${doi ? ` Web.` : ''}`;

        default:
            return `${authors} (${year}). ${title}.`;
    }
}

export function generateBibTeXEntry(data: Partial<CitationData>): string {
    const key = (data.authors?.split(',')[0] || 'author') + (data.year || '2024');

    return `@article{${key},
  author = {${data.authors || 'Author, A.'}},
  title = {${data.title || 'Title'}},
  journal = {${data.journal || 'Journal Name'}},
  year = {${data.year || '2024'}},
  volume = {${data.volume || 'X'}},
  pages = {${data.pages || '1--10'}}${data.doi ? `,\n  doi = {${data.doi}}` : ''}
}`;
}

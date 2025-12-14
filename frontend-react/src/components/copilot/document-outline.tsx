/**
 * Document Outline Component
 * 
 * Displays a navigable outline of LaTeX document structure
 * (sections, subsections, chapters) with click-to-jump functionality.
 */

import { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, FileText, Hash } from 'lucide-react';

interface OutlineItem {
    type: 'chapter' | 'section' | 'subsection' | 'subsubsection';
    title: string;
    line: number;
    level: number;
}

interface DocumentOutlineProps {
    text: string;
    onNavigate: (line: number) => void;
}

/**
 * Parse LaTeX document to extract section structure
 */
function parseOutline(text: string): OutlineItem[] {
    const items: OutlineItem[] = [];
    const lines = text.split('\n');

    // Regex patterns for different section types
    const patterns = [
        { type: 'chapter' as const, regex: /\\chapter\{([^}]+)\}/, level: 0 },
        { type: 'section' as const, regex: /\\section\{([^}]+)\}/, level: 1 },
        { type: 'subsection' as const, regex: /\\subsection\{([^}]+)\}/, level: 2 },
        { type: 'subsubsection' as const, regex: /\\subsubsection\{([^}]+)\}/, level: 3 },
    ];

    lines.forEach((line, index) => {
        for (const pattern of patterns) {
            const match = line.match(pattern.regex);
            if (match) {
                items.push({
                    type: pattern.type,
                    title: match[1],
                    line: index + 1, // 1-indexed
                    level: pattern.level,
                });
                break; // Only match first pattern per line
            }
        }
    });

    return items;
}

/**
 * Get icon based on outline item type
 */
function getIcon(type: OutlineItem['type']) {
    switch (type) {
        case 'chapter':
            return <FileText className="h-4 w-4 text-primary" />;
        case 'section':
            return <Hash className="h-4 w-4 text-blue-500" />;
        case 'subsection':
            return <Hash className="h-3.5 w-3.5 text-green-500" />;
        case 'subsubsection':
            return <Hash className="h-3 w-3 text-orange-500" />;
    }
}

export function DocumentOutline({ text, onNavigate }: DocumentOutlineProps) {
    const [outline, setOutline] = useState<OutlineItem[]>([]);
    const [isExpanded, setIsExpanded] = useState(true);

    useEffect(() => {
        const items = parseOutline(text);
        setOutline(items);
    }, [text]);

    if (outline.length === 0) {
        return (
            <div className="p-3 text-center text-sm text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Sin estructura</p>
                <p className="text-xs">Agrega \section{"{...}"} para ver el outline</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div
                className="flex items-center justify-between px-3 py-2 border-b cursor-pointer hover:bg-muted/50"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span className="text-sm font-medium flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    Estructura ({outline.length})
                </span>
            </div>

            {isExpanded && (
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-0.5">
                        {outline.map((item, index) => (
                            <Button
                                key={`${item.line}-${index}`}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-left h-auto py-1.5 px-2 font-normal"
                                style={{ paddingLeft: `${(item.level * 12) + 8}px` }}
                                onClick={() => onNavigate(item.line)}
                            >
                                <span className="mr-2 flex-shrink-0">{getIcon(item.type)}</span>
                                <span className="truncate flex-1 text-xs">{item.title}</span>
                                <span className="text-[10px] text-muted-foreground ml-1">L{item.line}</span>
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
            )}
        </div>
    );
}

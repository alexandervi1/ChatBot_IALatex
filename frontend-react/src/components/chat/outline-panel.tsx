/**
 * Outline Sidebar Panel
 * 
 * Shows document structure (sections, subsections) in a sidebar panel
 * similar to DocumentList. Only visible in copilot mode.
 */

import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { FileText, Hash } from 'lucide-react';

interface OutlineItem {
    type: 'chapter' | 'section' | 'subsection' | 'subsubsection';
    title: string;
    line: number;
    level: number;
}

interface OutlinePanelProps {
    text: string;
    onNavigate: (line: number) => void;
}

/**
 * Parse LaTeX document to extract section structure
 */
function parseOutline(text: string): OutlineItem[] {
    const items: OutlineItem[] = [];
    const lines = text.split('\n');

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
                    line: index + 1,
                    level: pattern.level,
                });
                break;
            }
        }
    });

    return items;
}

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

export function OutlinePanel({ text, onNavigate }: OutlinePanelProps) {
    const outline = parseOutline(text);

    return (
        <aside className="hidden md:flex md:w-[180px] lg:w-[200px] flex-col gap-2 overflow-hidden border-r bg-muted/40">
            <div className="p-2 border-b">
                <h2 className="text-sm lg:text-base font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Estructura
                </h2>
                <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">
                    {outline.length} secciones
                </p>
            </div>

            <ScrollArea className="flex-1 px-2">
                {outline.length > 0 ? (
                    <div className="space-y-1 pb-4">
                        {outline.map((item, index) => (
                            <Button
                                key={`${item.line}-${index}`}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-left h-auto py-2 px-2 font-normal"
                                style={{ paddingLeft: `${(item.level * 12) + 8}px` }}
                                onClick={() => onNavigate(item.line)}
                            >
                                <span className="mr-2 flex-shrink-0">{getIcon(item.type)}</span>
                                <span className="truncate flex-1 text-sm">{item.title}</span>
                                <span className="text-xs text-muted-foreground ml-1">L{item.line}</span>
                            </Button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Sin estructura</p>
                        <p className="text-xs mt-1">
                            Agrega \section{"{...}"} para ver el outline
                        </p>
                    </div>
                )}
            </ScrollArea>
        </aside>
    );
}

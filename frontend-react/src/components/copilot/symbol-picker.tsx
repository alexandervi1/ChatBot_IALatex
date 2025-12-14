/**
 * Symbol Picker Component
 * 
 * Grid of common LaTeX mathematical symbols that can be
 * inserted into the editor with a single click.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { latexSymbols } from '@/lib/latex-completions';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SymbolPickerProps {
    onInsert: (latex: string) => void;
}

export function SymbolPicker({ onInsert }: SymbolPickerProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    const categories = [
        { key: 'greek', label: 'αβγ', title: 'Griegas' },
        { key: 'operators', label: '∑∫', title: 'Operadores' },
        { key: 'relations', label: '≤≥', title: 'Relaciones' },
        { key: 'arrows', label: '→⇒', title: 'Flechas' },
        { key: 'sets', label: '∈∪', title: 'Conjuntos' },
    ];

    return (
        <div className="flex flex-col h-full border-t">
            <div
                className="flex items-center justify-between px-3 py-2 border-b cursor-pointer hover:bg-muted/50"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span className="text-sm font-medium flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    Símbolos
                </span>
            </div>

            {isExpanded && (
                <Tabs defaultValue="greek" className="flex-1 flex flex-col">
                    <TabsList className="grid grid-cols-5 h-8 mx-2 mt-2">
                        {categories.map(cat => (
                            <TabsTrigger
                                key={cat.key}
                                value={cat.key}
                                className="text-xs px-1"
                                title={cat.title}
                            >
                                {cat.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {categories.map(cat => (
                        <TabsContent key={cat.key} value={cat.key} className="flex-1 m-0">
                            <ScrollArea className="h-[120px]">
                                <div className="grid grid-cols-5 gap-1 p-2">
                                    {latexSymbols[cat.key as keyof typeof latexSymbols].map((item, index) => (
                                        <Button
                                            key={index}
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-lg font-normal hover:bg-primary/10"
                                            title={`${item.name}: ${item.latex}`}
                                            onClick={() => onInsert(item.latex)}
                                        >
                                            {item.symbol}
                                        </Button>
                                    ))}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    ))}
                </Tabs>
            )}
        </div>
    );
}

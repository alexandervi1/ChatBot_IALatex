/**
 * Symbols Sidebar Panel
 * 
 * Shows LaTeX mathematical symbols in a sidebar panel
 * similar to DocumentList. Only visible in copilot mode.
 */

import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator } from 'lucide-react';
import { latexSymbols } from '@/lib/latex-completions';

interface SymbolsPanelProps {
    onInsert: (latex: string) => void;
}

const categories = [
    { key: 'greek', label: 'αβγ', title: 'Letras Griegas' },
    { key: 'operators', label: '∑∫', title: 'Operadores' },
    { key: 'relations', label: '≤≥', title: 'Relaciones' },
    { key: 'arrows', label: '→⇒', title: 'Flechas' },
    { key: 'sets', label: '∈∪', title: 'Conjuntos' },
];

export function SymbolsPanel({ onInsert }: SymbolsPanelProps) {
    return (
        <aside className="hidden md:flex md:w-[180px] lg:w-[200px] flex-col gap-2 overflow-hidden border-r bg-muted/40">
            <div className="p-2 border-b">
                <h2 className="text-sm lg:text-base font-semibold flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Símbolos
                </h2>
                <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">
                    Clic para insertar
                </p>
            </div>

            <Tabs defaultValue="greek" className="flex-1 flex flex-col px-1.5">
                <TabsList className="grid grid-cols-5 h-7">
                    {categories.map(cat => (
                        <TabsTrigger
                            key={cat.key}
                            value={cat.key}
                            className="text-sm px-1"
                            title={cat.title}
                        >
                            {cat.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {categories.map(cat => (
                    <TabsContent key={cat.key} value={cat.key} className="flex-1 mt-2">
                        <ScrollArea className="h-full">
                            <div className="grid grid-cols-4 gap-1.5 pb-4">
                                {latexSymbols[cat.key as keyof typeof latexSymbols].map((item, index) => (
                                    <Button
                                        key={index}
                                        variant="outline"
                                        size="sm"
                                        className="h-10 w-full p-0 text-xl font-normal hover:bg-primary/10 hover:border-primary"
                                        title={`${item.name}: ${item.latex}`}
                                        onClick={() => onInsert(item.latex)}
                                    >
                                        {item.symbol}
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                        <div className="border-t pt-2 mt-2">
                            <p className="text-xs text-muted-foreground text-center">
                                {cat.title}
                            </p>
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </aside>
    );
}

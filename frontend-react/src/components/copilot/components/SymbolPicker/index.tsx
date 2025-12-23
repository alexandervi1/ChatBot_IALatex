/**
 * Enhanced Symbol Picker Component
 * 
 * 200+ LaTeX symbols organized by category with search.
 */

'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Sigma, X } from 'lucide-react';
import {
    symbolCategories,
    searchSymbols,
    TOTAL_SYMBOL_COUNT,
    type LatexSymbol,
} from '@/lib/latex-symbols';

// ============================================================================
// Types
// ============================================================================

interface SymbolPickerProps {
    onInsert: (latex: string) => void;
    trigger?: React.ReactNode;
}

interface SymbolGridProps {
    symbols: LatexSymbol[];
    onSelect: (symbol: LatexSymbol) => void;
}

// ============================================================================
// Symbol Grid
// ============================================================================

const SymbolGrid = memo(function SymbolGrid({
    symbols,
    onSelect,
}: SymbolGridProps) {
    if (symbols.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground text-sm">
                No se encontraron símbolos
            </div>
        );
    }

    return (
        <div className="grid grid-cols-6 gap-1">
            {symbols.map((symbol, index) => (
                <button
                    key={`${symbol.latex}-${index}`}
                    onClick={() => onSelect(symbol)}
                    className="h-10 w-10 flex items-center justify-center rounded hover:bg-muted transition-colors text-lg font-serif"
                    title={`${symbol.name}\n${symbol.latex}`}
                >
                    {symbol.symbol}
                </button>
            ))}
        </div>
    );
});

// ============================================================================
// Recent Symbols
// ============================================================================

const RECENT_KEY = 'latex-copilot-recent-symbols';
const MAX_RECENT = 12;

function useRecentSymbols() {
    const [recent, setRecent] = useState<LatexSymbol[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const stored = localStorage.getItem(RECENT_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    const addRecent = useCallback((symbol: LatexSymbol) => {
        setRecent(prev => {
            // Remove if already exists
            const filtered = prev.filter(s => s.latex !== symbol.latex);
            // Add to front
            const updated = [symbol, ...filtered].slice(0, MAX_RECENT);
            // Persist
            try {
                localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
            } catch { }
            return updated;
        });
    }, []);

    return { recent, addRecent };
}

// ============================================================================
// Main Component
// ============================================================================

export const SymbolPicker = memo(function SymbolPicker({
    onInsert,
    trigger,
}: SymbolPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('greek');
    const { recent, addRecent } = useRecentSymbols();

    // Search results
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return null;
        return searchSymbols(searchQuery);
    }, [searchQuery]);

    // Handle symbol selection
    const handleSelect = useCallback((symbol: LatexSymbol) => {
        onInsert(symbol.latex);
        addRecent(symbol);
        setIsOpen(false);
        setSearchQuery('');
    }, [onInsert, addRecent]);

    // Clear search
    const clearSearch = useCallback(() => {
        setSearchQuery('');
    }, []);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2">
                        <Sigma className="h-4 w-4" />
                        <span className="hidden sm:inline">Símbolos</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md p-0">
                <DialogHeader className="p-3 border-b">
                    <DialogTitle className="flex items-center justify-between">
                        <span className="font-medium text-sm">Símbolos LaTeX</span>
                        <span className="text-xs text-muted-foreground font-normal">
                            {TOTAL_SYMBOL_COUNT} símbolos
                        </span>
                    </DialogTitle>

                    {/* Search */}
                    <div className="relative mt-2">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar símbolo..."
                            className="pl-8 pr-8 h-9"
                        />
                        {searchQuery && (
                            <button
                                onClick={clearSearch}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </DialogHeader>

                {/* Content */}
                <ScrollArea className="h-72">
                    <div className="p-3">
                        {searchResults ? (
                            // Search results
                            <>
                                <h5 className="text-xs font-medium text-muted-foreground mb-2">
                                    Resultados ({searchResults.length})
                                </h5>
                                <SymbolGrid symbols={searchResults} onSelect={handleSelect} />
                            </>
                        ) : (
                            // Categories
                            <>
                                {/* Recent */}
                                {recent.length > 0 && (
                                    <div className="mb-4">
                                        <h5 className="text-xs font-medium text-muted-foreground mb-2">
                                            Recientes
                                        </h5>
                                        <SymbolGrid symbols={recent} onSelect={handleSelect} />
                                    </div>
                                )}

                                {/* Category tabs */}
                                <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                                    <TabsList className="w-full flex-wrap h-auto gap-1 bg-transparent p-0 mb-3">
                                        {symbolCategories.map((cat) => (
                                            <TabsTrigger
                                                key={cat.id}
                                                value={cat.id}
                                                className="px-2 py-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                            >
                                                <span className="mr-1">{cat.icon}</span>
                                                {cat.name}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>

                                    {symbolCategories.map((cat) => (
                                        <TabsContent key={cat.id} value={cat.id} className="m-0">
                                            <SymbolGrid symbols={cat.symbols} onSelect={handleSelect} />
                                        </TabsContent>
                                    ))}
                                </Tabs>
                            </>
                        )}
                    </div>
                </ScrollArea>

                {/* Footer with quick tips */}
                <div className="p-2 border-t bg-muted/30">
                    <p className="text-[10px] text-muted-foreground text-center">
                        Clic para insertar • Busca por nombre o comando LaTeX
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
});

// ============================================================================
// Quick Symbol Bar (for toolbar)
// ============================================================================

interface QuickSymbolBarProps {
    onInsert: (latex: string) => void;
}

const QUICK_SYMBOLS: LatexSymbol[] = [
    { symbol: 'α', latex: '\\alpha', name: 'alpha' },
    { symbol: 'β', latex: '\\beta', name: 'beta' },
    { symbol: '∑', latex: '\\sum', name: 'sum' },
    { symbol: '∫', latex: '\\int', name: 'integral' },
    { symbol: '√', latex: '\\sqrt{}', name: 'sqrt' },
    { symbol: '∞', latex: '\\infty', name: 'infinity' },
    { symbol: '≤', latex: '\\leq', name: 'leq' },
    { symbol: '≥', latex: '\\geq', name: 'geq' },
];

export const QuickSymbolBar = memo(function QuickSymbolBar({
    onInsert,
}: QuickSymbolBarProps) {
    return (
        <div className="flex items-center gap-0.5">
            {QUICK_SYMBOLS.map((symbol) => (
                <button
                    key={symbol.latex}
                    onClick={() => onInsert(symbol.latex)}
                    className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors text-sm font-serif"
                    title={`${symbol.name}: ${symbol.latex}`}
                >
                    {symbol.symbol}
                </button>
            ))}
        </div>
    );
});

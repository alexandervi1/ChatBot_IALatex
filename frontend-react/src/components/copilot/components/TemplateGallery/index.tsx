/**
 * Template Gallery Component
 * 
 * Browse and select from 50+ LaTeX templates organized by category.
 */

'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Search, FileText, X, Check, Eye, Copy } from 'lucide-react';
import {
    templates,
    templateCategories,
    searchTemplates,
    getTemplatesByCategory,
    TOTAL_TEMPLATE_COUNT,
    type FullTemplate,
    type TemplateCategory,
} from '@/lib/template-gallery';

// ============================================================================
// Types
// ============================================================================

interface TemplateGalleryProps {
    onSelect: (content: string) => void;
    trigger?: React.ReactNode;
}

interface TemplateCardProps {
    template: FullTemplate;
    onSelect: () => void;
    onPreview: () => void;
}

// ============================================================================
// Template Card
// ============================================================================

const TemplateCard = memo(function TemplateCard({
    template,
    onSelect,
    onPreview,
}: TemplateCardProps) {
    const difficultyColors = {
        basic: 'bg-green-500/20 text-green-600',
        intermediate: 'bg-yellow-500/20 text-yellow-600',
        advanced: 'bg-red-500/20 text-red-600',
    };

    return (
        <div className="group border rounded-lg p-4 hover:border-primary transition-colors">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
                <div>
                    <h4 className="font-medium text-sm">{template.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                        {template.description}
                    </p>
                </div>
                <span className="text-2xl">
                    {templateCategories[template.category]?.icon}
                </span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-3">
                <Badge variant="outline" className={difficultyColors[template.difficulty]}>
                    {template.difficulty === 'basic' ? 'Básico' :
                        template.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                </Badge>
                {template.tags.slice(0, 2).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-[10px]">
                        {tag}
                    </Badge>
                ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={onPreview}
                >
                    <Eye className="h-3 w-3 mr-1" />
                    Vista previa
                </Button>
                <Button
                    size="sm"
                    className="flex-1"
                    onClick={onSelect}
                >
                    <Check className="h-3 w-3 mr-1" />
                    Usar
                </Button>
            </div>
        </div>
    );
});

// ============================================================================
// Template Preview
// ============================================================================

interface TemplatePreviewProps {
    template: FullTemplate | null;
    onClose: () => void;
    onSelect: () => void;
}

const TemplatePreview = memo(function TemplatePreview({
    template,
    onClose,
    onSelect,
}: TemplatePreviewProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
        if (!template) return;
        await navigator.clipboard.writeText(template.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [template]);

    if (!template) return null;

    return (
        <Dialog open={!!template} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">
                            {templateCategories[template.category]?.icon}
                        </span>
                        <div>
                            <DialogTitle>{template.name}</DialogTitle>
                            <DialogDescription>{template.description}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Metadata */}
                <div className="flex flex-wrap gap-2 py-2 border-b">
                    <Badge variant="outline">
                        {templateCategories[template.category]?.name}
                    </Badge>
                    {template.packages.map(pkg => (
                        <Badge key={pkg} variant="secondary">
                            {pkg}
                        </Badge>
                    ))}
                </div>

                {/* Code preview */}
                <ScrollArea className="flex-1 border rounded-lg bg-muted/30">
                    <pre className="p-4 text-xs font-mono whitespace-pre-wrap">
                        {template.content}
                    </pre>
                </ScrollArea>

                <DialogFooter>
                    <Button variant="outline" onClick={handleCopy}>
                        {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                        {copied ? 'Copiado' : 'Copiar'}
                    </Button>
                    <Button onClick={onSelect}>
                        <Check className="h-4 w-4 mr-1" />
                        Usar esta plantilla
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
});

// ============================================================================
// Main Component
// ============================================================================

export const TemplateGallery = memo(function TemplateGallery({
    onSelect,
    trigger,
}: TemplateGalleryProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all');
    const [previewTemplate, setPreviewTemplate] = useState<FullTemplate | null>(null);

    // Get filtered templates
    const filteredTemplates = useMemo(() => {
        if (searchQuery.trim()) {
            return searchTemplates(searchQuery);
        }
        if (activeCategory === 'all') {
            return templates;
        }
        return getTemplatesByCategory(activeCategory);
    }, [searchQuery, activeCategory]);

    // Handle template selection
    const handleSelect = useCallback((template: FullTemplate) => {
        onSelect(template.content);
        setIsOpen(false);
        setPreviewTemplate(null);
        setSearchQuery('');
    }, [onSelect]);

    // Category list
    const categories: (TemplateCategory | 'all')[] = [
        'all',
        ...Object.keys(templateCategories) as TemplateCategory[],
    ];

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    {trigger || (
                        <Button variant="outline" size="sm" className="gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="hidden sm:inline">Plantillas</span>
                        </Button>
                    )}
                </DialogTrigger>
                <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0">
                    {/* Header */}
                    <div className="p-4 border-b">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <DialogTitle>Galería de Plantillas</DialogTitle>
                                <DialogDescription>
                                    {TOTAL_TEMPLATE_COUNT} plantillas profesionales para comenzar
                                </DialogDescription>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar plantillas..."
                                className="pl-9 pr-9"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                >
                                    <X className="h-4 w-4 text-muted-foreground" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* Category sidebar */}
                        <div className="w-48 border-r p-2 overflow-y-auto">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => {
                                        setActiveCategory(cat);
                                        setSearchQuery('');
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeCategory === cat
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-muted'
                                        }`}
                                >
                                    {cat === 'all' ? (
                                        <span>📋 Todas</span>
                                    ) : (
                                        <span>
                                            {templateCategories[cat].icon} {templateCategories[cat].name}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Template grid */}
                        <ScrollArea className="flex-1">
                            <div className="p-4 grid grid-cols-2 gap-4">
                                {filteredTemplates.length === 0 ? (
                                    <div className="col-span-2 text-center py-12 text-muted-foreground">
                                        No se encontraron plantillas
                                    </div>
                                ) : (
                                    filteredTemplates.map((template) => (
                                        <TemplateCard
                                            key={template.id}
                                            template={template}
                                            onSelect={() => handleSelect(template)}
                                            onPreview={() => setPreviewTemplate(template)}
                                        />
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Preview modal */}
            <TemplatePreview
                template={previewTemplate}
                onClose={() => setPreviewTemplate(null)}
                onSelect={() => previewTemplate && handleSelect(previewTemplate)}
            />
        </>
    );
});

/**
 * EditorToolbar Component
 * 
 * Toolbar with template selection, compile button, and action buttons.
 * Extracted from copilot-editor.tsx for better modularity.
 */

'use client';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    FileText,
    Download,
    Play,
    Quote,
    Save,
    Trash2,
    ChevronDown,
    Loader2,
} from 'lucide-react';

import type { LaTeXTemplate } from '@/lib/latex-templates';
import type { EditorToolbarProps } from '../../CopilotEditor.types';

// ============================================================================
// Sub-components
// ============================================================================

interface TemplateDropdownProps {
    templates: LaTeXTemplate[];
    customTemplates: LaTeXTemplate[];
    onSelect: (template: LaTeXTemplate) => void;
    onDelete: (index: number) => void;
}

function TemplateDropdown({
    templates,
    customTemplates,
    onSelect,
    onDelete,
}: TemplateDropdownProps) {
    // Group templates by category
    const categorizedTemplates = templates.reduce<Record<string, LaTeXTemplate[]>>(
        (acc, template) => {
            const category = template.category || 'Other';
            if (!acc[category]) acc[category] = [];
            acc[category].push(template);
            return acc;
        },
        {}
    );

    const categoryOrder = ['Academic', 'Professional', 'Reports & Books', 'Presentations'];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                    <FileText className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Plantillas</span>
                    <ChevronDown className="h-3 w-3" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 max-h-80 overflow-y-auto">
                {categoryOrder.map(category => {
                    const categoryTemplates = categorizedTemplates[category];
                    if (!categoryTemplates?.length) return null;

                    return (
                        <DropdownMenuGroup key={category}>
                            <DropdownMenuLabel className="text-xs text-muted-foreground">
                                {category}
                            </DropdownMenuLabel>
                            {categoryTemplates.map(template => (
                                <DropdownMenuItem
                                    key={template.name}
                                    onClick={() => onSelect(template)}
                                    className="cursor-pointer"
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    <div className="flex flex-col">
                                        <span className="text-sm">{template.name}</span>
                                        {template.description && (
                                            <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                                                {template.description}
                                            </span>
                                        )}
                                    </div>
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                        </DropdownMenuGroup>
                    );
                })}

                {customTemplates.length > 0 && (
                    <DropdownMenuGroup>
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Mis Plantillas
                        </DropdownMenuLabel>
                        {customTemplates.map((template, index) => (
                            <DropdownMenuItem
                                key={`custom-${index}`}
                                className="cursor-pointer group"
                            >
                                <div
                                    className="flex-1 flex items-center"
                                    onClick={() => onSelect(template)}
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    <span className="text-sm">{template.name}</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(index);
                                    }}
                                >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuGroup>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export function EditorToolbar({
    onCompile,
    onSaveTemplate,
    onOpenCitations,
    isLoading,
    templates,
    customTemplates,
    onTemplateSelect,
    onTemplateDelete,
}: EditorToolbarProps) {
    return (
        <div className="flex items-center gap-1 flex-wrap py-1 px-2 border-b bg-muted/30">
            {/* Template Selector */}
            <TemplateDropdown
                templates={templates}
                customTemplates={customTemplates}
                onSelect={onTemplateSelect}
                onDelete={onTemplateDelete}
            />

            {/* Compile Button */}
            <Button
                variant="default"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={onCompile}
                disabled={isLoading}
            >
                {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                    <Play className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">Compilar</span>
            </Button>

            {/* Save Template */}
            <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={onSaveTemplate}
            >
                <Save className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Guardar</span>
            </Button>

            {/* Citation Generator */}
            <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={onOpenCitations}
            >
                <Quote className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Citas</span>
            </Button>

            {/* Download - shown on larger screens */}
            <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs hidden md:flex"
                onClick={() => {/* Will be connected to download handler */ }}
            >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Descargar</span>
            </Button>
        </div>
    );
}

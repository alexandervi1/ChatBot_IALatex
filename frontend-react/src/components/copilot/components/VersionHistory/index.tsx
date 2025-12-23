/**
 * VersionHistory Component
 * 
 * Displays document version history with diff viewer.
 */

'use client';

import { useState, memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    History,
    Clock,
    Tag,
    RotateCcw,
    GitCompare,
    ChevronRight,
    Loader2,
    Check,
    X,
    Plus,
    Minus,
} from 'lucide-react';
import type { VersionInfo, CompareResult, DiffLine } from '../../hooks/useVersionHistory';

// ============================================================================
// Types
// ============================================================================

interface VersionHistoryProps {
    versions: VersionInfo[];
    isLoading: boolean;
    onSelectVersion: (version: number) => void;
    onCompare: (from: number, to: number) => void;
    onRestore: (version: number) => Promise<void>;
    onUpdateLabel: (versionId: number, label: string) => Promise<void>;
}

interface DiffViewerProps {
    comparison: CompareResult;
    onClose: () => void;
}

// ============================================================================
// Version History Panel
// ============================================================================

export const VersionHistory = memo(function VersionHistory({
    versions,
    isLoading,
    onSelectVersion,
    onCompare,
    onRestore,
    onUpdateLabel,
}: VersionHistoryProps) {
    const [compareMode, setCompareMode] = useState(false);
    const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);
    const [editingLabel, setEditingLabel] = useState<number | null>(null);
    const [labelValue, setLabelValue] = useState('');

    const handleVersionClick = useCallback((version: VersionInfo) => {
        if (compareMode) {
            setSelectedForCompare(prev => {
                if (prev.includes(version.version_number)) {
                    return prev.filter(v => v !== version.version_number);
                }
                if (prev.length < 2) {
                    return [...prev, version.version_number];
                }
                return [prev[1], version.version_number];
            });
        } else {
            onSelectVersion(version.version_number);
        }
    }, [compareMode, onSelectVersion]);

    const handleCompare = useCallback(() => {
        if (selectedForCompare.length === 2) {
            const [from, to] = selectedForCompare.sort((a, b) => a - b);
            onCompare(from, to);
            setCompareMode(false);
            setSelectedForCompare([]);
        }
    }, [selectedForCompare, onCompare]);

    const handleStartLabelEdit = useCallback((version: VersionInfo) => {
        setEditingLabel(version.id);
        setLabelValue(version.label || '');
    }, []);

    const handleSaveLabel = useCallback(async (versionId: number) => {
        await onUpdateLabel(versionId, labelValue);
        setEditingLabel(null);
        setLabelValue('');
    }, [labelValue, onUpdateLabel]);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <History className="h-4 w-4" />
                    <span className="hidden sm:inline">Historial</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Historial de Versiones
                    </DialogTitle>
                </DialogHeader>

                {/* Actions */}
                <div className="flex gap-2 mb-4">
                    <Button
                        variant={compareMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                            setCompareMode(!compareMode);
                            setSelectedForCompare([]);
                        }}
                    >
                        <GitCompare className="h-4 w-4 mr-1" />
                        Comparar
                    </Button>
                    {compareMode && selectedForCompare.length === 2 && (
                        <Button size="sm" onClick={handleCompare}>
                            Ver Diferencias
                        </Button>
                    )}
                </div>

                {compareMode && (
                    <p className="text-xs text-muted-foreground mb-3">
                        Selecciona 2 versiones para comparar ({selectedForCompare.length}/2)
                    </p>
                )}

                {/* Version List */}
                <ScrollArea className="flex-1 max-h-[60vh]">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : versions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No hay versiones guardadas
                        </div>
                    ) : (
                        <div className="space-y-2 pr-4">
                            {versions.map((version) => (
                                <VersionItem
                                    key={version.id}
                                    version={version}
                                    isSelected={selectedForCompare.includes(version.version_number)}
                                    compareMode={compareMode}
                                    isEditingLabel={editingLabel === version.id}
                                    labelValue={labelValue}
                                    onLabelChange={setLabelValue}
                                    onClick={() => handleVersionClick(version)}
                                    onRestore={() => onRestore(version.version_number)}
                                    onStartLabelEdit={() => handleStartLabelEdit(version)}
                                    onSaveLabel={() => handleSaveLabel(version.id)}
                                    onCancelLabelEdit={() => setEditingLabel(null)}
                                />
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
});

// ============================================================================
// Version Item
// ============================================================================

interface VersionItemProps {
    version: VersionInfo;
    isSelected: boolean;
    compareMode: boolean;
    isEditingLabel: boolean;
    labelValue: string;
    onLabelChange: (value: string) => void;
    onClick: () => void;
    onRestore: () => void;
    onStartLabelEdit: () => void;
    onSaveLabel: () => void;
    onCancelLabelEdit: () => void;
}

const VersionItem = memo(function VersionItem({
    version,
    isSelected,
    compareMode,
    isEditingLabel,
    labelValue,
    onLabelChange,
    onClick,
    onRestore,
    onStartLabelEdit,
    onSaveLabel,
    onCancelLabelEdit,
}: VersionItemProps) {
    const formattedDate = formatDate(version.created_at);

    return (
        <div
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${isSelected
                ? 'border-primary bg-primary/10'
                : 'border-border hover:bg-muted/50'
                }`}
            onClick={onClick}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    {/* Version number and label */}
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                            v{version.version_number}
                        </span>
                        {isEditingLabel ? (
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                <Input
                                    value={labelValue}
                                    onChange={(e) => onLabelChange(e.target.value)}
                                    className="h-6 w-32 text-xs"
                                    placeholder="Etiqueta..."
                                />
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onSaveLabel}>
                                    <Check className="h-3 w-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onCancelLabelEdit}>
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ) : version.label ? (
                            <span
                                className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded cursor-pointer hover:bg-primary/30"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onStartLabelEdit();
                                }}
                            >
                                {version.label}
                            </span>
                        ) : (
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-5 w-5"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onStartLabelEdit();
                                }}
                            >
                                <Tag className="h-3 w-3" />
                            </Button>
                        )}
                    </div>

                    {/* Date and summary */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        <span>{formattedDate}</span>
                    </div>
                    {version.change_summary && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                            {version.change_summary}
                        </p>
                    )}
                </div>

                {/* Actions */}
                {!compareMode && (
                    <div className="flex items-center gap-1">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRestore();
                            }}
                            title="Restaurar esta versión"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                )}
            </div>
        </div>
    );
});

// ============================================================================
// Diff Viewer
// ============================================================================

export const DiffViewer = memo(function DiffViewer({
    comparison,
    onClose,
}: DiffViewerProps) {
    const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-background border rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-4">
                        <h3 className="font-semibold">Comparación de Versiones</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>v{comparison.from_version.number}</span>
                            <ChevronRight className="h-4 w-4" />
                            <span>v{comparison.to_version.number}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant={viewMode === 'unified' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('unified')}
                        >
                            Unificado
                        </Button>
                        <Button
                            variant={viewMode === 'split' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('split')}
                        >
                            Lado a Lado
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 px-4 py-2 border-b bg-muted/30 text-sm">
                    <span className="text-green-600 flex items-center gap-1">
                        <Plus className="h-3 w-3" />
                        {comparison.stats.additions} añadidas
                    </span>
                    <span className="text-red-600 flex items-center gap-1">
                        <Minus className="h-3 w-3" />
                        {comparison.stats.deletions} eliminadas
                    </span>
                    <span className="text-yellow-600">
                        {comparison.stats.modifications} modificadas
                    </span>
                </div>

                {/* Diff Content */}
                <ScrollArea className="flex-1 p-4">
                    {viewMode === 'unified' ? (
                        <UnifiedDiff diff={comparison.unified_diff} />
                    ) : (
                        <SplitDiff lines={comparison.side_by_side} />
                    )}
                </ScrollArea>
            </div>
        </div>
    );
});

// ============================================================================
// Unified Diff View
// ============================================================================

const UnifiedDiff = memo(function UnifiedDiff({ diff }: { diff: string }) {
    const lines = diff.split('\n');

    return (
        <pre className="font-mono text-xs leading-relaxed">
            {lines.map((line, index) => {
                let className = '';
                if (line.startsWith('+') && !line.startsWith('+++')) {
                    className = 'bg-green-500/20 text-green-600';
                } else if (line.startsWith('-') && !line.startsWith('---')) {
                    className = 'bg-red-500/20 text-red-600';
                } else if (line.startsWith('@@')) {
                    className = 'bg-blue-500/20 text-blue-600';
                }

                return (
                    <div key={index} className={`px-2 ${className}`}>
                        {line || ' '}
                    </div>
                );
            })}
        </pre>
    );
});

// ============================================================================
// Split Diff View
// ============================================================================

const SplitDiff = memo(function SplitDiff({ lines }: { lines: DiffLine[] }) {
    return (
        <div className="grid grid-cols-2 gap-0 font-mono text-xs">
            {/* Old content */}
            <div className="border-r">
                <div className="bg-muted px-2 py-1 border-b font-medium">Anterior</div>
                {lines.map((line, index) => (
                    <div
                        key={`old-${index}`}
                        className={`px-2 py-0.5 flex ${line.type === 'delete' || line.type === 'replace'
                            ? 'bg-red-500/20'
                            : ''
                            }`}
                    >
                        <span className="w-8 text-muted-foreground">{line.old_number || ''}</span>
                        <span className="flex-1">{line.old_line ?? ''}</span>
                    </div>
                ))}
            </div>

            {/* New content */}
            <div>
                <div className="bg-muted px-2 py-1 border-b font-medium">Actual</div>
                {lines.map((line, index) => (
                    <div
                        key={`new-${index}`}
                        className={`px-2 py-0.5 flex ${line.type === 'insert' || line.type === 'replace'
                            ? 'bg-green-500/20'
                            : ''
                            }`}
                    >
                        <span className="w-8 text-muted-foreground">{line.new_number || ''}</span>
                        <span className="flex-1">{line.new_line ?? ''}</span>
                    </div>
                ))}
            </div>
        </div>
    );
});

// ============================================================================
// Utilities
// ============================================================================

function formatDate(dateString: string): string {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        // Less than 1 hour
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `hace ${minutes} min`;
        }

        // Less than 24 hours
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `hace ${hours}h`;
        }

        // Same year
        if (date.getFullYear() === now.getFullYear()) {
            return date.toLocaleDateString('es', { month: 'short', day: 'numeric' });
        }

        return date.toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return dateString;
    }
}

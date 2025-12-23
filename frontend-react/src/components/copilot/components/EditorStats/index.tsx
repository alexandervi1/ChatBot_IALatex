/**
 * EditorStats Component
 * 
 * Displays document statistics: word count, character count, line count.
 * Extracted from copilot-editor.tsx for better modularity.
 */

'use client';

import { memo } from 'react';
import { FileText, Type, Hash } from 'lucide-react';
import type { EditorStatsProps } from '../../CopilotEditor.types';

// ============================================================================
// Stat Item Component
// ============================================================================

interface StatItemProps {
    icon: React.ReactNode;
    label: string;
    value: number;
}

const StatItem = memo(function StatItem({ icon, label, value }: StatItemProps) {
    return (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {icon}
            <span className="hidden sm:inline">{label}:</span>
            <span className="font-medium text-foreground">{value.toLocaleString()}</span>
        </div>
    );
});

// ============================================================================
// Main Component
// ============================================================================

export const EditorStats = memo(function EditorStats({
    wordCount,
    charCount,
    lineCount,
}: EditorStatsProps) {
    return (
        <div className="flex items-center gap-4 px-3 py-1.5 border-t bg-muted/20 text-xs">
            <StatItem
                icon={<FileText className="h-3.5 w-3.5" />}
                label="Palabras"
                value={wordCount}
            />
            <StatItem
                icon={<Type className="h-3.5 w-3.5" />}
                label="Caracteres"
                value={charCount}
            />
            <StatItem
                icon={<Hash className="h-3.5 w-3.5" />}
                label="Líneas"
                value={lineCount}
            />
        </div>
    );
});

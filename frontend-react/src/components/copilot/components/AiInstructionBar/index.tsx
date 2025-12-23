/**
 * AiInstructionBar Component
 * 
 * Input bar for AI instructions with submit button.
 * Extracted from copilot-editor.tsx for better modularity.
 */

'use client';

import { memo, useCallback, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import type { AiInstructionBarProps } from '../../CopilotEditor.types';

// ============================================================================
// Main Component
// ============================================================================

export const AiInstructionBar = memo(function AiInstructionBar({
    instruction,
    setInstruction,
    onSubmit,
    isLoading,
}: AiInstructionBarProps) {
    // Handle Enter key submission
    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && instruction.trim()) {
            e.preventDefault();
            onSubmit();
        }
    }, [instruction, onSubmit]);

    return (
        <div className="flex items-center gap-2 p-2 border-t bg-gradient-to-r from-primary/5 to-secondary/5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="hidden sm:inline font-medium">Copilot IA</span>
            </div>

            <div className="flex-1 relative">
                <Input
                    placeholder="Escribe una instrucción para la IA... (ej: 'Mejora la redacción', 'Añade una tabla')"
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    className="h-8 text-sm pr-10 bg-background/80"
                />
            </div>

            <Button
                size="sm"
                className="h-8 gap-1"
                onClick={onSubmit}
                disabled={isLoading || !instruction.trim()}
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Send className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Enviar</span>
            </Button>
        </div>
    );
});

/**
 * CollaboratorCursors Component
 * 
 * Renders collaborator cursors and selections in the editor.
 */

'use client';

import { useEffect, useRef, memo } from 'react';
import type { Collaborator } from '../../hooks/useCollaboration';

// ============================================================================
// Types
// ============================================================================

interface CollaboratorCursorsProps {
    collaborators: Collaborator[];
    editorRef: React.RefObject<any>;
    monacoRef: React.RefObject<typeof import('monaco-editor') | null>;
}

// ============================================================================
// Component
// ============================================================================

export const CollaboratorCursors = memo(function CollaboratorCursors({
    collaborators,
    editorRef,
    monacoRef,
}: CollaboratorCursorsProps) {
    const decorationIdsRef = useRef<string[]>([]);

    useEffect(() => {
        const editor = editorRef.current;
        const monaco = monacoRef.current;

        if (!editor || !monaco) return;

        // Clear previous decorations
        if (decorationIdsRef.current.length > 0) {
            editor.deltaDecorations(decorationIdsRef.current, []);
            decorationIdsRef.current = [];
        }

        // Create new decorations
        const decorations: any[] = [];

        collaborators.forEach((collab) => {
            // Skip if no cursor or selection
            if (collab.cursor) {
                decorations.push({
                    range: new monaco.Range(
                        collab.cursor.lineNumber,
                        collab.cursor.column,
                        collab.cursor.lineNumber,
                        collab.cursor.column + 1
                    ),
                    options: {
                        className: `collab-cursor-${collab.userId}`,
                        beforeContentClassName: `collab-cursor-flag-${collab.userId}`,
                        hoverMessage: { value: collab.userName },
                        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
                    },
                });
            }

            // Selection decoration
            if (collab.selection) {
                decorations.push({
                    range: new monaco.Range(
                        collab.selection.startLineNumber,
                        collab.selection.startColumn,
                        collab.selection.endLineNumber,
                        collab.selection.endColumn
                    ),
                    options: {
                        className: `collab-selection-${collab.userId}`,
                        hoverMessage: { value: `${collab.userName} seleccionó esto` },
                    },
                });
            }
        });

        // Apply decorations
        decorationIdsRef.current = editor.deltaDecorations([], decorations);

        // Cleanup on unmount
        return () => {
            if (decorationIdsRef.current.length > 0) {
                editor.deltaDecorations(decorationIdsRef.current, []);
            }
        };
    }, [collaborators, editorRef, monacoRef]);

    // Generate dynamic styles for each collaborator
    return (
        <style jsx global>{`
      ${collaborators.map((collab, index) => {
            const color = collab.userColor || getDefaultColor(index);
            return `
          .collab-cursor-${collab.userId} {
            border-left: 2px solid ${color};
          }
          
          .collab-cursor-flag-${collab.userId}::before {
            content: '${collab.userName}';
            position: absolute;
            top: -18px;
            left: 0;
            background: ${color};
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-family: system-ui, sans-serif;
            white-space: nowrap;
            z-index: 100;
            pointer-events: none;
          }
          
          .collab-selection-${collab.userId} {
            background-color: ${hexToRgba(color, 0.2)};
          }
        `;
        }).join('\n')}
    `}</style>
    );
});

// ============================================================================
// Collaborator Avatars List
// ============================================================================

interface CollaboratorAvatarsProps {
    collaborators: Collaborator[];
    maxVisible?: number;
}

export const CollaboratorAvatars = memo(function CollaboratorAvatars({
    collaborators,
    maxVisible = 5,
}: CollaboratorAvatarsProps) {
    const visible = collaborators.slice(0, maxVisible);
    const remaining = collaborators.length - maxVisible;

    return (
        <div className="flex items-center -space-x-2">
            {visible.map((collab, index) => (
                <div
                    key={collab.userId}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-background"
                    style={{
                        backgroundColor: collab.userColor || getDefaultColor(index),
                        zIndex: maxVisible - index,
                    }}
                    title={collab.userName}
                >
                    {getInitials(collab.userName)}
                </div>
            ))}

            {remaining > 0 && (
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium bg-muted border-2 border-background"
                    style={{ zIndex: 0 }}
                    title={`+${remaining} más`}
                >
                    +{remaining}
                </div>
            )}
        </div>
    );
});

// ============================================================================
// Connection Status Indicator
// ============================================================================

interface ConnectionStatusProps {
    status: 'connecting' | 'connected' | 'disconnected' | 'error';
    collaboratorCount?: number;
}

export const ConnectionStatus = memo(function ConnectionStatus({
    status,
    collaboratorCount = 0,
}: ConnectionStatusProps) {
    const statusConfig = {
        connecting: {
            color: 'bg-yellow-500',
            text: 'Conectando...',
            pulse: true,
        },
        connected: {
            color: 'bg-green-500',
            text: collaboratorCount > 0
                ? `${collaboratorCount + 1} editores en línea`
                : 'Conectado',
            pulse: false,
        },
        disconnected: {
            color: 'bg-gray-400',
            text: 'Desconectado',
            pulse: false,
        },
        error: {
            color: 'bg-red-500',
            text: 'Error de conexión',
            pulse: false,
        },
    };

    const config = statusConfig[status];

    return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="relative">
                <div className={`w-2 h-2 rounded-full ${config.color}`} />
                {config.pulse && (
                    <div className={`absolute inset-0 w-2 h-2 rounded-full ${config.color} animate-ping`} />
                )}
            </div>
            <span>{config.text}</span>
        </div>
    );
});

// ============================================================================
// Utility Functions
// ============================================================================

const DEFAULT_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1',
];

function getDefaultColor(index: number): string {
    return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

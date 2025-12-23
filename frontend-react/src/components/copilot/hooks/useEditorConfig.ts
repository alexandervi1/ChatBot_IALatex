/**
 * useEditorConfig Hook
 * 
 * Manages Monaco Editor configuration, completion registration,
 * and context menu actions.
 */

'use client';

import { useCallback, useRef } from 'react';
import type { OnMount } from '@monaco-editor/react';

import {
    registerLatexCompletions,
    registerLatexFoldingProvider
} from '@/lib/latex-completions';
import { DEFAULT_LATEX_EDITOR_OPTIONS } from '../utils/monaco.types';
import type { MonacoEditor, EditorOptions, ContextAction } from '../utils/monaco.types';

// ============================================================================
// Types
// ============================================================================

interface UseEditorConfigOptions {
    /** Custom editor options to merge with defaults */
    options?: Partial<EditorOptions>;
    /** Called after editor is mounted */
    onMount?: (editor: MonacoEditor, monaco: typeof import('monaco-editor')) => void;
    /** Context menu actions to register */
    contextActions?: ContextAction[];
    /** Whether to register LaTeX completions */
    registerCompletions?: boolean;
    /** Whether to register folding provider */
    registerFolding?: boolean;
}

interface UseEditorConfigReturn {
    /** Editor options to pass to Monaco */
    editorOptions: EditorOptions;
    /** Handler for editor mount event */
    handleEditorDidMount: OnMount;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useEditorConfig({
    options = {},
    onMount,
    contextActions = [],
    registerCompletions = true,
    registerFolding = true,
}: UseEditorConfigOptions = {}): UseEditorConfigReturn {

    // Track if completions have been registered (prevent duplicates)
    const completionsRegistered = useRef(false);
    const foldingRegistered = useRef(false);

    // Merge options with defaults
    const editorOptions: EditorOptions = {
        ...DEFAULT_LATEX_EDITOR_OPTIONS,
        ...options,
    };

    // Handle editor mount
    const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
        // Register LaTeX completions (once)
        if (registerCompletions && !completionsRegistered.current) {
            registerLatexCompletions(monaco);
            completionsRegistered.current = true;
        }

        // Register folding provider (once)
        if (registerFolding && !foldingRegistered.current) {
            registerLatexFoldingProvider(monaco);
            foldingRegistered.current = true;
        }

        // Register context actions
        contextActions.forEach(action => {
            editor.addAction({
                id: action.id,
                label: action.label,
                contextMenuGroupId: action.contextMenuGroupId,
                contextMenuOrder: action.contextMenuOrder,
                keybindings: action.keybindings,
                precondition: action.precondition,
                run: action.run,
            });
        });

        // Call user's onMount callback
        onMount?.(editor as MonacoEditor, monaco);
    }, [onMount, contextActions, registerCompletions, registerFolding]);

    return {
        editorOptions,
        handleEditorDidMount,
    };
}

// ============================================================================
// Preset Context Actions
// ============================================================================

/**
 * Create AI contextual actions for the editor
 */
export function createAIContextActions(
    onAction: (instruction: string, selectedText: string) => Promise<void>
): ContextAction[] {
    return [
        {
            id: 'latex-improve-writing',
            label: '✨ Mejorar Redacción (Académico)',
            contextMenuGroupId: 'ai',
            contextMenuOrder: 1,
            run: async (editor) => {
                const selection = editor.getSelection();
                const model = editor.getModel();
                if (!selection || !model) return;

                const selectedText = model.getValueInRange(selection);
                if (!selectedText.trim()) return;

                await onAction(
                    'Mejora la redacción del siguiente texto para que sea más académico, formal y claro. Mantén el significado original pero mejora la estructura y vocabulario.',
                    selectedText
                );
            },
        },
        {
            id: 'latex-translate-english',
            label: '🇺🇸 Traducir a Inglés',
            contextMenuGroupId: 'ai',
            contextMenuOrder: 2,
            run: async (editor) => {
                const selection = editor.getSelection();
                const model = editor.getModel();
                if (!selection || !model) return;

                const selectedText = model.getValueInRange(selection);
                if (!selectedText.trim()) return;

                await onAction(
                    'Traduce el siguiente texto al inglés académico. Mantén el formato LaTeX si existe.',
                    selectedText
                );
            },
        },
        {
            id: 'latex-fix-code',
            label: '🔧 Corregir Código LaTeX',
            contextMenuGroupId: 'ai',
            contextMenuOrder: 3,
            run: async (editor) => {
                const selection = editor.getSelection();
                const model = editor.getModel();
                if (!selection || !model) return;

                const selectedText = model.getValueInRange(selection);
                if (!selectedText.trim()) return;

                await onAction(
                    'Corrige errores de sintaxis LaTeX en el siguiente código. Asegúrate de que compile correctamente.',
                    selectedText
                );
            },
        },
        {
            id: 'latex-summarize',
            label: '📝 Resumir Sección',
            contextMenuGroupId: 'ai',
            contextMenuOrder: 4,
            run: async (editor) => {
                const selection = editor.getSelection();
                const model = editor.getModel();
                if (!selection || !model) return;

                const selectedText = model.getValueInRange(selection);
                if (!selectedText.trim()) return;

                await onAction(
                    'Resume el siguiente texto en un párrafo conciso manteniendo las ideas principales.',
                    selectedText
                );
            },
        },
        {
            id: 'latex-expand',
            label: '📚 Expandir Párrafo',
            contextMenuGroupId: 'ai',
            contextMenuOrder: 5,
            run: async (editor) => {
                const selection = editor.getSelection();
                const model = editor.getModel();
                if (!selection || !model) return;

                const selectedText = model.getValueInRange(selection);
                if (!selectedText.trim()) return;

                await onAction(
                    'Expande el siguiente texto agregando más detalles, ejemplos y explicaciones. Mantén un tono académico.',
                    selectedText
                );
            },
        },
    ];
}

// ============================================================================
// Keyboard Shortcuts
// ============================================================================

/** Keyboard shortcut configuration */
export interface KeyboardShortcut {
    key: string;
    action: string;
    insert?: string;
    handler?: (editor: MonacoEditor) => void;
}

/** Default LaTeX keyboard shortcuts */
export const DEFAULT_KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
    // Text formatting
    { key: 'Ctrl+B', action: 'bold', insert: '\\textbf{$SELECTION}' },
    { key: 'Ctrl+I', action: 'italic', insert: '\\textit{$SELECTION}' },
    { key: 'Ctrl+U', action: 'underline', insert: '\\underline{$SELECTION}' },
    { key: 'Ctrl+Shift+M', action: 'mathmode', insert: '$$SELECTION$' },

    // Structure
    { key: 'Ctrl+1', action: 'section', insert: '\\section{$CURSOR}' },
    { key: 'Ctrl+2', action: 'subsection', insert: '\\subsection{$CURSOR}' },
    { key: 'Ctrl+3', action: 'subsubsection', insert: '\\subsubsection{$CURSOR}' },

    // Environments
    { key: 'Ctrl+E', action: 'equation', insert: '\\begin{equation}\n\t$CURSOR\n\\end{equation}' },
    { key: 'Ctrl+Shift+E', action: 'align', insert: '\\begin{align}\n\t$CURSOR\n\\end{align}' },
    { key: 'Ctrl+Shift+I', action: 'itemize', insert: '\\begin{itemize}\n\t\\item $CURSOR\n\\end{itemize}' },
    { key: 'Ctrl+Shift+O', action: 'enumerate', insert: '\\begin{enumerate}\n\t\\item $CURSOR\n\\end{enumerate}' },
    { key: 'Ctrl+Shift+F', action: 'figure', insert: '\\begin{figure}[htbp]\n\t\\centering\n\t\\includegraphics[width=0.8\\textwidth]{$CURSOR}\n\t\\caption{}\n\t\\label{fig:}\n\\end{figure}' },
    { key: 'Ctrl+Shift+T', action: 'table', insert: '\\begin{table}[htbp]\n\t\\centering\n\t\\caption{}\n\t\\label{tab:}\n\t\\begin{tabular}{ccc}\n\t\t\\hline\n\t\t$CURSOR & & \\\\\n\t\t\\hline\n\t\\end{tabular}\n\\end{table}' },

    // References
    { key: 'Ctrl+L', action: 'label', insert: '\\label{$CURSOR}' },
    { key: 'Ctrl+R', action: 'ref', insert: '\\ref{$CURSOR}' },
    { key: 'Ctrl+Shift+C', action: 'cite', insert: '\\cite{$CURSOR}' },

    // Math
    { key: 'Ctrl+Shift+/', action: 'frac', insert: '\\frac{$SELECTION}{$CURSOR}' },
    { key: 'Ctrl+Shift+S', action: 'sqrt', insert: '\\sqrt{$SELECTION}' },
    { key: 'Ctrl+Shift+6', action: 'superscript', insert: '^{$SELECTION}' },
    { key: 'Ctrl+Shift+-', action: 'subscript', insert: '_{$SELECTION}' },
];

/**
 * Register keyboard shortcuts in Monaco
 */
export function registerKeyboardShortcuts(
    editor: MonacoEditor,
    monaco: typeof import('monaco-editor'),
    shortcuts: KeyboardShortcut[] = DEFAULT_KEYBOARD_SHORTCUTS
): void {
    shortcuts.forEach(shortcut => {
        const keybinding = parseKeybinding(shortcut.key, monaco);
        if (!keybinding) return;

        editor.addCommand(keybinding, () => {
            if (shortcut.handler) {
                shortcut.handler(editor);
                return;
            }

            if (shortcut.insert) {
                insertSnippet(editor, shortcut.insert);
            }
        });
    });
}

/**
 * Parse key string to Monaco keybinding
 */
function parseKeybinding(
    key: string,
    monaco: typeof import('monaco-editor')
): number | null {
    const parts = key.split('+');
    let result = 0;

    for (const part of parts) {
        switch (part.toLowerCase()) {
            case 'ctrl':
                result |= monaco.KeyMod.CtrlCmd;
                break;
            case 'shift':
                result |= monaco.KeyMod.Shift;
                break;
            case 'alt':
                result |= monaco.KeyMod.Alt;
                break;
            default:
                const keyCode = monaco.KeyCode[`Key${part.toUpperCase()}` as keyof typeof monaco.KeyCode];
                if (keyCode) {
                    result |= keyCode;
                } else {
                    // Try as-is (for numbers, special keys)
                    const directKey = monaco.KeyCode[part as keyof typeof monaco.KeyCode];
                    if (directKey) {
                        result |= directKey;
                    }
                }
        }
    }

    return result || null;
}

/**
 * Insert snippet with placeholder support
 */
function insertSnippet(editor: MonacoEditor, template: string): void {
    const selection = editor.getSelection();
    const model = editor.getModel();
    if (!selection || !model) return;

    const selectedText = model.getValueInRange(selection) || '';

    // Replace placeholders
    let text = template
        .replace(/\$SELECTION/g, selectedText)
        .replace(/\$CURSOR/g, '');

    // Find cursor position
    const cursorIndex = template.indexOf('$CURSOR');

    editor.executeEdits('snippet', [{
        range: selection,
        text,
        forceMoveMarkers: true,
    }]);

    // Position cursor at $CURSOR location
    if (cursorIndex >= 0) {
        const position = editor.getPosition();
        if (position) {
            // Calculate new position based on cursor placeholder
            const beforeCursor = template.substring(0, cursorIndex).replace(/\$SELECTION/g, selectedText);
            const lines = beforeCursor.split('\n');
            const newLine = selection.startLineNumber + lines.length - 1;
            const newColumn = lines.length > 1
                ? lines[lines.length - 1].length + 1
                : selection.startColumn + lines[0].length;

            editor.setPosition({ lineNumber: newLine, column: newColumn });
        }
    }

    editor.focus();
}

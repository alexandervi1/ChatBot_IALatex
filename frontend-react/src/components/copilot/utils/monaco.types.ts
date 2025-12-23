/**
 * Monaco Editor Type Definitions
 * 
 * Strict TypeScript types for Monaco Editor integration.
 * Eliminates all `any` types in the codebase.
 */

import type { editor, languages, Position, Selection, Range, IDisposable } from 'monaco-editor';

// ============================================================================
// Core Monaco Types
// ============================================================================

/** Standalone Monaco Editor instance */
export type MonacoEditor = editor.IStandaloneCodeEditor;

/** Monaco Editor text model */
export type MonacoModel = editor.ITextModel;

/** Monaco cursor/selection position */
export type MonacoPosition = Position;

/** Monaco text selection */
export type MonacoSelection = Selection;

/** Monaco range (for edits) */
export type MonacoRange = Range;

/** Monaco languages namespace */
export type MonacoLanguages = typeof languages;

/** Monaco marker data for diagnostics */
export type MonacoMarkerData = editor.IMarkerData;

// ============================================================================
// Editor Configuration
// ============================================================================

/** Monaco editor options */
export interface EditorOptions extends editor.IStandaloneEditorConstructionOptions {
    minimap?: { enabled: boolean };
    fontSize?: number;
    wordWrap?: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
    scrollBeyondLastLine?: boolean;
    automaticLayout?: boolean;
    lineNumbers?: 'on' | 'off' | 'relative' | 'interval';
    folding?: boolean;
    foldingStrategy?: 'auto' | 'indentation';
    showFoldingControls?: 'always' | 'mouseover';
    renderWhitespace?: 'all' | 'none' | 'boundary' | 'selection' | 'trailing';
}

/** Default editor options for LaTeX */
export const DEFAULT_LATEX_EDITOR_OPTIONS: EditorOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    wordWrap: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    lineNumbers: 'on',
    folding: true,
    foldingStrategy: 'auto',
    showFoldingControls: 'always',
    renderWhitespace: 'none',
    tabSize: 2,
    insertSpaces: true,
    formatOnPaste: true,
    theme: 'vs-light',
};

// ============================================================================
// Edit Operations
// ============================================================================

/** Single edit operation for Monaco */
export interface EditorEditOperation {
    range: {
        startLineNumber: number;
        startColumn: number;
        endLineNumber: number;
        endColumn: number;
    };
    text: string;
    forceMoveMarkers?: boolean;
}

/** Execute edits in the editor */
export function executeEdits(
    editor: MonacoEditor,
    source: string,
    edits: EditorEditOperation[]
): void {
    editor.executeEdits(source, edits.map(edit => ({
        range: {
            startLineNumber: edit.range.startLineNumber,
            startColumn: edit.range.startColumn,
            endLineNumber: edit.range.endLineNumber,
            endColumn: edit.range.endColumn,
        },
        text: edit.text,
        forceMoveMarkers: edit.forceMoveMarkers ?? true,
    })));
}

// ============================================================================
// Context Menu Actions
// ============================================================================

/** Context menu action definition */
export interface ContextAction {
    id: string;
    label: string;
    contextMenuGroupId: string;
    contextMenuOrder: number;
    keybindings?: number[];
    precondition?: string;
    run: (editor: MonacoEditor) => void | Promise<void>;
}

/** Register a context menu action */
export function registerContextAction(
    editor: MonacoEditor,
    action: ContextAction
): IDisposable {
    return editor.addAction({
        id: action.id,
        label: action.label,
        contextMenuGroupId: action.contextMenuGroupId,
        contextMenuOrder: action.contextMenuOrder,
        keybindings: action.keybindings,
        precondition: action.precondition,
        run: action.run,
    });
}

// ============================================================================
// Completion Items
// ============================================================================

/** LaTeX completion item */
export interface LaTeXCompletionItem {
    label: string;
    kind: languages.CompletionItemKind;
    insertText: string;
    insertTextRules?: languages.CompletionItemInsertTextRule;
    documentation?: string | { value: string };
    detail?: string;
    sortText?: string;
    filterText?: string;
}

/** Convert to Monaco completion item */
export function toMonacoCompletion(
    item: LaTeXCompletionItem,
    range: MonacoRange
): languages.CompletionItem {
    return {
        label: item.label,
        kind: item.kind,
        insertText: item.insertText,
        insertTextRules: item.insertTextRules,
        documentation: item.documentation,
        detail: item.detail,
        sortText: item.sortText,
        filterText: item.filterText,
        range,
    };
}

// ============================================================================
// Folding Ranges
// ============================================================================

/** Folding range for LaTeX environments */
export interface LaTeXFoldingRange {
    start: number;
    end: number;
    kind?: languages.FoldingRangeKind;
}

// ============================================================================
// Keyboard Shortcuts
// ============================================================================

/** Keyboard shortcut definition */
export interface KeyboardShortcut {
    /** Key combination (e.g., 'Ctrl+B') */
    key: string;
    /** Action identifier */
    action: string;
    /** Text to insert (supports $SELECTION and $CURSOR placeholders) */
    insert?: string;
    /** Custom handler function */
    handler?: (editor: MonacoEditor) => void;
}

// ============================================================================
// On Mount Handler
// ============================================================================

/** Monaco Editor on mount callback type */
export type EditorOnMount = (
    editor: MonacoEditor,
    monaco: typeof import('monaco-editor')
) => void;

/** Monaco reference for external use */
export interface MonacoRef {
    editor: MonacoEditor | null;
    monaco: typeof import('monaco-editor') | null;
}

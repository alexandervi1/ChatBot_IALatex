/**
 * Copilot Editor Type Definitions
 * 
 * All types and interfaces for the Copilot Editor component.
 */

import type { LaTeXTemplate } from '@/lib/latex-templates';

// ============================================================================
// Preview Status
// ============================================================================

/** PDF Preview compilation status */
export type PreviewStatus = 'idle' | 'loading' | 'success' | 'error';

// ============================================================================
// Editor State
// ============================================================================

/** Panel visibility state */
export interface PanelState {
    sidebar: boolean;
    toolbar: boolean;
    stats: boolean;
    aiBar: boolean;
}

/** Complete editor state */
export interface EditorState {
    // Content
    text: string;
    instruction: string;

    // PDF Preview
    pdfFile: Blob | null;
    previewStatus: PreviewStatus;
    previewError: string | null;
    numPages: number | null;

    // UI State
    panels: PanelState;
    isLoading: boolean;

    // Templates
    customTemplates: LaTeXTemplate[];

    // Dialogs
    isSaveDialogOpen: boolean;
    isCitationDialogOpen: boolean;
    newTemplateName: string;

    // Citation
    citationFormat: CitationFormat;
    citationInput: string;
}

/** Default initial state */
export const DEFAULT_EDITOR_STATE: EditorState = {
    text: '',
    instruction: '',
    pdfFile: null,
    previewStatus: 'idle',
    previewError: null,
    numPages: null,
    panels: {
        sidebar: true,
        toolbar: true,
        stats: true,
        aiBar: true,
    },
    isLoading: false,
    customTemplates: [],
    isSaveDialogOpen: false,
    isCitationDialogOpen: false,
    newTemplateName: '',
    citationFormat: 'APA',
    citationInput: '',
};

// ============================================================================
// Citation Types
// ============================================================================

/** Supported citation formats */
export type CitationFormat = 'APA' | 'IEEE' | 'Chicago' | 'MLA';

/** Citation data structure */
export interface CitationData {
    authors: string;
    title: string;
    journal?: string;
    year: string;
    volume?: string;
    pages?: string;
    doi?: string;
    url?: string;
}

// ============================================================================
// Editor Actions
// ============================================================================

/** Actions available on the editor */
export interface EditorActions {
    // Content
    setText: (value: string) => void;
    setInstruction: (value: string) => void;

    // Panel toggles
    togglePanel: (panel: keyof PanelState) => void;

    // Compilation
    handleSubmit: () => void;
    handlePreview: () => void;
    handleDownload: () => void;

    // Editor operations
    insertAtCursor: (text: string) => void;
    navigateToLine: (line: number) => void;
    focusEditor: () => void;

    // Templates
    selectTemplate: (template: LaTeXTemplate) => void;
    saveTemplate: (name: string) => void;
    deleteCustomTemplate: (index: number) => void;

    // Citations
    generateCitation: (format: CitationFormat, data: CitationData) => void;

    // Dialogs
    openSaveDialog: () => void;
    closeSaveDialog: () => void;
    openCitationDialog: () => void;
    closeCitationDialog: () => void;
}

// ============================================================================
// Component Props
// ============================================================================

/** Props passed from parent to CopilotEditor */
export interface CopilotEditorProps {
    text: string;
    setText: (value: string) => void;
    instruction: string;
    setInstruction: (value: string) => void;
    handleSubmit: () => void;
    handleDownload: () => void;
    handlePreview: () => void;
    pdfFile: Blob | null;
    previewStatus: PreviewStatus;
    previewError: string | null;
    setPreviewError: (error: string | null) => void;
    isLoading: boolean;
}

/** Editor toolbar props */
export interface EditorToolbarProps {
    onCompile: () => void;
    onSaveTemplate: () => void;
    onOpenCitations: () => void;
    isLoading: boolean;
    templates: LaTeXTemplate[];
    customTemplates: LaTeXTemplate[];
    onTemplateSelect: (template: LaTeXTemplate) => void;
    onTemplateDelete: (index: number) => void;
}

/** Editor stats props */
export interface EditorStatsProps {
    wordCount: number;
    charCount: number;
    lineCount: number;
}

/** AI instruction bar props */
export interface AiInstructionBarProps {
    instruction: string;
    setInstruction: (value: string) => void;
    onSubmit: () => void;
    isLoading: boolean;
}

/** PDF Preview props */
export interface PdfPreviewProps {
    pdfFile: Blob | null;
    status: PreviewStatus;
    error: string | null;
    onClearError: () => void;
    numPages: number | null;
    onNumPagesChange: (pages: number) => void;
}

// ============================================================================
// Document Statistics
// ============================================================================

/** Document statistics */
export interface DocumentStats {
    wordCount: number;
    charCount: number;
    lineCount: number;
    pageCount?: number;
}

/** Calculate document statistics */
export function calculateStats(text: string): DocumentStats {
    return {
        wordCount: text.trim().split(/\s+/).filter(w => w.length > 0).length,
        charCount: text.length,
        lineCount: text.split('\n').length,
    };
}

// ============================================================================
// Outline Types
// ============================================================================

/** Outline item types */
export type OutlineItemType =
    | 'chapter'
    | 'section'
    | 'subsection'
    | 'subsubsection'
    | 'figure'
    | 'table'
    | 'equation'
    | 'label';

/** Document outline item */
export interface OutlineItem {
    type: OutlineItemType;
    title: string;
    line: number;
    level: number;
    icon?: string;
}

// ============================================================================
// Collaboration Types (for future Sprint 2)
// ============================================================================

/** Collaborator information */
export interface Collaborator {
    id: string;
    name: string;
    color: string;
    cursor?: {
        lineNumber: number;
        column: number;
    };
}

/** Connection status */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

// ============================================================================
// Version Types (for future Sprint 3)
// ============================================================================

/** Document version */
export interface DocumentVersion {
    id: string;
    versionNumber: number;
    label?: string;
    authorId: number;
    authorName: string;
    createdAt: Date;
    contentHash: string;
}

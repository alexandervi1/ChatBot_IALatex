/**
 * Copilot Module Barrel Export
 * 
 * Central export for the entire copilot module.
 */

// Main Component (keep original for backwards compatibility)
export { CopilotEditor } from './copilot-editor';

// Context & Types
export { EditorProvider, useEditorContext, useEditorState, useEditorActions, useEditorRefs } from './CopilotEditor.context';

// Types (explicit exports to avoid conflicts)
export type {
    PreviewStatus,
    PanelState,
    EditorState,
    CitationFormat,
    CitationData,
    EditorActions,
    CopilotEditorProps,
    EditorToolbarProps,
    EditorStatsProps,
    AiInstructionBarProps,
    PdfPreviewProps,
    DocumentStats,
    OutlineItemType,
    OutlineItem,
    DocumentVersion,
} from './CopilotEditor.types';
export { DEFAULT_EDITOR_STATE, calculateStats } from './CopilotEditor.types';

// Components
export * from './components';

// Hooks (types from hooks take precedence for collaboration)
export * from './hooks';

// Utils
export * from './utils/monaco.types';

// Sidebar Components (existing)
export { DocumentOutline } from './document-outline';

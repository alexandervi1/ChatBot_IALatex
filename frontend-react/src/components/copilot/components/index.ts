/**
 * Copilot Components Barrel Export
 * 
 * Central export for all copilot subcomponents.
 */

// Main Editor Components
export { EditorToolbar } from './EditorToolbar';
export { EditorStats } from './EditorStats';
export { AiInstructionBar } from './AiInstructionBar';

// Collaboration Components (Sprint 2)
export { CollaboratorCursors, CollaboratorAvatars, ConnectionStatus as ConnectionStatusIndicator } from './CollaboratorCursors';
export { ProjectChat, ChatToggle } from './ProjectChat';

// Version History Components (Sprint 3)
export { VersionHistory, DiffViewer } from './VersionHistory';

// Sprint 4 Components
export { SymbolPicker, QuickSymbolBar } from './SymbolPicker';
export { TemplateGallery } from './TemplateGallery';

// Re-export types
export type {
    EditorToolbarProps,
    EditorStatsProps,
    AiInstructionBarProps,
} from '../CopilotEditor.types';

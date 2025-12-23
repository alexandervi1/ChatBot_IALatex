/**
 * Copilot Hooks Barrel Export
 * 
 * Central export for all copilot custom hooks.
 */

// Configuration & Actions
export { useEditorConfig, createAIContextActions, registerKeyboardShortcuts, DEFAULT_KEYBOARD_SHORTCUTS } from './useEditorConfig';

// Templates
export { useTemplates } from './useTemplates';

// Citations
export { useCitations, fetchCitationFromDOI } from './useCitations';

// Scroll Sync
export { useScrollSync } from './useScrollSync';

// Auto Compile
export { useAutoCompile } from './useAutoCompile';

// Collaboration (Sprint 2)
export { useCollaboration, applyCollaboratorDecorations, collaboratorStyles } from './useCollaboration';
export type { Collaborator, ChatMessage, ConnectionStatus } from './useCollaboration';

// Version History (Sprint 3)
export { useVersionHistory } from './useVersionHistory';
export type { VersionInfo, VersionContent, DiffStats, DiffLine, CompareResult } from './useVersionHistory';

// Spell Check (Sprint 4)
export { useSpellCheck, SPELL_CHECK_LANGUAGES } from './useSpellCheck';
export type { SpellError, SpellCheckLanguage } from './useSpellCheck';

// Integrations (Sprint 5)
export { useGitHubSync } from './useGitHubSync';
export type { GitHubUser, GitHubRepo, GitHubCommit, GitHubFile, SyncResult } from './useGitHubSync';
export { useCrossRef } from './useCrossRef';
export type { CrossRefAuthor, CrossRefCitation } from './useCrossRef';

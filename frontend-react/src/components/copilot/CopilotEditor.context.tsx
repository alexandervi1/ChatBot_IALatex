/**
 * Copilot Editor Context
 * 
 * React Context API for sharing editor state and actions
 * across all copilot subcomponents.
 */

'use client';

import React, {
    createContext,
    useContext,
    useReducer,
    useCallback,
    useRef,
    type ReactNode,
    type Dispatch,
} from 'react';

import type { LaTeXTemplate } from '@/lib/latex-templates';
import type {
    EditorState,
    PanelState,
    CitationFormat,
    PreviewStatus,
} from './CopilotEditor.types';
import type { MonacoEditor } from './utils/monaco.types';

// ============================================================================
// Action Types
// ============================================================================

type EditorAction =
    | { type: 'SET_TEXT'; payload: string }
    | { type: 'SET_INSTRUCTION'; payload: string }
    | { type: 'SET_PDF_FILE'; payload: Blob | null }
    | { type: 'SET_PREVIEW_STATUS'; payload: PreviewStatus }
    | { type: 'SET_PREVIEW_ERROR'; payload: string | null }
    | { type: 'SET_NUM_PAGES'; payload: number | null }
    | { type: 'TOGGLE_PANEL'; payload: keyof PanelState }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_CUSTOM_TEMPLATES'; payload: LaTeXTemplate[] }
    | { type: 'ADD_CUSTOM_TEMPLATE'; payload: LaTeXTemplate }
    | { type: 'DELETE_CUSTOM_TEMPLATE'; payload: number }
    | { type: 'OPEN_SAVE_DIALOG' }
    | { type: 'CLOSE_SAVE_DIALOG' }
    | { type: 'OPEN_CITATION_DIALOG' }
    | { type: 'CLOSE_CITATION_DIALOG' }
    | { type: 'SET_NEW_TEMPLATE_NAME'; payload: string }
    | { type: 'SET_CITATION_FORMAT'; payload: CitationFormat }
    | { type: 'SET_CITATION_INPUT'; payload: string };

// ============================================================================
// Initial State
// ============================================================================

const initialState: EditorState = {
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
// Reducer
// ============================================================================

function editorReducer(state: EditorState, action: EditorAction): EditorState {
    switch (action.type) {
        case 'SET_TEXT':
            return { ...state, text: action.payload };

        case 'SET_INSTRUCTION':
            return { ...state, instruction: action.payload };

        case 'SET_PDF_FILE':
            return { ...state, pdfFile: action.payload };

        case 'SET_PREVIEW_STATUS':
            return { ...state, previewStatus: action.payload };

        case 'SET_PREVIEW_ERROR':
            return { ...state, previewError: action.payload };

        case 'SET_NUM_PAGES':
            return { ...state, numPages: action.payload };

        case 'TOGGLE_PANEL':
            return {
                ...state,
                panels: {
                    ...state.panels,
                    [action.payload]: !state.panels[action.payload],
                },
            };

        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };

        case 'SET_CUSTOM_TEMPLATES':
            return { ...state, customTemplates: action.payload };

        case 'ADD_CUSTOM_TEMPLATE':
            return {
                ...state,
                customTemplates: [...state.customTemplates, action.payload],
            };

        case 'DELETE_CUSTOM_TEMPLATE':
            return {
                ...state,
                customTemplates: state.customTemplates.filter((_, i) => i !== action.payload),
            };

        case 'OPEN_SAVE_DIALOG':
            return { ...state, isSaveDialogOpen: true };

        case 'CLOSE_SAVE_DIALOG':
            return { ...state, isSaveDialogOpen: false, newTemplateName: '' };

        case 'OPEN_CITATION_DIALOG':
            return { ...state, isCitationDialogOpen: true };

        case 'CLOSE_CITATION_DIALOG':
            return { ...state, isCitationDialogOpen: false, citationInput: '' };

        case 'SET_NEW_TEMPLATE_NAME':
            return { ...state, newTemplateName: action.payload };

        case 'SET_CITATION_FORMAT':
            return { ...state, citationFormat: action.payload };

        case 'SET_CITATION_INPUT':
            return { ...state, citationInput: action.payload };

        default:
            return state;
    }
}

// ============================================================================
// Context Definition
// ============================================================================

interface EditorContextValue {
    state: EditorState;
    dispatch: Dispatch<EditorAction>;
    editorRef: React.RefObject<MonacoEditor | null>;
    pdfPreviewRef: React.RefObject<HTMLDivElement | null>;
}

const EditorContext = createContext<EditorContextValue | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

interface EditorProviderProps {
    children: ReactNode;
    initialText?: string;
}

export function EditorProvider({ children, initialText = '' }: EditorProviderProps) {
    const [state, dispatch] = useReducer(editorReducer, {
        ...initialState,
        text: initialText,
    });

    const editorRef = useRef<MonacoEditor | null>(null);
    const pdfPreviewRef = useRef<HTMLDivElement | null>(null);

    return (
        <EditorContext.Provider value={{ state, dispatch, editorRef, pdfPreviewRef }}>
            {children}
        </EditorContext.Provider>
    );
}

// ============================================================================
// Hook: useEditorContext
// ============================================================================

/**
 * Access the raw editor context (state + dispatch)
 * Use this for custom action handling
 */
export function useEditorContext(): EditorContextValue {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error('useEditorContext must be used within an EditorProvider');
    }
    return context;
}

// ============================================================================
// Hook: useEditorState
// ============================================================================

/**
 * Access editor state with selector support
 * Useful for performance optimization
 */
export function useEditorState<T>(selector: (state: EditorState) => T): T {
    const { state } = useEditorContext();
    return selector(state);
}

// ============================================================================
// Hook: useEditorActions
// ============================================================================

/**
 * Pre-built action creators for common operations
 */
export function useEditorActions() {
    const { dispatch, editorRef } = useEditorContext();

    const setText = useCallback((value: string) => {
        dispatch({ type: 'SET_TEXT', payload: value });
    }, [dispatch]);

    const setInstruction = useCallback((value: string) => {
        dispatch({ type: 'SET_INSTRUCTION', payload: value });
    }, [dispatch]);

    const togglePanel = useCallback((panel: keyof PanelState) => {
        dispatch({ type: 'TOGGLE_PANEL', payload: panel });
    }, [dispatch]);

    const setLoading = useCallback((loading: boolean) => {
        dispatch({ type: 'SET_LOADING', payload: loading });
    }, [dispatch]);

    const setPdfFile = useCallback((file: Blob | null) => {
        dispatch({ type: 'SET_PDF_FILE', payload: file });
    }, [dispatch]);

    const setPreviewStatus = useCallback((status: PreviewStatus) => {
        dispatch({ type: 'SET_PREVIEW_STATUS', payload: status });
    }, [dispatch]);

    const setPreviewError = useCallback((error: string | null) => {
        dispatch({ type: 'SET_PREVIEW_ERROR', payload: error });
    }, [dispatch]);

    const setNumPages = useCallback((pages: number | null) => {
        dispatch({ type: 'SET_NUM_PAGES', payload: pages });
    }, [dispatch]);

    // Editor operations
    const insertAtCursor = useCallback((text: string) => {
        const editor = editorRef.current;
        if (!editor) return;

        const position = editor.getPosition();
        if (!position) return;

        editor.executeEdits('insert', [{
            range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
            },
            text,
            forceMoveMarkers: true,
        }]);
        editor.focus();
    }, [editorRef]);

    const navigateToLine = useCallback((line: number) => {
        const editor = editorRef.current;
        if (!editor) return;

        editor.revealLineInCenter(line);
        editor.setPosition({ lineNumber: line, column: 1 });
        editor.focus();
    }, [editorRef]);

    const focusEditor = useCallback(() => {
        editorRef.current?.focus();
    }, [editorRef]);

    // Template actions
    const setCustomTemplates = useCallback((templates: LaTeXTemplate[]) => {
        dispatch({ type: 'SET_CUSTOM_TEMPLATES', payload: templates });
    }, [dispatch]);

    const addCustomTemplate = useCallback((template: LaTeXTemplate) => {
        dispatch({ type: 'ADD_CUSTOM_TEMPLATE', payload: template });
    }, [dispatch]);

    const deleteCustomTemplate = useCallback((index: number) => {
        dispatch({ type: 'DELETE_CUSTOM_TEMPLATE', payload: index });
    }, [dispatch]);

    // Dialog actions
    const openSaveDialog = useCallback(() => {
        dispatch({ type: 'OPEN_SAVE_DIALOG' });
    }, [dispatch]);

    const closeSaveDialog = useCallback(() => {
        dispatch({ type: 'CLOSE_SAVE_DIALOG' });
    }, [dispatch]);

    const openCitationDialog = useCallback(() => {
        dispatch({ type: 'OPEN_CITATION_DIALOG' });
    }, [dispatch]);

    const closeCitationDialog = useCallback(() => {
        dispatch({ type: 'CLOSE_CITATION_DIALOG' });
    }, [dispatch]);

    const setNewTemplateName = useCallback((name: string) => {
        dispatch({ type: 'SET_NEW_TEMPLATE_NAME', payload: name });
    }, [dispatch]);

    const setCitationFormat = useCallback((format: CitationFormat) => {
        dispatch({ type: 'SET_CITATION_FORMAT', payload: format });
    }, [dispatch]);

    const setCitationInput = useCallback((input: string) => {
        dispatch({ type: 'SET_CITATION_INPUT', payload: input });
    }, [dispatch]);

    return {
        // Content
        setText,
        setInstruction,

        // PDF Preview
        setPdfFile,
        setPreviewStatus,
        setPreviewError,
        setNumPages,

        // UI
        togglePanel,
        setLoading,

        // Editor operations
        insertAtCursor,
        navigateToLine,
        focusEditor,

        // Templates
        setCustomTemplates,
        addCustomTemplate,
        deleteCustomTemplate,

        // Dialogs
        openSaveDialog,
        closeSaveDialog,
        openCitationDialog,
        closeCitationDialog,
        setNewTemplateName,
        setCitationFormat,
        setCitationInput,
    };
}

// ============================================================================
// Hook: useEditorRefs
// ============================================================================

/**
 * Access editor refs for Monaco and PDF preview
 */
export function useEditorRefs() {
    const { editorRef, pdfPreviewRef } = useEditorContext();
    return { editorRef, pdfPreviewRef };
}

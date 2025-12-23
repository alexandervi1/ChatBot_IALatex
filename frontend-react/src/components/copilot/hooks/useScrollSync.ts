/**
 * useScrollSync Hook
 * 
 * Bidirectional scroll synchronization between Monaco Editor and PDF Preview.
 */

'use client';

import { useCallback, useRef, useEffect } from 'react';
import type { MonacoEditor } from '../utils/monaco.types';

// ============================================================================
// Types
// ============================================================================

interface UseScrollSyncOptions {
    /** Enable scroll sync */
    enabled?: boolean;
    /** PDF preview container element */
    pdfContainerRef: React.RefObject<HTMLDivElement | null>;
    /** Monaco editor instance ref */
    editorRef: React.RefObject<MonacoEditor | null>;
    /** Total number of pages in PDF */
    numPages: number | null;
    /** Total lines in document */
    lineCount: number;
}

interface UseScrollSyncReturn {
    /** Whether sync is currently active */
    isSyncing: boolean;
    /** Handler for editor scroll events */
    handleEditorScroll: () => void;
    /** Handler for PDF scroll events */
    handlePdfScroll: () => void;
    /** Scroll to a specific line in editor and corresponding position in PDF */
    scrollToLine: (line: number) => void;
    /** Scroll to a specific page in PDF and corresponding position in editor */
    scrollToPage: (page: number) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useScrollSync({
    enabled = true,
    pdfContainerRef,
    editorRef,
    numPages,
    lineCount,
}: UseScrollSyncOptions): UseScrollSyncReturn {
    // Prevent feedback loops during programmatic scrolling
    const isSyncing = useRef(false);
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }
        };
    }, []);

    // Lock sync temporarily to prevent loops
    const lockSync = useCallback(() => {
        isSyncing.current = true;

        if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current);
        }

        syncTimeoutRef.current = setTimeout(() => {
            isSyncing.current = false;
        }, 100);
    }, []);

    // Handle editor scroll -> sync PDF
    const handleEditorScroll = useCallback(() => {
        if (!enabled || isSyncing.current || !numPages || !lineCount) return;

        const editor = editorRef.current;
        const pdfContainer = pdfContainerRef.current;
        if (!editor || !pdfContainer) return;

        lockSync();

        // Get current visible range in editor
        const visibleRanges = editor.getVisibleRanges();
        if (visibleRanges.length === 0) return;

        const topLine = visibleRanges[0].startLineNumber;

        // Calculate corresponding position in PDF
        // Simple linear mapping: lineNumber / totalLines = scrollPosition / totalScroll
        const scrollRatio = topLine / Math.max(lineCount, 1);
        const targetScroll = scrollRatio * pdfContainer.scrollHeight;

        pdfContainer.scrollTo({
            top: targetScroll,
            behavior: 'auto', // Use 'auto' for smoother sync
        });
    }, [enabled, numPages, lineCount, editorRef, pdfContainerRef, lockSync]);

    // Handle PDF scroll -> sync editor
    const handlePdfScroll = useCallback(() => {
        if (!enabled || isSyncing.current || !numPages || !lineCount) return;

        const editor = editorRef.current;
        const pdfContainer = pdfContainerRef.current;
        if (!editor || !pdfContainer) return;

        lockSync();

        // Calculate scroll ratio
        const scrollRatio = pdfContainer.scrollTop /
            Math.max(pdfContainer.scrollHeight - pdfContainer.clientHeight, 1);

        // Map to line number
        const targetLine = Math.max(1, Math.floor(scrollRatio * lineCount));

        editor.revealLineNearTop(targetLine);
    }, [enabled, numPages, lineCount, editorRef, pdfContainerRef, lockSync]);

    // Scroll to a specific line in editor and PDF
    const scrollToLine = useCallback((line: number) => {
        if (!numPages || !lineCount) return;

        const editor = editorRef.current;
        const pdfContainer = pdfContainerRef.current;

        lockSync();

        // Scroll editor
        if (editor) {
            editor.revealLineInCenter(line);
            editor.setPosition({ lineNumber: line, column: 1 });
        }

        // Scroll PDF
        if (pdfContainer) {
            const scrollRatio = line / Math.max(lineCount, 1);
            const targetScroll = scrollRatio * (pdfContainer.scrollHeight - pdfContainer.clientHeight);
            pdfContainer.scrollTo({ top: targetScroll, behavior: 'smooth' });
        }
    }, [numPages, lineCount, editorRef, pdfContainerRef, lockSync]);

    // Scroll to a specific page in PDF and editor
    const scrollToPage = useCallback((page: number) => {
        if (!numPages || !lineCount) return;

        const editor = editorRef.current;
        const pdfContainer = pdfContainerRef.current;

        lockSync();

        // Calculate position ratios
        const pageRatio = (page - 1) / Math.max(numPages - 1, 1);

        // Scroll PDF to page
        if (pdfContainer) {
            const targetScroll = pageRatio * (pdfContainer.scrollHeight - pdfContainer.clientHeight);
            pdfContainer.scrollTo({ top: targetScroll, behavior: 'smooth' });
        }

        // Scroll editor to corresponding line
        if (editor) {
            const targetLine = Math.max(1, Math.floor(pageRatio * lineCount));
            editor.revealLineInCenter(targetLine);
        }
    }, [numPages, lineCount, editorRef, pdfContainerRef, lockSync]);

    return {
        isSyncing: isSyncing.current,
        handleEditorScroll,
        handlePdfScroll,
        scrollToLine,
        scrollToPage,
    };
}

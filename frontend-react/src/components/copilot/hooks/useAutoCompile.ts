/**
 * useAutoCompile Hook
 * 
 * Automatically compiles LaTeX to PDF after a debounce period.
 * Similar to Overleaf's auto-compilation feature.
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { compilePdf } from '@/lib/api-client';

// ============================================================================
// Types
// ============================================================================

type CompileStatus = 'idle' | 'pending' | 'compiling' | 'success' | 'error';

interface UseAutoCompileOptions {
    /** Enable auto-compilation */
    enabled?: boolean;
    /** Debounce delay in milliseconds (default: 3000ms) */
    debounceMs?: number;
    /** Minimum text length to trigger compile */
    minLength?: number;
    /** Callback when compilation succeeds */
    onSuccess?: (pdfBlob: Blob) => void;
    /** Callback when compilation fails */
    onError?: (error: string) => void;
}

interface UseAutoCompileReturn {
    /** Current compilation status */
    status: CompileStatus;
    /** Last error message */
    error: string | null;
    /** Whether auto-compile is enabled */
    isEnabled: boolean;
    /** Toggle auto-compile on/off */
    toggle: () => void;
    /** Force immediate compilation */
    forceCompile: () => Promise<void>;
    /** Time until next auto-compile (ms), null if not pending */
    timeUntilCompile: number | null;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useAutoCompile(
    text: string,
    options: UseAutoCompileOptions = {}
): UseAutoCompileReturn {
    const {
        enabled: initialEnabled = false,
        debounceMs = 3000,
        minLength = 50,
        onSuccess,
        onError,
    } = options;

    const [status, setStatus] = useState<CompileStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [isEnabled, setIsEnabled] = useState(initialEnabled);
    const [timeUntilCompile, setTimeUntilCompile] = useState<number | null>(null);

    const previousTextRef = useRef(text);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const compileStartTimeRef = useRef<number | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        };
    }, []);

    // Compile function
    const compile = useCallback(async () => {
        if (text.length < minLength) return;

        setStatus('compiling');
        setError(null);

        try {
            const pdfBlob = await compilePdf({ text, instruction: '' });
            setStatus('success');
            previousTextRef.current = text;
            onSuccess?.(pdfBlob);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Compilation failed';
            setStatus('error');
            setError(errorMessage);
            onError?.(errorMessage);
        }
    }, [text, minLength, onSuccess, onError]);

    // Force compile
    const forceCompile = useCallback(async () => {
        // Clear any pending auto-compile
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
            debounceTimeoutRef.current = null;
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
        setTimeUntilCompile(null);

        await compile();
    }, [compile]);

    // Start countdown timer
    const startCountdown = useCallback((duration: number) => {
        compileStartTimeRef.current = Date.now() + duration;
        setTimeUntilCompile(duration);

        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
        }

        countdownIntervalRef.current = setInterval(() => {
            if (!compileStartTimeRef.current) {
                clearInterval(countdownIntervalRef.current!);
                return;
            }

            const remaining = compileStartTimeRef.current - Date.now();
            if (remaining <= 0) {
                clearInterval(countdownIntervalRef.current!);
                setTimeUntilCompile(null);
                compileStartTimeRef.current = null;
            } else {
                setTimeUntilCompile(remaining);
            }
        }, 100);
    }, []);

    // Auto-compile effect
    useEffect(() => {
        if (!isEnabled) return;
        if (text === previousTextRef.current) return;
        if (text.length < minLength) return;

        // Clear existing timeout
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        setStatus('pending');
        startCountdown(debounceMs);

        debounceTimeoutRef.current = setTimeout(() => {
            compile();
        }, debounceMs);

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [text, isEnabled, debounceMs, minLength, compile, startCountdown]);

    // Toggle auto-compile
    const toggle = useCallback(() => {
        setIsEnabled(prev => !prev);
        if (isEnabled) {
            // Turning off - clear pending
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
                debounceTimeoutRef.current = null;
            }
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
            }
            setTimeUntilCompile(null);
            setStatus('idle');
        }
    }, [isEnabled]);

    return {
        status,
        error,
        isEnabled,
        toggle,
        forceCompile,
        timeUntilCompile,
    };
}

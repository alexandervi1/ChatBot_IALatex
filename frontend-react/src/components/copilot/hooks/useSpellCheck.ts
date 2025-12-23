/**
 * useSpellCheck Hook
 * 
 * Spell checking for LaTeX documents with multi-language support.
 * Ignores LaTeX commands and environments.
 */

'use client';

import { useState, useCallback, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface SpellError {
    word: string;
    line: number;
    column: number;
    suggestions: string[];
}

export type SpellCheckLanguage = 'es' | 'en' | 'pt' | 'fr' | 'de';

interface UseSpellCheckOptions {
    language?: SpellCheckLanguage;
    enabled?: boolean;
    debounceMs?: number;
}

interface UseSpellCheckReturn {
    /** Current errors */
    errors: SpellError[];
    /** Is checking */
    isChecking: boolean;
    /** Current language */
    language: SpellCheckLanguage;
    /** Set language */
    setLanguage: (lang: SpellCheckLanguage) => void;
    /** Check content manually */
    checkContent: (content: string) => void;
    /** Add word to dictionary */
    addToDictionary: (word: string) => void;
    /** Ignore word for this session */
    ignoreWord: (word: string) => void;
    /** Get suggestions for a word */
    getSuggestions: (word: string) => string[];
    /** Clear all errors */
    clearErrors: () => void;
    /** Toggle spell checking */
    toggleEnabled: () => void;
    /** Is enabled */
    isEnabled: boolean;
}

// ============================================================================
// Language Dictionaries (Basic built-in)
// ============================================================================

const COMMON_WORDS: Record<SpellCheckLanguage, Set<string>> = {
    es: new Set([
        // Spanish common words
        'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'en', 'y', 'o', 'que',
        'es', 'son', 'está', 'están', 'fue', 'fueron', 'ser', 'estar', 'tener', 'hacer',
        'para', 'por', 'con', 'sin', 'sobre', 'entre', 'hasta', 'desde', 'hacia',
        'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas', 'aquel',
        'más', 'menos', 'muy', 'mucho', 'poco', 'todo', 'todos', 'cada', 'otro',
        'como', 'cuando', 'donde', 'quien', 'cual', 'cuyo', 'porque', 'aunque',
        'si', 'no', 'sí', 'ya', 'también', 'tampoco', 'solo', 'además', 'siempre',
        'puede', 'pueden', 'debe', 'deben', 'hay', 'había', 'hubo', 'será', 'sería',
        'mismo', 'misma', 'nuevo', 'nueva', 'primero', 'segundo', 'último',
        'introducción', 'conclusión', 'metodología', 'resultados', 'discusión',
        'capítulo', 'sección', 'figura', 'tabla', 'ecuación', 'teorema',
    ]),
    en: new Set([
        // English common words
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
        'of', 'in', 'to', 'for', 'with', 'on', 'at', 'by', 'from', 'as',
        'this', 'that', 'these', 'those', 'it', 'its', 'we', 'our', 'they', 'their',
        'and', 'or', 'but', 'if', 'when', 'where', 'which', 'who', 'what', 'how',
        'not', 'no', 'yes', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
        'other', 'some', 'such', 'than', 'too', 'very', 'can', 'just', 'only',
        'introduction', 'conclusion', 'methodology', 'results', 'discussion',
        'chapter', 'section', 'figure', 'table', 'equation', 'theorem',
    ]),
    pt: new Set([
        // Portuguese common words
        'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'da', 'do', 'em', 'e', 'ou',
        'é', 'são', 'está', 'estão', 'foi', 'foram', 'ser', 'estar', 'ter', 'fazer',
        'para', 'por', 'com', 'sem', 'sobre', 'entre', 'até', 'desde',
    ]),
    fr: new Set([
        // French common words
        'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'en', 'et', 'ou',
        'est', 'sont', 'être', 'avoir', 'fait', 'faire', 'peut', 'peuvent',
        'pour', 'par', 'avec', 'sans', 'sur', 'entre', 'dans', 'ce', 'cette',
    ]),
    de: new Set([
        // German common words
        'der', 'die', 'das', 'ein', 'eine', 'und', 'oder', 'ist', 'sind', 'war',
        'haben', 'sein', 'werden', 'kann', 'können', 'muss', 'müssen',
        'für', 'mit', 'auf', 'bei', 'nach', 'von', 'zu', 'in', 'an',
    ]),
};

// LaTeX commands to ignore
const LATEX_PATTERNS = [
    /\\[a-zA-Z]+(\[[^\]]*\])?({[^}]*})?/g,  // \command[opt]{arg}
    /\$[^$]+\$/g,  // Inline math
    /\$\$[^$]+\$\$/g,  // Display math
    /%[^\n]*/g,  // Comments
    /\\begin\{[^}]+\}/g,
    /\\end\{[^}]+\}/g,
];

// ============================================================================
// Hook Implementation
// ============================================================================

export function useSpellCheck({
    language: initialLanguage = 'es',
    enabled: initialEnabled = true,
    debounceMs = 500,
}: UseSpellCheckOptions = {}): UseSpellCheckReturn {
    const [errors, setErrors] = useState<SpellError[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    const [language, setLanguage] = useState<SpellCheckLanguage>(initialLanguage);
    const [isEnabled, setIsEnabled] = useState(initialEnabled);

    const ignoredWords = useRef<Set<string>>(new Set());
    const customDictionary = useRef<Set<string>>(loadCustomDictionary());
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    // Extract plain text from LaTeX
    const extractPlainText = useCallback((content: string): string => {
        let text = content;

        // Remove LaTeX patterns
        for (const pattern of LATEX_PATTERNS) {
            text = text.replace(new RegExp(pattern.source, 'g'), ' ');
        }

        return text;
    }, []);

    // Check if word is valid
    const isValidWord = useCallback((word: string): boolean => {
        const lowerWord = word.toLowerCase();

        // Skip if too short
        if (word.length < 2) return true;

        // Skip numbers
        if (/^\d+$/.test(word)) return true;

        // Skip if in common words
        if (COMMON_WORDS[language].has(lowerWord)) return true;

        // Skip if in custom dictionary
        if (customDictionary.current.has(lowerWord)) return true;

        // Skip if ignored
        if (ignoredWords.current.has(lowerWord)) return true;

        return false;
    }, [language]);

    // Generate suggestions (simple phonetic-based)
    const generateSuggestions = useCallback((word: string): string[] => {
        const suggestions: string[] = [];
        const lowerWord = word.toLowerCase();

        // Find similar words in dictionary
        const allWords = [
            ...Array.from(COMMON_WORDS[language]),
            ...Array.from(customDictionary.current),
        ];

        for (const dictWord of allWords) {
            // Simple edit distance check (1 character difference)
            if (Math.abs(dictWord.length - lowerWord.length) <= 1) {
                let differences = 0;
                const minLen = Math.min(dictWord.length, lowerWord.length);

                for (let i = 0; i < minLen; i++) {
                    if (dictWord[i] !== lowerWord[i]) differences++;
                    if (differences > 2) break;
                }

                if (differences <= 2) {
                    suggestions.push(dictWord);
                }
            }
        }

        return suggestions.slice(0, 5);
    }, [language]);

    // Main check function
    const checkContent = useCallback((content: string) => {
        if (!isEnabled) {
            setErrors([]);
            return;
        }

        setIsChecking(true);

        // Clear previous timer
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            const foundErrors: SpellError[] = [];
            const lines = content.split('\n');

            lines.forEach((line, lineIndex) => {
                // Skip lines that are mostly LaTeX
                if (line.trim().startsWith('\\') || line.trim().startsWith('%')) {
                    return;
                }

                // Extract words
                const plainLine = extractPlainText(line);
                const wordRegex = /[a-záéíóúüñçàèìòùâêîôûäëïöü]+/gi;
                let match;

                while ((match = wordRegex.exec(plainLine)) !== null) {
                    const word = match[0];

                    if (!isValidWord(word)) {
                        foundErrors.push({
                            word,
                            line: lineIndex + 1,
                            column: match.index + 1,
                            suggestions: generateSuggestions(word),
                        });
                    }
                }
            });

            setErrors(foundErrors);
            setIsChecking(false);
        }, debounceMs);
    }, [isEnabled, debounceMs, extractPlainText, isValidWord, generateSuggestions]);

    // Add to custom dictionary
    const addToDictionary = useCallback((word: string) => {
        const lowerWord = word.toLowerCase();
        customDictionary.current.add(lowerWord);
        saveCustomDictionary(customDictionary.current);

        // Remove from errors
        setErrors(prev => prev.filter(e => e.word.toLowerCase() !== lowerWord));
    }, []);

    // Ignore word for session
    const ignoreWord = useCallback((word: string) => {
        ignoredWords.current.add(word.toLowerCase());
        setErrors(prev => prev.filter(e => e.word.toLowerCase() !== word.toLowerCase()));
    }, []);

    // Get suggestions for word
    const getSuggestions = useCallback((word: string): string[] => {
        return generateSuggestions(word);
    }, [generateSuggestions]);

    // Clear errors
    const clearErrors = useCallback(() => {
        setErrors([]);
    }, []);

    // Toggle enabled
    const toggleEnabled = useCallback(() => {
        setIsEnabled(prev => !prev);
        if (!isEnabled) {
            setErrors([]);
        }
    }, [isEnabled]);

    return {
        errors,
        isChecking,
        language,
        setLanguage,
        checkContent,
        addToDictionary,
        ignoreWord,
        getSuggestions,
        clearErrors,
        toggleEnabled,
        isEnabled,
    };
}

// ============================================================================
// Persistence Helpers
// ============================================================================

const DICTIONARY_KEY = 'latex-copilot-custom-dictionary';

function loadCustomDictionary(): Set<string> {
    if (typeof window === 'undefined') return new Set();

    try {
        const stored = localStorage.getItem(DICTIONARY_KEY);
        return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
        return new Set();
    }
}

function saveCustomDictionary(dict: Set<string>): void {
    try {
        localStorage.setItem(DICTIONARY_KEY, JSON.stringify(Array.from(dict)));
    } catch { }
}

// ============================================================================
// Language Names
// ============================================================================

export const SPELL_CHECK_LANGUAGES: Record<SpellCheckLanguage, string> = {
    es: 'Español',
    en: 'English',
    pt: 'Português',
    fr: 'Français',
    de: 'Deutsch',
};

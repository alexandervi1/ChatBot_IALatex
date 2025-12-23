/**
 * Theme Provider and Dark Mode Support
 * 
 * Full dark mode implementation with system preference detection.
 */

'use client';

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from 'react';

// ============================================================================
// Types
// ============================================================================

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
    /** Current resolved theme (light or dark) */
    resolvedTheme: 'light' | 'dark';
    /** User theme preference */
    theme: Theme;
    /** Set theme preference */
    setTheme: (theme: Theme) => void;
    /** Toggle between light and dark */
    toggle: () => void;
    /** Is dark mode active */
    isDark: boolean;
}

interface ThemeProviderProps {
    children: ReactNode;
    /** Default theme */
    defaultTheme?: Theme;
    /** Storage key for persistence */
    storageKey?: string;
    /** Attribute to set on html element */
    attribute?: 'class' | 'data-theme';
}

// ============================================================================
// Context
// ============================================================================

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

export function ThemeProvider({
    children,
    defaultTheme = 'system',
    storageKey = 'latex-copilot-theme',
    attribute = 'class',
}: ThemeProviderProps) {
    const [theme, setThemeState] = useState<Theme>(defaultTheme);
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

    // Get system preference
    const getSystemTheme = useCallback((): 'light' | 'dark' => {
        if (typeof window === 'undefined') return 'light';
        return window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
    }, []);

    // Resolve theme based on preference
    const resolveTheme = useCallback((pref: Theme): 'light' | 'dark' => {
        if (pref === 'system') {
            return getSystemTheme();
        }
        return pref;
    }, [getSystemTheme]);

    // Initialize from storage
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const stored = localStorage.getItem(storageKey);
        if (stored && ['light', 'dark', 'system'].includes(stored)) {
            setThemeState(stored as Theme);
        }
    }, [storageKey]);

    // Apply theme to document
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const resolved = resolveTheme(theme);
        setResolvedTheme(resolved);

        const root = document.documentElement;

        if (attribute === 'class') {
            root.classList.remove('light', 'dark');
            root.classList.add(resolved);
        } else {
            root.setAttribute('data-theme', resolved);
        }

        // Also set color-scheme for native elements
        root.style.colorScheme = resolved;
    }, [theme, attribute, resolveTheme]);

    // Listen for system preference changes
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = () => {
            if (theme === 'system') {
                setResolvedTheme(getSystemTheme());
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme, getSystemTheme]);

    // Set theme and persist
    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
        if (typeof window !== 'undefined') {
            localStorage.setItem(storageKey, newTheme);
        }
    }, [storageKey]);

    // Toggle between light and dark
    const toggle = useCallback(() => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    }, [resolvedTheme, setTheme]);

    const value: ThemeContextValue = {
        resolvedTheme,
        theme,
        setTheme,
        toggle,
        isDark: resolvedTheme === 'dark',
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

// ============================================================================
// Hook
// ============================================================================

export function useTheme(): ThemeContextValue {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }

    return context;
}

// ============================================================================
// Theme Toggle Component
// ============================================================================

import { Sun, Moon, Monitor } from 'lucide-react';
import { memo } from 'react';

interface ThemeToggleProps {
    showSystemOption?: boolean;
    className?: string;
}

export const ThemeToggle = memo(function ThemeToggle({
    showSystemOption = true,
    className = '',
}: ThemeToggleProps) {
    const { theme, setTheme, isDark } = useTheme();

    if (!showSystemOption) {
        // Simple toggle button
        return (
            <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className={`p-2 rounded-lg hover:bg-muted transition-colors ${className}`}
                title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
                {isDark ? (
                    <Sun className="h-5 w-5" />
                ) : (
                    <Moon className="h-5 w-5" />
                )}
            </button>
        );
    }

    // Three-way toggle with system option
    return (
        <div className={`flex items-center gap-1 rounded-lg bg-muted p-1 ${className}`}>
            <button
                onClick={() => setTheme('light')}
                className={`p-2 rounded-md transition-colors ${theme === 'light' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                    }`}
                title="Modo claro"
                aria-label="Modo claro"
                aria-pressed={theme === 'light'}
            >
                <Sun className="h-4 w-4" />
            </button>
            <button
                onClick={() => setTheme('dark')}
                className={`p-2 rounded-md transition-colors ${theme === 'dark' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                    }`}
                title="Modo oscuro"
                aria-label="Modo oscuro"
                aria-pressed={theme === 'dark'}
            >
                <Moon className="h-4 w-4" />
            </button>
            <button
                onClick={() => setTheme('system')}
                className={`p-2 rounded-md transition-colors ${theme === 'system' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                    }`}
                title="Preferencia del sistema"
                aria-label="Preferencia del sistema"
                aria-pressed={theme === 'system'}
            >
                <Monitor className="h-4 w-4" />
            </button>
        </div>
    );
});

/**
 * Accessibility Utilities
 * 
 * WCAG 2.1 AA compliance helpers for LaTeX Copilot.
 */

'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';

// ============================================================================
// Focus Management
// ============================================================================

/**
 * Hook for focus trap - keeps focus within a container.
 * Useful for modals, dialogs, and dropdowns.
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean = true) {
    const containerRef = useRef<T>(null);

    useEffect(() => {
        if (!active || !containerRef.current) return;

        const container = containerRef.current;
        const focusableElements = getFocusableElements(container);

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Focus first element
        firstElement.focus();

        const handleKeyDown = (e: globalThis.KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        container.addEventListener('keydown', handleKeyDown);
        return () => container.removeEventListener('keydown', handleKeyDown);
    }, [active]);

    return containerRef;
}

/**
 * Get all focusable elements within a container.
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'textarea:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
}

/**
 * Hook to restore focus when unmounting.
 */
export function useFocusRestore() {
    const previousFocusRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        previousFocusRef.current = document.activeElement as HTMLElement;

        return () => {
            previousFocusRef.current?.focus();
        };
    }, []);
}

// ============================================================================
// Keyboard Navigation
// ============================================================================

/**
 * Hook for arrow key navigation in lists.
 */
export function useArrowNavigation<T extends HTMLElement>(
    itemCount: number,
    options: {
        wrap?: boolean;
        orientation?: 'vertical' | 'horizontal' | 'both';
        onSelect?: (index: number) => void;
    } = {}
) {
    const { wrap = true, orientation = 'vertical', onSelect } = options;
    const [focusedIndex, setFocusedIndex] = useState(0);
    const containerRef = useRef<T>(null);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        let newIndex = focusedIndex;

        const isVertical = orientation === 'vertical' || orientation === 'both';
        const isHorizontal = orientation === 'horizontal' || orientation === 'both';

        switch (e.key) {
            case 'ArrowDown':
                if (isVertical) {
                    e.preventDefault();
                    newIndex = wrap
                        ? (focusedIndex + 1) % itemCount
                        : Math.min(focusedIndex + 1, itemCount - 1);
                }
                break;

            case 'ArrowUp':
                if (isVertical) {
                    e.preventDefault();
                    newIndex = wrap
                        ? (focusedIndex - 1 + itemCount) % itemCount
                        : Math.max(focusedIndex - 1, 0);
                }
                break;

            case 'ArrowRight':
                if (isHorizontal) {
                    e.preventDefault();
                    newIndex = wrap
                        ? (focusedIndex + 1) % itemCount
                        : Math.min(focusedIndex + 1, itemCount - 1);
                }
                break;

            case 'ArrowLeft':
                if (isHorizontal) {
                    e.preventDefault();
                    newIndex = wrap
                        ? (focusedIndex - 1 + itemCount) % itemCount
                        : Math.max(focusedIndex - 1, 0);
                }
                break;

            case 'Enter':
            case ' ':
                e.preventDefault();
                onSelect?.(focusedIndex);
                break;

            case 'Home':
                e.preventDefault();
                newIndex = 0;
                break;

            case 'End':
                e.preventDefault();
                newIndex = itemCount - 1;
                break;
        }

        if (newIndex !== focusedIndex) {
            setFocusedIndex(newIndex);
        }
    }, [focusedIndex, itemCount, wrap, orientation, onSelect]);

    return {
        focusedIndex,
        setFocusedIndex,
        containerRef,
        containerProps: {
            onKeyDown: handleKeyDown,
            role: 'listbox',
            tabIndex: 0,
        },
        getItemProps: (index: number) => ({
            role: 'option',
            'aria-selected': index === focusedIndex,
            tabIndex: index === focusedIndex ? 0 : -1,
        }),
    };
}

// ============================================================================
// Screen Reader Announcements
// ============================================================================

let announcer: HTMLDivElement | null = null;

/**
 * Announce a message to screen readers.
 */
export function announce(
    message: string,
    priority: 'polite' | 'assertive' = 'polite'
) {
    if (typeof document === 'undefined') return;

    if (!announcer) {
        announcer = document.createElement('div');
        announcer.setAttribute('aria-live', priority);
        announcer.setAttribute('aria-atomic', 'true');
        announcer.setAttribute('role', 'status');
        announcer.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
        document.body.appendChild(announcer);
    }

    announcer.setAttribute('aria-live', priority);
    announcer.textContent = '';

    // Use setTimeout to ensure the change is announced
    setTimeout(() => {
        if (announcer) {
            announcer.textContent = message;
        }
    }, 100);
}

/**
 * Hook for screen reader announcements.
 */
export function useAnnounce() {
    return useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
        announce(message, priority);
    }, []);
}

// ============================================================================
// Reduced Motion
// ============================================================================

/**
 * Hook to detect reduced motion preference.
 */
export function useReducedMotion(): boolean {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(query.matches);

        const handleChange = (e: MediaQueryListEvent) => {
            setPrefersReducedMotion(e.matches);
        };

        query.addEventListener('change', handleChange);
        return () => query.removeEventListener('change', handleChange);
    }, []);

    return prefersReducedMotion;
}

// ============================================================================
// Skip Link
// ============================================================================

interface SkipLinkProps {
    href: string;
    children?: React.ReactNode;
}

/**
 * Skip to main content link for keyboard navigation.
 */
export function SkipLink({ href, children = 'Saltar al contenido principal' }: SkipLinkProps) {
    return (
        <a
            href={href}
            className="
        sr-only focus:not-sr-only
        focus:absolute focus:top-4 focus:left-4 focus:z-50
        focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground
        focus:rounded-md focus:shadow-lg focus:outline-none
      "
        >
            {children}
        </a>
    );
}

// ============================================================================
// Visually Hidden
// ============================================================================

interface VisuallyHiddenProps {
    children: React.ReactNode;
    as?: React.ElementType;
}

/**
 * Component to hide content visually but keep it accessible to screen readers.
 */
export function VisuallyHidden({ children, as: Component = 'span' }: VisuallyHiddenProps) {
    return (
        <Component
            style={{
                position: 'absolute' as const,
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden' as const,
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap' as const,
                border: 0,
            }}
        >
            {children}
        </Component>
    );
}

// ============================================================================
// Color Contrast Helpers
// ============================================================================

/**
 * Calculate relative luminance of a color.
 * @param hex - Hex color string (e.g., "#ffffff")
 */
export function getLuminance(hex: string): number {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors.
 * WCAG 2.1 requires 4.5:1 for normal text, 3:1 for large text.
 */
export function getContrastRatio(color1: string, color2: string): number {
    const l1 = getLuminance(color1);
    const l2 = getLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG AA requirements.
 */
export function meetsContrastAA(
    foreground: string,
    background: string,
    isLargeText: boolean = false
): boolean {
    const ratio = getContrastRatio(foreground, background);
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Convert hex to RGB.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
        : null;
}

// ============================================================================
// ARIA Helpers
// ============================================================================

/**
 * Generate unique ID for ARIA relationships.
 */
let idCounter = 0;
export function useId(prefix: string = 'id'): string {
    const [id] = useState(() => `${prefix}-${++idCounter}`);
    return id;
}

/**
 * Props for elements that describe another element.
 */
export function getDescribedByProps(descriptions: (string | undefined)[]) {
    const validIds = descriptions.filter(Boolean);
    return validIds.length > 0
        ? { 'aria-describedby': validIds.join(' ') }
        : {};
}

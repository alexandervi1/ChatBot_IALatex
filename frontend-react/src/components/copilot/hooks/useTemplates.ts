/**
 * useTemplates Hook
 * 
 * Manages LaTeX templates including built-in and custom templates.
 * Handles persistence to localStorage.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { latexTemplates, type LaTeXTemplate } from '@/lib/latex-templates';

// ============================================================================
// Constants
// ============================================================================

const CUSTOM_TEMPLATES_KEY = 'custom_latex_templates';

// ============================================================================
// Hook Implementation
// ============================================================================

interface UseTemplatesReturn {
    /** Built-in templates from the templates library */
    builtInTemplates: LaTeXTemplate[];
    /** Custom templates saved by the user */
    customTemplates: LaTeXTemplate[];
    /** All templates (built-in + custom) */
    allTemplates: LaTeXTemplate[];
    /** Templates grouped by category */
    templatesByCategory: Record<string, LaTeXTemplate[]>;
    /** Save a new custom template */
    saveCustomTemplate: (name: string, content: string, description?: string) => boolean;
    /** Delete a custom template by index */
    deleteCustomTemplate: (index: number) => void;
    /** Check if a template name already exists */
    templateNameExists: (name: string) => boolean;
    /** Export all custom templates as JSON */
    exportCustomTemplates: () => string;
    /** Import custom templates from JSON */
    importCustomTemplates: (json: string) => boolean;
}

export function useTemplates(): UseTemplatesReturn {
    const [customTemplates, setCustomTemplates] = useState<LaTeXTemplate[]>([]);

    // Load custom templates from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as LaTeXTemplate[];
                setCustomTemplates(parsed);
            }
        } catch (error) {
            console.error('Error loading custom templates:', error);
        }
    }, []);

    // Persist custom templates to localStorage
    const persistTemplates = useCallback((templates: LaTeXTemplate[]) => {
        try {
            localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates));
        } catch (error) {
            console.error('Error saving custom templates:', error);
        }
    }, []);

    // Save a new custom template
    const saveCustomTemplate = useCallback((
        name: string,
        content: string,
        description?: string
    ): boolean => {
        // Validate name
        const trimmedName = name.trim();
        if (!trimmedName) return false;

        // Check for duplicates
        const allTemplates = [...latexTemplates, ...customTemplates];
        if (allTemplates.some(t => t.name.toLowerCase() === trimmedName.toLowerCase())) {
            return false;
        }

        const newTemplate: LaTeXTemplate = {
            name: trimmedName,
            category: 'Custom',
            description: description || 'Plantilla personalizada',
            content,
        };

        const updated = [...customTemplates, newTemplate];
        setCustomTemplates(updated);
        persistTemplates(updated);
        return true;
    }, [customTemplates, persistTemplates]);

    // Delete a custom template
    const deleteCustomTemplate = useCallback((index: number) => {
        if (index < 0 || index >= customTemplates.length) return;

        const updated = customTemplates.filter((_, i) => i !== index);
        setCustomTemplates(updated);
        persistTemplates(updated);
    }, [customTemplates, persistTemplates]);

    // Check if template name exists
    const templateNameExists = useCallback((name: string): boolean => {
        const lowerName = name.toLowerCase().trim();
        const allTemplates = [...latexTemplates, ...customTemplates];
        return allTemplates.some(t => t.name.toLowerCase() === lowerName);
    }, [customTemplates]);

    // Export custom templates as JSON
    const exportCustomTemplates = useCallback((): string => {
        return JSON.stringify(customTemplates, null, 2);
    }, [customTemplates]);

    // Import custom templates from JSON
    const importCustomTemplates = useCallback((json: string): boolean => {
        try {
            const imported = JSON.parse(json) as LaTeXTemplate[];

            // Validate structure
            if (!Array.isArray(imported)) return false;

            for (const template of imported) {
                if (!template.name || !template.content) return false;
            }

            // Merge with existing, avoiding duplicates
            const merged = [...customTemplates];
            for (const template of imported) {
                if (!templateNameExists(template.name)) {
                    merged.push({
                        ...template,
                        category: template.category || 'Custom',
                        description: template.description || 'Imported template',
                    });
                }
            }

            setCustomTemplates(merged);
            persistTemplates(merged);
            return true;
        } catch {
            return false;
        }
    }, [customTemplates, templateNameExists, persistTemplates]);

    // Combine all templates
    const allTemplates = [...latexTemplates, ...customTemplates];

    // Group templates by category
    const templatesByCategory = allTemplates.reduce<Record<string, LaTeXTemplate[]>>(
        (acc, template) => {
            const category = template.category || 'Other';
            if (!acc[category]) acc[category] = [];
            acc[category].push(template);
            return acc;
        },
        {}
    );

    return {
        builtInTemplates: latexTemplates,
        customTemplates,
        allTemplates,
        templatesByCategory,
        saveCustomTemplate,
        deleteCustomTemplate,
        templateNameExists,
        exportCustomTemplates,
        importCustomTemplates,
    };
}

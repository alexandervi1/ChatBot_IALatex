/**
 * useVersionHistory Hook
 * 
 * Manages document version history, comparison, and restoration.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface VersionInfo {
    id: number;
    version_number: number;
    label: string | null;
    author_id: number;
    author_name?: string;
    change_summary: string | null;
    created_at: string;
    content_length: number;
}

export interface VersionContent extends VersionInfo {
    content: string;
}

export interface DiffStats {
    additions: number;
    deletions: number;
    modifications: number;
    old_lines: number;
    new_lines: number;
}

export interface DiffLine {
    type: 'equal' | 'insert' | 'delete' | 'replace';
    old_line: string | null;
    new_line: string | null;
    old_number: number | null;
    new_number: number | null;
}

export interface CompareResult {
    from_version: {
        number: number;
        label: string | null;
        created_at: string;
    };
    to_version: {
        number: number;
        label: string | null;
        created_at: string;
    };
    unified_diff: string;
    side_by_side: DiffLine[];
    stats: DiffStats;
}

interface UseVersionHistoryOptions {
    projectId: number;
    authToken: string;
}

interface UseVersionHistoryReturn {
    /** List of versions */
    versions: VersionInfo[];
    /** Loading state */
    isLoading: boolean;
    /** Error message */
    error: string | null;
    /** Total version count */
    totalVersions: number;
    /** Currently selected version for viewing */
    selectedVersion: VersionContent | null;
    /** Comparison result when comparing two versions */
    comparison: CompareResult | null;
    /** Fetch version history */
    fetchHistory: (limit?: number, offset?: number) => Promise<void>;
    /** Get a specific version with content */
    getVersion: (versionNumber: number) => Promise<VersionContent | null>;
    /** Create a new version */
    createVersion: (content: string, label?: string, summary?: string) => Promise<VersionInfo | null>;
    /** Update version label */
    updateLabel: (versionId: number, label: string) => Promise<boolean>;
    /** Compare two versions */
    compareVersions: (fromVersion: number, toVersion: number) => Promise<CompareResult | null>;
    /** Restore to a previous version */
    restoreVersion: (versionNumber: number) => Promise<{ newVersion: number } | null>;
    /** Clear selected version */
    clearSelection: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useVersionHistory({
    projectId,
    authToken,
}: UseVersionHistoryOptions): UseVersionHistoryReturn {
    const [versions, setVersions] = useState<VersionInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalVersions, setTotalVersions] = useState(0);
    const [selectedVersion, setSelectedVersion] = useState<VersionContent | null>(null);
    const [comparison, setComparison] = useState<CompareResult | null>(null);

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    // Helper for API calls
    const apiCall = useCallback(async <T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> => {
        const response = await fetch(`${baseUrl}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Request failed' }));
            throw new Error(error.detail || 'Request failed');
        }

        return response.json();
    }, [baseUrl, authToken]);

    // Fetch version history
    const fetchHistory = useCallback(async (limit = 50, offset = 0) => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await apiCall<VersionInfo[]>(
                `/versions/projects/${projectId}/versions?limit=${limit}&offset=${offset}`
            );
            setVersions(data);
            setTotalVersions(data.length); // In a real API, this would come from headers
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch history');
        } finally {
            setIsLoading(false);
        }
    }, [projectId, apiCall]);

    // Get specific version with content
    const getVersion = useCallback(async (versionNumber: number): Promise<VersionContent | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await apiCall<VersionContent>(
                `/versions/projects/${projectId}/versions/${versionNumber}`
            );
            setSelectedVersion(data);
            return data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch version');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [projectId, apiCall]);

    // Create new version
    const createVersion = useCallback(async (
        content: string,
        label?: string,
        summary?: string
    ): Promise<VersionInfo | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await apiCall<VersionInfo>(
                `/versions/projects/${projectId}/versions`,
                {
                    method: 'POST',
                    body: JSON.stringify({ content, label, change_summary: summary }),
                }
            );
            // Refresh history
            await fetchHistory();
            return data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create version');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [projectId, apiCall, fetchHistory]);

    // Update version label
    const updateLabel = useCallback(async (versionId: number, label: string): Promise<boolean> => {
        try {
            await apiCall(`/versions/versions/${versionId}/label`, {
                method: 'PATCH',
                body: JSON.stringify({ label }),
            });
            // Update local state
            setVersions(prev =>
                prev.map(v => v.id === versionId ? { ...v, label } : v)
            );
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update label');
            return false;
        }
    }, [apiCall]);

    // Compare two versions
    const compareVersions = useCallback(async (
        fromVersion: number,
        toVersion: number
    ): Promise<CompareResult | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await apiCall<CompareResult>(
                `/versions/projects/${projectId}/compare?from_version=${fromVersion}&to_version=${toVersion}`
            );
            setComparison(data);
            return data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to compare versions');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [projectId, apiCall]);

    // Restore to previous version
    const restoreVersion = useCallback(async (
        versionNumber: number
    ): Promise<{ newVersion: number } | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await apiCall<{ new_version: number }>(
                `/versions/projects/${projectId}/restore/${versionNumber}`,
                { method: 'POST' }
            );
            // Refresh history
            await fetchHistory();
            return { newVersion: data.new_version };
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to restore version');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [projectId, apiCall, fetchHistory]);

    // Clear selection
    const clearSelection = useCallback(() => {
        setSelectedVersion(null);
        setComparison(null);
    }, []);

    // Fetch history on mount
    useEffect(() => {
        if (projectId) {
            fetchHistory();
        }
    }, [projectId, fetchHistory]);

    return {
        versions,
        isLoading,
        error,
        totalVersions,
        selectedVersion,
        comparison,
        fetchHistory,
        getVersion,
        createVersion,
        updateLabel,
        compareVersions,
        restoreVersion,
        clearSelection,
    };
}

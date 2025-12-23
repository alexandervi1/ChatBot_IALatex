/**
 * useGitHubSync Hook
 * 
 * Manages GitHub integration for LaTeX projects.
 */

'use client';

import { useState, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface GitHubUser {
    login: string;
    name: string;
    avatar_url: string;
}

export interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    description: string;
    html_url: string;
    updated_at: string;
}

export interface GitHubCommit {
    sha: string;
    message: string;
    author: string;
    date: string;
    url: string;
}

export interface GitHubFile {
    path: string;
    content: string;
}

export interface SyncResult {
    created: string[];
    updated: string[];
    errors: { path: string; error: string }[];
}

interface UseGitHubSyncOptions {
    accessToken?: string;
}

interface UseGitHubSyncReturn {
    // Auth state
    isConnected: boolean;
    user: GitHubUser | null;

    // Operations
    connect: (token: string) => Promise<boolean>;
    disconnect: () => void;

    // Repos
    repos: GitHubRepo[];
    loadRepos: () => Promise<void>;
    createRepo: (name: string, description?: string, isPrivate?: boolean) => Promise<GitHubRepo | null>;

    // Sync
    syncToGitHub: (owner: string, repo: string, files: GitHubFile[], message?: string) => Promise<SyncResult | null>;
    pullFromGitHub: (owner: string, repo: string, branch?: string) => Promise<GitHubFile[]>;

    // History
    commits: GitHubCommit[];
    loadCommits: (owner: string, repo: string) => Promise<void>;

    // State
    isLoading: boolean;
    error: string | null;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useGitHubSync({ accessToken: initialToken }: UseGitHubSyncOptions = {}): UseGitHubSyncReturn {
    const [token, setToken] = useState<string | null>(initialToken || null);
    const [user, setUser] = useState<GitHubUser | null>(null);
    const [repos, setRepos] = useState<GitHubRepo[]>([]);
    const [commits, setCommits] = useState<GitHubCommit[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    // Connect with token
    const connect = useCallback(async (newToken: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${apiUrl}/integrations/github/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ access_token: newToken }),
            });

            if (!response.ok) {
                throw new Error('Invalid GitHub token');
            }

            const data = await response.json();
            setToken(newToken);
            setUser(data.user);
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Connection failed');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [apiUrl]);

    // Disconnect
    const disconnect = useCallback(() => {
        setToken(null);
        setUser(null);
        setRepos([]);
        setCommits([]);
    }, []);

    // Load repositories
    const loadRepos = useCallback(async () => {
        if (!token) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${apiUrl}/integrations/github/repos?access_token=${token}`
            );

            if (!response.ok) throw new Error('Failed to load repos');

            const data = await response.json();
            setRepos(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load repositories');
        } finally {
            setIsLoading(false);
        }
    }, [apiUrl, token]);

    // Create repository
    const createRepo = useCallback(async (
        name: string,
        description: string = '',
        isPrivate: boolean = true
    ): Promise<GitHubRepo | null> => {
        if (!token) return null;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${apiUrl}/integrations/github/repos?access_token=${token}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, description, private: isPrivate }),
                }
            );

            if (!response.ok) throw new Error('Failed to create repo');

            const repo = await response.json();
            setRepos(prev => [repo, ...prev]);
            return repo;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create repository');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [apiUrl, token]);

    // Sync files to GitHub
    const syncToGitHub = useCallback(async (
        owner: string,
        repo: string,
        files: GitHubFile[],
        message: string = 'Update from LaTeX Copilot'
    ): Promise<SyncResult | null> => {
        if (!token) return null;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${apiUrl}/integrations/github/sync?access_token=${token}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        owner,
                        repo,
                        files,
                        message,
                    }),
                }
            );

            if (!response.ok) throw new Error('Sync failed');

            return await response.json();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Sync failed');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [apiUrl, token]);

    // Pull files from GitHub
    const pullFromGitHub = useCallback(async (
        owner: string,
        repo: string,
        branch: string = 'main'
    ): Promise<GitHubFile[]> => {
        if (!token) return [];

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${apiUrl}/integrations/github/pull/${owner}/${repo}?access_token=${token}&branch=${branch}`
            );

            if (!response.ok) throw new Error('Pull failed');

            return await response.json();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Pull failed');
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [apiUrl, token]);

    // Load commit history
    const loadCommits = useCallback(async (owner: string, repo: string) => {
        if (!token) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${apiUrl}/integrations/github/commits/${owner}/${repo}?access_token=${token}`
            );

            if (!response.ok) throw new Error('Failed to load commits');

            const data = await response.json();
            setCommits(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load commits');
        } finally {
            setIsLoading(false);
        }
    }, [apiUrl, token]);

    return {
        isConnected: !!token && !!user,
        user,
        connect,
        disconnect,
        repos,
        loadRepos,
        createRepo,
        syncToGitHub,
        pullFromGitHub,
        commits,
        loadCommits,
        isLoading,
        error,
    };
}

/**
 * useCollaboration Hook
 * 
 * Real-time collaboration with WebSocket connection.
 * Manages connection, cursor sync, and message handling.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface Collaborator {
    userId: number;
    userName: string;
    userColor: string;
    cursor?: {
        lineNumber: number;
        column: number;
    };
    selection?: {
        startLineNumber: number;
        startColumn: number;
        endLineNumber: number;
        endColumn: number;
    };
}

export interface ChatMessage {
    userId: number;
    userName: string;
    userColor: string;
    content: string;
    timestamp: string;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseCollaborationOptions {
    projectId: number;
    authToken: string;
    onContentUpdate?: (content: string, version: number) => void;
    onError?: (error: string) => void;
}

interface UseCollaborationReturn {
    /** Connection status */
    status: ConnectionStatus;
    /** List of active collaborators */
    collaborators: Collaborator[];
    /** Chat messages */
    chatMessages: ChatMessage[];
    /** Current document version */
    version: number;
    /** Send cursor position update */
    sendCursorUpdate: (position: { lineNumber: number; column: number }) => void;
    /** Send selection update */
    sendSelectionUpdate: (selection: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number } | null) => void;
    /** Send edit operation */
    sendEdit: (operations: EditOperation[]) => void;
    /** Send chat message */
    sendChatMessage: (content: string) => void;
    /** Request full sync */
    requestSync: () => void;
    /** Disconnect from collaboration */
    disconnect: () => void;
    /** Reconnect */
    reconnect: () => void;
}

interface EditOperation {
    type: 'insert' | 'delete';
    position: number;
    text?: string;
    length?: number;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useCollaboration({
    projectId,
    authToken,
    onContentUpdate,
    onError,
}: UseCollaborationOptions): UseCollaborationReturn {
    const [status, setStatus] = useState<ConnectionStatus>('disconnected');
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [version, setVersion] = useState(0);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, []);

    // Connect WebSocket
    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        setStatus('connecting');

        const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/collaboration/ws/${projectId}?token=${authToken}`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            setStatus('connected');
            reconnectAttempts.current = 0;
            console.log('Collaboration WebSocket connected');
        };

        ws.onclose = (event) => {
            setStatus('disconnected');
            console.log('Collaboration WebSocket closed:', event.code, event.reason);

            // Attempt reconnection
            if (reconnectAttempts.current < maxReconnectAttempts && event.code !== 4001) {
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
                reconnectTimeoutRef.current = setTimeout(() => {
                    reconnectAttempts.current++;
                    connect();
                }, delay);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setStatus('error');
            onError?.('Connection error');
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                handleMessage(message);
            } catch (error) {
                console.error('Failed to parse message:', error);
            }
        };
    }, [projectId, authToken, onError]);

    // Start connection when projectId changes
    useEffect(() => {
        if (projectId && authToken) {
            connect();
        }

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [projectId, authToken, connect]);

    // Handle incoming messages
    const handleMessage = useCallback((message: any) => {
        switch (message.type) {
            case 'init':
                // Initial state from server
                setCollaborators(message.users || []);
                setVersion(message.version || 0);
                if (message.content !== undefined) {
                    onContentUpdate?.(message.content, message.version);
                }
                break;

            case 'user_joined':
                setCollaborators(prev => [...prev, message.user]);
                break;

            case 'user_left':
                setCollaborators(prev => prev.filter(c => c.userId !== message.userId));
                break;

            case 'cursor_update':
                setCollaborators(prev =>
                    prev.map(c =>
                        c.userId === message.userId
                            ? { ...c, cursor: message.position }
                            : c
                    )
                );
                break;

            case 'selection_update':
                setCollaborators(prev =>
                    prev.map(c =>
                        c.userId === message.userId
                            ? { ...c, selection: message.selection }
                            : c
                    )
                );
                break;

            case 'edit':
                setVersion(message.version);
                // The actual content update should be handled by Yjs or similar
                // For now, just track version
                break;

            case 'sync':
                setVersion(message.version);
                if (message.content !== undefined) {
                    onContentUpdate?.(message.content, message.version);
                }
                break;

            case 'chat':
                setChatMessages(prev => [...prev, {
                    userId: message.userId,
                    userName: message.userName,
                    userColor: message.userColor,
                    content: message.content,
                    timestamp: message.timestamp,
                }]);
                break;

            default:
                console.log('Unknown message type:', message.type);
        }
    }, [onContentUpdate]);

    // Send message helper
    const sendMessage = useCallback((message: any) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        }
    }, []);

    // Public methods
    const sendCursorUpdate = useCallback((position: { lineNumber: number; column: number }) => {
        sendMessage({
            type: 'cursor',
            position,
        });
    }, [sendMessage]);

    const sendSelectionUpdate = useCallback((selection: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number } | null) => {
        sendMessage({
            type: 'selection',
            selection,
        });
    }, [sendMessage]);

    const sendEdit = useCallback((operations: EditOperation[]) => {
        sendMessage({
            type: 'edit',
            version,
            operations,
        });
    }, [sendMessage, version]);

    const sendChatMessage = useCallback((content: string) => {
        sendMessage({
            type: 'chat',
            content,
        });
    }, [sendMessage]);

    const requestSync = useCallback(() => {
        sendMessage({
            type: 'sync_request',
        });
    }, [sendMessage]);

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        setStatus('disconnected');
    }, []);

    const reconnect = useCallback(() => {
        disconnect();
        reconnectAttempts.current = 0;
        connect();
    }, [disconnect, connect]);

    return {
        status,
        collaborators,
        chatMessages,
        version,
        sendCursorUpdate,
        sendSelectionUpdate,
        sendEdit,
        sendChatMessage,
        requestSync,
        disconnect,
        reconnect,
    };
}

// ============================================================================
// Collaborator Cursor Decorations
// ============================================================================

/**
 * Apply collaborator cursor decorations to Monaco editor
 */
export function applyCollaboratorDecorations(
    editor: any,
    monaco: any,
    collaborators: Collaborator[]
): string[] {
    if (!editor || !monaco) return [];

    const decorations: any[] = [];

    collaborators.forEach(collab => {
        // Cursor decoration
        if (collab.cursor) {
            decorations.push({
                range: new monaco.Range(
                    collab.cursor.lineNumber,
                    collab.cursor.column,
                    collab.cursor.lineNumber,
                    collab.cursor.column + 1
                ),
                options: {
                    className: `collaborator-cursor`,
                    beforeContentClassName: `collaborator-cursor-line`,
                    hoverMessage: { value: collab.userName },
                    stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
                },
            });
        }

        // Selection decoration
        if (collab.selection) {
            decorations.push({
                range: new monaco.Range(
                    collab.selection.startLineNumber,
                    collab.selection.startColumn,
                    collab.selection.endLineNumber,
                    collab.selection.endColumn
                ),
                options: {
                    className: `collaborator-selection`,
                    hoverMessage: { value: `Selected by ${collab.userName}` },
                },
            });
        }
    });

    // Apply decorations
    return editor.deltaDecorations([], decorations);
}

// ============================================================================
// CSS Styles for Collaborator Cursors
// ============================================================================

export const collaboratorStyles = `
  .collaborator-cursor {
    border-left: 2px solid var(--collab-color, #FF6B6B);
    position: relative;
  }
  
  .collaborator-cursor::before {
    content: attr(data-username);
    position: absolute;
    top: -18px;
    left: 0;
    background: var(--collab-color, #FF6B6B);
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    white-space: nowrap;
    z-index: 100;
  }
  
  .collaborator-selection {
    background-color: rgba(var(--collab-color-rgb, 255, 107, 107), 0.2);
  }
`;

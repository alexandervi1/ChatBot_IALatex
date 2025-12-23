/**
 * ProjectChat Component
 * 
 * Real-time chat for project collaborators.
 */

'use client';

import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageSquare, X } from 'lucide-react';
import type { ChatMessage } from '../../hooks/useCollaboration';

// ============================================================================
// Types
// ============================================================================

interface ProjectChatProps {
    messages: ChatMessage[];
    onSendMessage: (content: string) => void;
    currentUserId: number;
    isOpen: boolean;
    onClose: () => void;
}

// ============================================================================
// Component
// ============================================================================

export const ProjectChat = memo(function ProjectChat({
    messages,
    onSendMessage,
    currentUserId,
    isOpen,
    onClose,
}: ProjectChatProps) {
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSend = useCallback(() => {
        const trimmed = input.trim();
        if (!trimmed) return;

        onSendMessage(trimmed);
        setInput('');
    }, [input, onSendMessage]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-4 right-4 w-80 bg-background border rounded-lg shadow-lg flex flex-col z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b">
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span className="font-medium text-sm">Chat del Proyecto</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 h-64 p-3" ref={scrollRef}>
                {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-8">
                        No hay mensajes aún
                    </div>
                ) : (
                    <div className="space-y-3">
                        {messages.map((msg, index) => (
                            <ChatBubble
                                key={`${msg.userId}-${msg.timestamp}-${index}`}
                                message={msg}
                                isOwnMessage={msg.userId === currentUserId}
                            />
                        ))}
                    </div>
                )}
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t flex gap-2">
                <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 h-8 text-sm"
                />
                <Button
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleSend}
                    disabled={!input.trim()}
                >
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
});

// ============================================================================
// Chat Bubble
// ============================================================================

interface ChatBubbleProps {
    message: ChatMessage;
    isOwnMessage: boolean;
}

const ChatBubble = memo(function ChatBubble({ message, isOwnMessage }: ChatBubbleProps) {
    const formattedTime = formatTime(message.timestamp);

    return (
        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
            {/* Author name for others' messages */}
            {!isOwnMessage && (
                <span
                    className="text-xs font-medium mb-1"
                    style={{ color: message.userColor }}
                >
                    {message.userName}
                </span>
            )}

            {/* Message bubble */}
            <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${isOwnMessage
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                    }`}
            >
                {message.content}
            </div>

            {/* Timestamp */}
            <span className="text-[10px] text-muted-foreground mt-1">
                {formattedTime}
            </span>
        </div>
    );
});

// ============================================================================
// Chat Toggle Button
// ============================================================================

interface ChatToggleProps {
    isOpen: boolean;
    onClick: () => void;
    unreadCount?: number;
}

export const ChatToggle = memo(function ChatToggle({
    isOpen,
    onClick,
    unreadCount = 0,
}: ChatToggleProps) {
    return (
        <Button
            variant={isOpen ? 'default' : 'outline'}
            size="icon"
            className="relative h-9 w-9"
            onClick={onClick}
        >
            <MessageSquare className="h-4 w-4" />
            {unreadCount > 0 && !isOpen && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </Button>
    );
});

// ============================================================================
// Utility Functions
// ============================================================================

function formatTime(timestamp: string): string {
    try {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('es', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return '';
    }
}

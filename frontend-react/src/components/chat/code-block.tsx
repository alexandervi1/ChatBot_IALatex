/**
 * Code Block Component
 * 
 * Renders code blocks with syntax highlighting and copy functionality.
 * Used to replace default code blocks in ReactMarkdown.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
    children: string;
    className?: string;
    inline?: boolean;
}

export function CodeBlock({ children, className, inline }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);

    // Extract language from className (e.g., "language-python")
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : 'text';

    // For inline code, render simple span
    if (inline) {
        return (
            <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-sm">
                {children}
            </code>
        );
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(String(children).trim());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="relative group my-3">
            {/* Language badge + Copy button */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-1.5 bg-muted/80 rounded-t-lg border-b border-border/50">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                    {language}
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleCopy}
                >
                    {copied ? (
                        <>
                            <Check className="h-3 w-3 mr-1 text-green-500" />
                            <span className="text-green-500">¡Copiado!</span>
                        </>
                    ) : (
                        <>
                            <Copy className="h-3 w-3 mr-1" />
                            Copiar
                        </>
                    )}
                </Button>
            </div>
            {/* Code content */}
            <pre className="!mt-0 !pt-10 !rounded-t-lg overflow-x-auto">
                <code className={className}>
                    {children}
                </code>
            </pre>
        </div>
    );
}

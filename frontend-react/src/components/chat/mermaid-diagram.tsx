'use client';

/**
 * Mermaid Diagram Component
 * 
 * Renders Mermaid diagrams from markdown code blocks.
 * Supports flowcharts, sequence diagrams, class diagrams, etc.
 */

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid with custom theme
mermaid.initialize({
    startOnLoad: false,
    theme: 'neutral',
    securityLevel: 'loose',
    fontFamily: 'inherit',
    flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
    }
});

interface MermaidDiagramProps {
    chart: string;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const renderDiagram = async () => {
            if (!containerRef.current) return;

            try {
                setIsLoading(true);
                setError(null);

                // Generate unique ID for the diagram
                const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

                // Render the diagram
                const { svg } = await mermaid.render(id, chart);
                setSvg(svg);
            } catch (err) {
                console.error('Mermaid rendering error:', err);
                setError('Error al renderizar el diagrama');
            } finally {
                setIsLoading(false);
            }
        };

        renderDiagram();
    }, [chart]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-6 bg-muted/30 rounded-lg border border-dashed my-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Generando diagrama...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg my-3">
                <p className="text-sm text-destructive">{error}</p>
                <details className="mt-2">
                    <summary className="text-xs text-muted-foreground cursor-pointer">Ver código</summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                        <code>{chart}</code>
                    </pre>
                </details>
            </div>
        );
    }

    return (
        <div className="my-3 p-4 bg-card rounded-lg border shadow-sm overflow-x-auto">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider bg-muted px-2 py-0.5 rounded">
                    📊 Diagrama
                </span>
            </div>
            <div
                ref={containerRef}
                className="flex justify-center"
                dangerouslySetInnerHTML={{ __html: svg }}
            />
        </div>
    );
}

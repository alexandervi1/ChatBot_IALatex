'use client';

/**
 * Mermaid Diagram Component
 * 
 * Renders Mermaid diagrams from markdown code blocks.
 * Once rendered, converts to static image with click-to-expand.
 */

import { useEffect, useState, useId, useRef, useCallback } from 'react';
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

// Global cache to prevent re-renders
const diagramCache = new Map<string, string>();

interface MermaidDiagramProps {
    chart: string;
}

/**
 * Sanitize Mermaid code for compatibility
 */
function sanitizeMermaidCode(code: string): string {
    let sanitized = code.trim();

    sanitized = sanitized.replace(/^```mermaid\s*/i, '');
    sanitized = sanitized.replace(/```\s*$/, '');

    sanitized = sanitized.replace(/\[([^\]]*)\]/g, (match, content) => {
        const cleanContent = content.replace(/"/g, "'").replace(/'/g, '');
        return `[${cleanContent}]`;
    });

    sanitized = sanitized.replace(/(\w)\s{4,}(\w)/g, '$1\n    $2');

    sanitized = sanitized.replace(
        /subgraph\s+([^\n]+)\(([^)]+)\)/g,
        (match, name, suffix) => `subgraph ${name.trim()}${suffix.trim()}`
    );

    sanitized = sanitized.replace(/^((?:graph|flowchart)\s+\w+)\s+(?=\w)/gm, '$1\n    ');

    sanitized = sanitized.replace(
        /(\w+)\[([^\]]*)\(([^)]*)\)([^\]]*)\]/g,
        (match, id, before, inside, after) => `${id}[${before}${inside}${after}]`
    );

    sanitized = sanitized.replace(/<[^>]*>/g, '');
    sanitized = sanitized.replace(/\r\n/g, '\n');
    sanitized = sanitized.trim();

    return sanitized;
}

/**
 * Generate cache key from chart code
 */
function getCacheKey(chart: string): string {
    return chart.trim().substring(0, 500);
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
    const [svg, setSvg] = useState<string>('');
    const [dataUrl, setDataUrl] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const uniqueId = useId();
    const hasRendered = useRef(false);

    // Convert SVG to data URL for static image
    const svgToDataUrl = useCallback((svgString: string): string => {
        const encoded = encodeURIComponent(svgString);
        return `data:image/svg+xml,${encoded}`;
    }, []);

    useEffect(() => {
        // Check cache first
        const cacheKey = getCacheKey(chart);
        const cached = diagramCache.get(cacheKey);

        if (cached) {
            setSvg(cached);
            setDataUrl(svgToDataUrl(cached));
            setIsLoading(false);
            return;
        }

        // Skip if already rendered for this chart
        if (hasRendered.current) {
            return;
        }

        let isMounted = true;

        const renderDiagram = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const sanitizedChart = sanitizeMermaidCode(chart);
                const id = `mermaid-${uniqueId.replace(/:/g, '-')}-${Date.now()}`;
                const { svg: renderedSvg } = await mermaid.render(id, sanitizedChart);

                if (isMounted) {
                    // Cache the result
                    diagramCache.set(cacheKey, renderedSvg);
                    hasRendered.current = true;

                    setSvg(renderedSvg);
                    setDataUrl(svgToDataUrl(renderedSvg));
                    setIsLoading(false);
                }
            } catch (err: any) {
                console.error('Mermaid rendering error:', err);
                if (isMounted) {
                    setError(err?.message || 'Error al renderizar el diagrama');
                    setIsLoading(false);
                }
            }
        };

        const timer = setTimeout(renderDiagram, 100);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [chart, uniqueId, svgToDataUrl]);

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
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg my-3">
                <p className="text-sm text-amber-600 dark:text-amber-400 mb-2">⚠️ No se pudo renderizar el diagrama</p>
                <details className="mt-2">
                    <summary className="text-xs text-muted-foreground cursor-pointer">Ver código Mermaid</summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                        <code>{chart}</code>
                    </pre>
                </details>
            </div>
        );
    }

    return (
        <>
            {/* Diagram thumbnail - click to expand */}
            <div className="my-3 p-4 bg-card rounded-lg border shadow-sm overflow-hidden">
                <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider bg-muted px-2 py-0.5 rounded">
                        📊 Diagrama
                    </span>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="text-[10px] text-primary hover:underline cursor-pointer"
                    >
                        🔍 Ver tamaño completo
                    </button>
                </div>

                {/* Static image preview */}
                <div
                    className="flex justify-center cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setIsModalOpen(true)}
                    title="Clic para ver en tamaño completo"
                >
                    {dataUrl ? (
                        <img
                            src={dataUrl}
                            alt="Diagrama Mermaid"
                            className="max-w-full max-h-[300px] object-contain"
                        />
                    ) : (
                        <div
                            className="[&>svg]:max-w-full [&>svg]:max-h-[300px]"
                            dangerouslySetInnerHTML={{ __html: svg }}
                        />
                    )}
                </div>
            </div>

            {/* Fullscreen modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className="bg-card rounded-lg p-4 max-w-[95vw] max-h-[95vh] overflow-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4 pb-2 border-b">
                            <span className="text-sm font-medium">📊 Diagrama - Vista completa</span>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-muted-foreground hover:text-foreground text-xl px-2"
                            >
                                ✕
                            </button>
                        </div>
                        <div
                            className="flex justify-center [&>svg]:max-w-full"
                            dangerouslySetInnerHTML={{ __html: svg }}
                        />
                    </div>
                </div>
            )}
        </>
    );
}

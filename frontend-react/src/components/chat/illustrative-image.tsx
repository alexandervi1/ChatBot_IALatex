'use client';

/**
 * Illustrative Image Component
 * 
 * Searches and displays relevant images based on AI suggestions.
 * Uses DuckDuckGo search via backend API.
 */

import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface IllustrativeImageProps {
    searchQuery: string;
}

interface ImageResult {
    success: boolean;
    image_url: string | null;
    source: string | null;
    query: string;
}

export function IllustrativeImage({ searchQuery }: IllustrativeImageProps) {
    const [imageData, setImageData] = useState<ImageResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const fetchImage = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(
                    `${API_BASE}/chat/search-image?query=${encodeURIComponent(searchQuery)}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                        }
                    }
                );

                if (response.ok) {
                    const data: ImageResult = await response.json();
                    setImageData(data);
                }
            } catch (error) {
                console.error('Error fetching image:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (searchQuery) {
            fetchImage();
        }
    }, [searchQuery]);

    if (isLoading) {
        return (
            <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-dashed flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">Buscando imagen ilustrativa...</span>
            </div>
        );
    }

    if (!imageData?.success || !imageData.image_url) {
        return null; // No image found, don't show anything
    }

    return (
        <>
            <div className="mt-3 p-3 bg-card rounded-lg border shadow-sm">
                <div className="flex items-center justify-between mb-2 pb-2 border-b">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider bg-muted px-2 py-0.5 rounded">
                        🖼️ Imagen Ilustrativa
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                        {imageData.source}
                    </span>
                </div>

                <div
                    className="flex justify-center cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setIsExpanded(true)}
                    title="Clic para ver en tamaño completo"
                >
                    <img
                        src={imageData.image_url}
                        alt={searchQuery}
                        className="max-w-full max-h-[200px] rounded object-contain"
                        onError={(e) => {
                            // Hide if image fails to load
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                </div>
            </div>

            {/* Fullscreen modal */}
            {isExpanded && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                    onClick={() => setIsExpanded(false)}
                >
                    <div
                        className="bg-card rounded-lg p-4 max-w-[95vw] max-h-[95vh] overflow-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4 pb-2 border-b">
                            <span className="text-sm font-medium">🖼️ {searchQuery}</span>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="text-muted-foreground hover:text-foreground text-xl px-2"
                            >
                                ✕
                            </button>
                        </div>
                        <img
                            src={imageData.image_url}
                            alt={searchQuery}
                            className="max-w-full max-h-[80vh] rounded"
                        />
                        <p className="mt-2 text-xs text-muted-foreground text-center">
                            Fuente: {imageData.source}
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}

/**
 * Extract IMAGE_SEARCH markers from content
 * Returns the content without markers and the search query if found
 */
export function extractImageSearch(content: string): { cleanContent: string; searchQuery: string | null } {
    const regex = /\[IMAGE_SEARCH:\s*([^\]]+)\]/gi;
    const match = regex.exec(content);

    if (match) {
        return {
            cleanContent: content.replace(regex, '').trim(),
            searchQuery: match[1].trim()
        };
    }

    return { cleanContent: content, searchQuery: null };
}

/**
 * Performance Optimization Utilities
 * 
 * Tools for optimizing LaTeX Copilot performance.
 */

'use client';

import {
    useCallback,
    useEffect,
    useRef,
    useState,
    useMemo,
    type DependencyList,
} from 'react';

// ============================================================================
// Debounce & Throttle
// ============================================================================

/**
 * Hook for debounced value.
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Hook for debounced callback.
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
    callback: T,
    delay: number,
    deps: DependencyList = []
): T {
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    const debouncedFn = useCallback(
        (...args: Parameters<T>) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                callback(...args);
            }, delay);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [callback, delay, ...deps]
    ) as T;

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return debouncedFn;
}

/**
 * Hook for throttled callback.
 */
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
    callback: T,
    delay: number
): T {
    const lastRun = useRef(0);
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    const throttledFn = useCallback(
        (...args: Parameters<T>) => {
            const now = Date.now();
            const timeSinceLastRun = now - lastRun.current;

            if (timeSinceLastRun >= delay) {
                lastRun.current = now;
                callback(...args);
            } else {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
                timeoutRef.current = setTimeout(() => {
                    lastRun.current = Date.now();
                    callback(...args);
                }, delay - timeSinceLastRun);
            }
        },
        [callback, delay]
    ) as T;

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return throttledFn;
}

// ============================================================================
// Intersection Observer (Lazy Loading)
// ============================================================================

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
    freezeOnceVisible?: boolean;
}

/**
 * Hook for intersection observer (lazy loading, infinite scroll).
 */
export function useIntersectionObserver<T extends HTMLElement>(
    options: UseIntersectionObserverOptions = {}
): [React.RefObject<T | null>, boolean] {
    const { threshold = 0, root = null, rootMargin = '0px', freezeOnceVisible = false } = options;

    const ref = useRef<T>(null);
    const [isVisible, setIsVisible] = useState(false);
    const frozen = useRef(false);

    useEffect(() => {
        const element = ref.current;
        if (!element || (freezeOnceVisible && frozen.current)) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                const visible = entry.isIntersecting;
                setIsVisible(visible);

                if (visible && freezeOnceVisible) {
                    frozen.current = true;
                    observer.disconnect();
                }
            },
            { threshold, root, rootMargin }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [threshold, root, rootMargin, freezeOnceVisible]);

    return [ref, isVisible];
}

// ============================================================================
// Virtual Scroll
// ============================================================================

interface UseVirtualScrollOptions {
    itemCount: number;
    itemHeight: number;
    containerHeight: number;
    overscan?: number;
}

/**
 * Hook for virtual scrolling large lists.
 */
export function useVirtualScroll({
    itemCount,
    itemHeight,
    containerHeight,
    overscan = 3,
}: UseVirtualScrollOptions) {
    const [scrollTop, setScrollTop] = useState(0);

    const totalHeight = itemCount * itemHeight;

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
        itemCount - 1,
        Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const visibleItems = useMemo(() => {
        const items = [];
        for (let i = startIndex; i <= endIndex; i++) {
            items.push({
                index: i,
                style: {
                    position: 'absolute' as const,
                    top: i * itemHeight,
                    height: itemHeight,
                    left: 0,
                    right: 0,
                },
            });
        }
        return items;
    }, [startIndex, endIndex, itemHeight]);

    const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    }, []);

    return {
        totalHeight,
        visibleItems,
        handleScroll,
        containerProps: {
            onScroll: handleScroll,
            style: { height: containerHeight, overflow: 'auto' as const },
        },
        innerProps: {
            style: { height: totalHeight, position: 'relative' as const },
        },
    };
}

// ============================================================================
// Memory Cache
// ============================================================================

type CacheEntry<T> = {
    value: T;
    expiry: number;
};

/**
 * Simple in-memory cache with TTL.
 */
export class MemoryCache<T> {
    private cache = new Map<string, CacheEntry<T>>();
    private defaultTTL: number;

    constructor(defaultTTL: number = 5 * 60 * 1000) {
        this.defaultTTL = defaultTTL;
    }

    set(key: string, value: T, ttl?: number): void {
        const expiry = Date.now() + (ttl ?? this.defaultTTL);
        this.cache.set(key, { value, expiry });
    }

    get(key: string): T | undefined {
        const entry = this.cache.get(key);
        if (!entry) return undefined;

        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return undefined;
        }

        return entry.value;
    }

    has(key: string): boolean {
        return this.get(key) !== undefined;
    }

    delete(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache) {
            if (now > entry.expiry) {
                this.cache.delete(key);
            }
        }
    }
}

// ============================================================================
// Web Workers
// ============================================================================

/**
 * Hook for running heavy computations in a Web Worker.
 */
export function useWorker<T, R>(
    workerFn: (data: T) => R
): [(data: T) => Promise<R>, boolean] {
    const [isProcessing, setIsProcessing] = useState(false);
    const workerRef = useRef<Worker | null>(null);

    const process = useCallback(
        (data: T): Promise<R> => {
            return new Promise((resolve, reject) => {
                if (typeof Worker === 'undefined') {
                    // Fallback for SSR or no worker support
                    try {
                        resolve(workerFn(data));
                    } catch (e) {
                        reject(e);
                    }
                    return;
                }

                setIsProcessing(true);

                // Create inline worker
                const blob = new Blob(
                    [
                        `self.onmessage = function(e) {
              const fn = ${workerFn.toString()};
              const result = fn(e.data);
              self.postMessage(result);
            }`,
                    ],
                    { type: 'application/javascript' }
                );

                const worker = new Worker(URL.createObjectURL(blob));
                workerRef.current = worker;

                worker.onmessage = (e) => {
                    setIsProcessing(false);
                    resolve(e.data);
                    worker.terminate();
                };

                worker.onerror = (e) => {
                    setIsProcessing(false);
                    reject(e);
                    worker.terminate();
                };

                worker.postMessage(data);
            });
        },
        [workerFn]
    );

    useEffect(() => {
        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    return [process, isProcessing];
}

// ============================================================================
// Request Animation Frame
// ============================================================================

/**
 * Hook for smooth animations using requestAnimationFrame.
 */
export function useAnimationFrame(callback: (deltaTime: number) => void) {
    const requestRef = useRef<number | undefined>(undefined);
    const previousTimeRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        const animate = (time: number) => {
            if (previousTimeRef.current !== undefined) {
                const deltaTime = time - previousTimeRef.current;
                callback(deltaTime);
            }
            previousTimeRef.current = time;
            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [callback]);
}

// ============================================================================
// Performance Measurement
// ============================================================================

/**
 * Simple performance measurement utility.
 */
export function measurePerformance(label: string) {
    const start = performance.now();

    return {
        end: () => {
            const duration = performance.now() - start;
            console.debug(`[Perf] ${label}: ${duration.toFixed(2)}ms`);
            return duration;
        },
    };
}

/**
 * Hook to measure component render time.
 */
export function useRenderTime(componentName: string, enabled: boolean = false) {
    const renderCount = useRef(0);

    useEffect(() => {
        if (!enabled) return;

        renderCount.current++;
        console.debug(`[Render] ${componentName} rendered (count: ${renderCount.current})`);
    });
}

// ============================================================================
// Batch Updates
// ============================================================================

type BatchCallback = () => void;

/**
 * Batch multiple updates to reduce re-renders.
 */
export function createBatcher(delay: number = 0) {
    let callbacks: BatchCallback[] = [];
    let scheduled = false;

    const flush = () => {
        const toRun = callbacks;
        callbacks = [];
        scheduled = false;
        toRun.forEach((cb) => cb());
    };

    return {
        add: (callback: BatchCallback) => {
            callbacks.push(callback);

            if (!scheduled) {
                scheduled = true;
                if (delay === 0) {
                    queueMicrotask(flush);
                } else {
                    setTimeout(flush, delay);
                }
            }
        },
        flush,
    };
}

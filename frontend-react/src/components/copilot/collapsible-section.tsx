/**
 * Collapsible Section Component
 * 
 * A reusable component for sections that can be collapsed
 * to maximize workspace area.
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
    title: string;
    icon?: React.ReactNode;
    defaultCollapsed?: boolean;
    children: React.ReactNode;
    className?: string;
}

export function CollapsibleSection({
    title,
    icon,
    defaultCollapsed = false,
    children,
    className = '',
}: CollapsibleSectionProps) {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

    return (
        <div className={`border rounded-md overflow-hidden ${className}`}>
            <button
                className="w-full flex items-center justify-between px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors text-sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <span className="flex items-center gap-2 font-medium">
                    {icon}
                    {title}
                </span>
                {isCollapsed ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                )}
            </button>
            {!isCollapsed && (
                <div className="p-2">
                    {children}
                </div>
            )}
        </div>
    );
}

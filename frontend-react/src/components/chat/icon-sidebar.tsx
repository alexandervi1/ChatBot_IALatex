/**
 * Icon Sidebar Component - VS Code Style
 * 
 * Vertical icon bar on the left side of the screen.
 * Click an icon once to show panel, click again to hide.
 */

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FolderOpen, FileText, Calculator, Settings, MessageSquare, Edit3 } from 'lucide-react';

interface IconSidebarProps {
    activePanel: 'documents' | 'outline' | 'symbols' | null;
    onPanelChange: (panel: 'documents' | 'outline' | 'symbols' | null) => void;
    mode: 'chat' | 'copilot';
}

interface IconButtonProps {
    icon: React.ElementType;
    tooltip: string;
    active: boolean;
    onClick: () => void;
}

function IconButton({ icon: Icon, tooltip, active, onClick }: IconButtonProps) {
    return (
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`h-10 w-10 rounded-none transition-all ${active
                                ? 'bg-primary/10 border-l-2 border-primary text-primary'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                        onClick={onClick}
                    >
                        <Icon className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={5}>
                    <p>{tooltip}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export function IconSidebar({ activePanel, onPanelChange, mode }: IconSidebarProps) {
    const handleToggle = (panel: 'documents' | 'outline' | 'symbols') => {
        // VS Code behavior: click to open, click again to close
        if (activePanel === panel) {
            onPanelChange(null);
        } else {
            onPanelChange(panel);
        }
    };

    return (
        <div className="hidden md:flex w-12 bg-muted/50 flex-col items-center border-r">
            {/* Top Icons */}
            <div className="flex flex-col">
                <IconButton
                    icon={FolderOpen}
                    tooltip="Documentos"
                    active={activePanel === 'documents'}
                    onClick={() => handleToggle('documents')}
                />

                {/* Show these only in copilot mode */}
                {mode === 'copilot' && (
                    <>
                        <IconButton
                            icon={FileText}
                            tooltip="Estructura"
                            active={activePanel === 'outline'}
                            onClick={() => handleToggle('outline')}
                        />
                        <IconButton
                            icon={Calculator}
                            tooltip="Símbolos"
                            active={activePanel === 'symbols'}
                            onClick={() => handleToggle('symbols')}
                        />
                    </>
                )}
            </div>

            {/* Spacer */}
            <div className="flex-grow" />

            {/* Mode indicator at bottom */}
            <div className="pb-2">
                <TooltipProvider delayDuration={100}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="h-10 w-10 flex items-center justify-center text-muted-foreground">
                                {mode === 'chat' ? (
                                    <MessageSquare className="h-4 w-4" />
                                ) : (
                                    <Edit3 className="h-4 w-4" />
                                )}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            <p>{mode === 'chat' ? 'Modo Chat' : 'Modo Copilot'}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    );
}

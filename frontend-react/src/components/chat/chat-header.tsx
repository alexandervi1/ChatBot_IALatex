'use client';

import { useRouter } from 'next/navigation';
import { ModeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Eraser, Download, Bot, Pencil, LifeBuoy, LogOut, Settings, Shield } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { User } from '@/lib/api-client';

interface ChatHeaderProps {
    user: User | null;
    mode: 'chat' | 'copilot';
    setMode: (mode: 'chat' | 'copilot') => void;
    onExportChat: () => void;
    onClearChat: () => void;
    onOpenManual: () => void;
    onLogout: () => void;
}

/**
 * Header component for the chat interface.
 * Contains mode toggles, user info, and action buttons.
 * Responsive with different layouts for mobile and desktop.
 */
export function ChatHeader({
    user,
    mode,
    setMode,
    onExportChat,
    onClearChat,
    onOpenManual,
    onLogout,
}: ChatHeaderProps) {
    const router = useRouter();

    return (
        <header className="flex h-14 md:h-16 shrink-0 items-center justify-between border-b px-3 md:px-6">
            <h1 className="text-base md:text-lg font-semibold">Asistente de IA</h1>
            <div className="flex items-center gap-2 md:gap-4">
                <p className="hidden md:block text-sm text-muted-foreground">{user?.email}</p>

                {/* Mobile Menu */}
                <div className="flex md:hidden">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Settings className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onExportChat}>
                                <Download className="h-4 w-4 mr-2" /> Exportar Chat
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onClearChat}>
                                <Eraser className="h-4 w-4 mr-2" /> Limpiar Chat
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setMode('chat')}>
                                <Bot className="h-4 w-4 mr-2" /> Modo Chat
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setMode('copilot')}>
                                <Pencil className="h-4 w-4 mr-2" /> Modo Copiloto
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user?.role === 'admin' && (
                                <DropdownMenuItem onClick={() => router.push('/admin')}>
                                    <Shield className="h-4 w-4 mr-2 text-destructive" /> Panel Admin
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => router.push('/settings')}>
                                <Settings className="h-4 w-4 mr-2" /> Configuración
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onOpenManual}>
                                <LifeBuoy className="h-4 w-4 mr-2" /> Ayuda
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={onLogout}>
                                <LogOut className="h-4 w-4 mr-2" /> Cerrar Sesión
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <ModeToggle />
                </div>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-1">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={onExportChat}>
                                    <Download className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Exportar Chat</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={onClearChat}>
                                    <Eraser className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Limpiar Chat</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant={mode === 'chat' ? 'secondary' : 'ghost'}
                                    size="icon"
                                    onClick={() => setMode('chat')}
                                >
                                    <Bot className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Modo Chat</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant={mode === 'copilot' ? 'secondary' : 'ghost'}
                                    size="icon"
                                    onClick={() => setMode('copilot')}
                                >
                                    <Pencil className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Modo Copiloto</p></TooltipContent>
                        </Tooltip>
                        <ModeToggle />
                        {user?.role === 'admin' && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => router.push('/admin')}>
                                        <Shield className="h-5 w-5 text-destructive" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Panel Admin</p></TooltipContent>
                            </Tooltip>
                        )}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => router.push('/settings')}>
                                    <Settings className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Configuración</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={onOpenManual}>
                                    <LifeBuoy className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Ayuda</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={onLogout}>
                                    <LogOut className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Cerrar Sesión</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
        </header>
    );
}

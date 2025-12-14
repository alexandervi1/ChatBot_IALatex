/**
 * Slash Commands Component
 * 
 * Provides autocomplete suggestions for slash commands in chat input.
 * Commands are processed and replaced with expanded instructions.
 */

import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import {
    FileText,
    Languages,
    HelpCircle,
    Table,
    List,
    Wand2,
    BookOpen,
    Lightbulb
} from 'lucide-react';

/** Slash command definition */
export interface SlashCommand {
    command: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    prefix: string; // What gets prepended to the actual query
}

/** Available slash commands */
export const SLASH_COMMANDS: SlashCommand[] = [
    {
        command: '/resumen',
        label: 'Resumen',
        description: 'Genera un resumen conciso',
        icon: <FileText className="h-4 w-4" />,
        prefix: 'Por favor, genera un RESUMEN CONCISO de la siguiente información: '
    },
    {
        command: '/traducir',
        label: 'Traducir a Inglés',
        description: 'Traduce la respuesta al inglés',
        icon: <Languages className="h-4 w-4" />,
        prefix: 'Por favor, responde en INGLÉS ACADÉMICO a la siguiente pregunta: '
    },
    {
        command: '/explicar',
        label: 'Explicar Simple',
        description: 'Explica como para un niño de 10 años',
        icon: <HelpCircle className="h-4 w-4" />,
        prefix: 'Explica de forma MUY SIMPLE, como si fuera para un niño de 10 años: '
    },
    {
        command: '/tabla',
        label: 'Formato Tabla',
        description: 'Presenta la información en tabla',
        icon: <Table className="h-4 w-4" />,
        prefix: 'Responde organizando la información en una TABLA MARKDOWN clara: '
    },
    {
        command: '/puntos',
        label: 'Bullet Points',
        description: 'Resume en puntos clave',
        icon: <List className="h-4 w-4" />,
        prefix: 'Responde con una lista de BULLET POINTS con los puntos más importantes: '
    },
    {
        command: '/analizar',
        label: 'Análisis Profundo',
        description: 'Análisis detallado y crítico',
        icon: <Wand2 className="h-4 w-4" />,
        prefix: 'Realiza un ANÁLISIS PROFUNDO Y CRÍTICO de: '
    },
    {
        command: '/definir',
        label: 'Definición',
        description: 'Define el concepto claramente',
        icon: <BookOpen className="h-4 w-4" />,
        prefix: 'Proporciona una DEFINICIÓN CLARA Y ACADÉMICA de: '
    },
    {
        command: '/ejemplo',
        label: 'Ejemplos',
        description: 'Proporciona ejemplos prácticos',
        icon: <Lightbulb className="h-4 w-4" />,
        prefix: 'Proporciona EJEMPLOS PRÁCTICOS Y CLAROS de: '
    }
];

interface SlashCommandsDropdownProps {
    isOpen: boolean;
    filter: string;
    onSelect: (command: SlashCommand) => void;
    selectedIndex: number;
}

/**
 * Dropdown component showing filtered slash commands
 */
export function SlashCommandsDropdown({
    isOpen,
    filter,
    onSelect,
    selectedIndex
}: SlashCommandsDropdownProps) {
    if (!isOpen) return null;

    const filteredCommands = SLASH_COMMANDS.filter(cmd =>
        cmd.command.toLowerCase().includes(filter.toLowerCase()) ||
        cmd.label.toLowerCase().includes(filter.toLowerCase())
    );

    if (filteredCommands.length === 0) return null;

    return (
        <div className="absolute bottom-full left-0 mb-1 w-72 bg-popover border rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="p-2 border-b bg-muted/50">
                <p className="text-xs font-medium text-muted-foreground">Comandos disponibles</p>
            </div>
            <Command className="border-none">
                <CommandList className="max-h-48">
                    <CommandGroup>
                        {filteredCommands.map((cmd, index) => (
                            <CommandItem
                                key={cmd.command}
                                onSelect={() => onSelect(cmd)}
                                className={`flex items-center gap-3 p-2 cursor-pointer ${index === selectedIndex ? 'bg-accent' : ''
                                    }`}
                            >
                                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary">
                                    {cmd.icon}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{cmd.command}</p>
                                    <p className="text-xs text-muted-foreground">{cmd.description}</p>
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </Command>
            <div className="p-1.5 border-t bg-muted/30">
                <p className="text-[10px] text-muted-foreground text-center">
                    <kbd className="px-1 py-0.5 bg-muted rounded text-[9px]">↑↓</kbd> navegar ·
                    <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] ml-1">Tab</kbd> seleccionar
                </p>
            </div>
        </div>
    );
}

/**
 * Process input text to expand slash commands
 * Returns the processed text with command prefix applied
 */
export function processSlashCommand(input: string): string {
    for (const cmd of SLASH_COMMANDS) {
        if (input.startsWith(cmd.command + ' ')) {
            const query = input.slice(cmd.command.length + 1).trim();
            return cmd.prefix + query;
        }
    }
    return input;
}

/**
 * Check if input starts with a slash command pattern
 */
export function startsWithSlash(input: string): boolean {
    return input.startsWith('/');
}

/**
 * Get the current slash filter (text after /)
 */
export function getSlashFilter(input: string): string {
    if (!input.startsWith('/')) return '';
    const spaceIndex = input.indexOf(' ');
    if (spaceIndex === -1) return input;
    return input.slice(0, spaceIndex);
}

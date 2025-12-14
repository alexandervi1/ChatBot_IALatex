/**
 * Chat Input Component
 * 
 * Provides a text input field with submit button for sending messages.
 * Features:
 * - Slash commands autocomplete (/resumen, /traducir, etc.)
 * - Character counter with limit indicator
 * - Ctrl+Enter keyboard shortcut
 * - Loading states with visual feedback
 * - Responsive design
 */
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizontal, Loader2 } from 'lucide-react';
import { FormEvent, KeyboardEvent, useRef, useEffect, useState } from 'react';
import {
  SlashCommandsDropdown,
  SLASH_COMMANDS,
  processSlashCommand,
  startsWithSlash,
  SlashCommand
} from './slash-commands';

/** Maximum characters allowed */
const MAX_CHARS = 4000;

/** Props for the ChatInput component */
interface ChatInputProps {
  /** Current input value */
  input: string;
  /** Callback to update input value */
  setInput: (value: string) => void;
  /** Form submission handler */
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  /** Whether a message is being processed */
  isLoading: boolean;
}

export function ChatInput({ input, setInput, handleSubmit, isLoading }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showCommands, setShowCommands] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const charCount = input.length;
  const isNearLimit = charCount > MAX_CHARS * 0.8;
  const isOverLimit = charCount > MAX_CHARS;

  // Get slash filter for dropdown
  const slashFilter = startsWithSlash(input) && !input.includes(' ') ? input : '';

  // Filter commands based on input
  const filteredCommands = SLASH_COMMANDS.filter(cmd =>
    cmd.command.toLowerCase().includes(slashFilter.toLowerCase()) ||
    cmd.label.toLowerCase().includes(slashFilter.toLowerCase())
  );

  // Show/hide commands dropdown
  useEffect(() => {
    setShowCommands(startsWithSlash(input) && !input.includes(' '));
    setSelectedIndex(0);
  }, [input]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  // Handle command selection
  const handleSelectCommand = (cmd: SlashCommand) => {
    setInput(cmd.command + ' ');
    setShowCommands(false);
    textareaRef.current?.focus();
  };

  // Custom submit that processes slash commands
  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading || !input.trim() || isOverLimit) return;

    // Process slash command before submitting
    const processedInput = processSlashCommand(input);
    setInput(processedInput);

    // Small delay to ensure state updates before submit
    setTimeout(() => {
      handleSubmit(e);
    }, 10);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Slash commands navigation
    if (showCommands && filteredCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        handleSelectCommand(filteredCommands[selectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowCommands(false);
        return;
      }
    }

    // Ctrl+Enter to submit
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (!isLoading && input.trim() && !isOverLimit) {
        handleFormSubmit(e as unknown as FormEvent<HTMLFormElement>);
      }
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="border-t p-3 lg:p-4 bg-background">
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          {/* Slash Commands Dropdown */}
          <SlashCommandsDropdown
            isOpen={showCommands}
            filter={slashFilter}
            onSelect={handleSelectCommand}
            selectedIndex={selectedIndex}
          />

          <Textarea
            ref={textareaRef}
            placeholder={isLoading ? "Procesando respuesta..." : "Escribe tu pregunta o usa /comando... (Ctrl+Enter para enviar)"}
            className="min-h-[44px] max-h-[150px] resize-none pr-16 text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={1}
          />
          <div className={`absolute bottom-2 right-2 text-[10px] ${isOverLimit ? 'text-destructive font-medium' : isNearLimit ? 'text-amber-500' : 'text-muted-foreground'}`}>
            {charCount.toLocaleString()}/{MAX_CHARS.toLocaleString()}
          </div>
        </div>
        <Button
          type="submit"
          size="icon"
          disabled={isLoading || !input.trim() || isOverLimit}
          className="h-11 w-11 shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <SendHorizontal className="h-5 w-5" />
          )}
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
        Usa <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] font-mono">/</kbd> para comandos ·
        <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] font-mono ml-1">Ctrl</kbd>+<kbd className="px-1 py-0.5 bg-muted rounded text-[9px] font-mono">Enter</kbd> enviar
      </p>
    </form>
  );
}


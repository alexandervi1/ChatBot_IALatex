/**
 * Chat Input Component
 * 
 * Provides a text input field with submit button for sending messages.
 * Features:
 * - Character counter with limit indicator
 * - Ctrl+Enter keyboard shortcut
 * - Loading states with visual feedback
 * - Responsive design
 */
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizontal, Loader2 } from 'lucide-react';
import { FormEvent, KeyboardEvent, useRef, useEffect } from 'react';

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
  const charCount = input.length;
  const isNearLimit = charCount > MAX_CHARS * 0.8;
  const isOverLimit = charCount > MAX_CHARS;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  // Handle Ctrl+Enter to submit
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (!isLoading && input.trim() && !isOverLimit) {
        handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-3 lg:p-4 bg-background">
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            placeholder={isLoading ? "Procesando respuesta..." : "Escribe tu pregunta aquí... (Ctrl+Enter para enviar)"}
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
        Presiona <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] font-mono">Ctrl</kbd>+<kbd className="px-1 py-0.5 bg-muted rounded text-[9px] font-mono">Enter</kbd> para enviar
      </p>
    </form>
  );
}

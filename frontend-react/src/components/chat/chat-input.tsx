/**
 * Chat Input Component
 * 
 * Provides a text input field with submit button for sending messages.
 * Handles form submission and loading states.
 */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SendHorizontal } from 'lucide-react';
import { FormEvent } from 'react';

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
  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t p-4">
      <Input type="text" placeholder="Escribe tu pregunta aquí..." className="flex-1" value={input} onChange={(e) => setInput(e.target.value)} disabled={isLoading} />
      <Button type="submit" size="icon" disabled={isLoading}><SendHorizontal className="h-5 w-5" /></Button>
    </form>
  );
}

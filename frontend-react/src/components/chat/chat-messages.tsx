/**
 * Chat Messages Component
 * 
 * Displays the conversation history with support for:
 * - User and AI message distinction
 * - Markdown rendering with syntax highlighting
 * - Feedback buttons (thumbs up/down)
 * - Regenerate response button
 * - Copy to clipboard functionality
 * - Source document accordion
 */
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChatMessage, submitFeedback } from "@/lib/api-client";
import { Check, Copy, ThumbsDown, ThumbsUp, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { TypingIndicator } from './typing-indicator';
import { useState } from 'react';
import { useToast } from '@/lib/hooks/use-toast';

/** Props for the ChatMessages component */
interface ChatMessagesProps {
  /** Array of chat messages to display */
  messages: ChatMessage[];
  /** Ref for auto-scrolling to latest message */
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  /** Index of message currently copied (for visual feedback) */
  copiedMessageIndex: number | null;
  /** Callback when user copies a message */
  handleCopy: (content: string, index: number) => void;
  /** Callback to regenerate an AI response */
  onRegenerate?: (userQuery: string) => void;
  /** Whether chat is loading */
  isLoading?: boolean;
}

export function ChatMessages({ messages, messagesEndRef, copiedMessageIndex, handleCopy, onRegenerate, isLoading }: ChatMessagesProps) {
  const [feedbackSent, setFeedbackSent] = useState<{ [key: number]: 'positive' | 'negative' | null }>({});
  const { toast } = useToast();

  const handleFeedback = async (index: number, feedbackType: 'positive' | 'negative') => {
    const aiMessage = messages[index];
    const userMessage = messages[index - 1];

    if (aiMessage.role !== 'ai' || userMessage?.role !== 'user') return;

    try {
      await submitFeedback({
        query: userMessage.content,
        answer: aiMessage.content,
        feedback_type: feedbackType,
      });
      setFeedbackSent(prev => ({ ...prev, [index]: feedbackType }));
      toast({ description: "¡Gracias por tu feedback!" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo enviar el feedback." });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="space-y-6">
        {messages.map((message, index) => (
          <div key={index} className="max-w-2xl">
            <p className={`font-bold ${message.role === 'user' ? 'text-amber-500' : 'text-primary'}`}>{message.role === 'user' ? 'Tú' : 'IA'}</p>
            <div className={`group relative whitespace-pre-wrap rounded-lg p-3 ${message.role === 'user' ? 'bg-secondary' : 'bg-muted'}`}>
              <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {message.role === 'ai' && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleFeedback(index, 'positive')} disabled={!!feedbackSent[index]}>
                          <ThumbsUp className={`h-4 w-4 ${feedbackSent[index] === 'positive' ? 'text-green-500' : ''}`} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Feedback Positivo</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleFeedback(index, 'negative')} disabled={!!feedbackSent[index]}>
                          <ThumbsDown className={`h-4 w-4 ${feedbackSent[index] === 'negative' ? 'text-red-500' : ''}`} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Feedback Negativo</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(message.content, index)}>{copiedMessageIndex === index ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Copiar</p></TooltipContent>
                    </Tooltip>
                    {onRegenerate && index > 0 && messages[index - 1]?.role === 'user' && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onRegenerate(messages[index - 1].content)}
                            disabled={isLoading}
                          >
                            <RotateCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Regenerar respuesta</p></TooltipContent>
                      </Tooltip>
                    )}
                  </TooltipProvider>
                )}
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {message.correctedQuery && (
                  <p className="text-sm text-muted-foreground italic">
                    Buscando en su lugar: "{message.correctedQuery}"
                  </p>
                )}
                {messages.length - 1 === index && message.role === 'ai' && !message.content ? (
                  <TypingIndicator />
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{message.content}</ReactMarkdown>
                )}
              </div>
              {message.role === 'ai' && message.source && (
                <Accordion type="single" collapsible className="mt-2">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Ver Fuente</AccordionTrigger>
                    <AccordionContent><div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: message.source.replace(/\n/g, '<br />') }} /></AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

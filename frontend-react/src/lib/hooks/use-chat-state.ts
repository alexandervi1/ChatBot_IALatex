'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/lib/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import {
    streamSearch,
    listDocuments,
    processFile,
    deleteDocument,
    streamCopilot,
    compilePdf,
    getSuggestedQuestions,
    DocumentMetadata,
    ChatMessage,
    SearchResponse,
} from '@/lib/api-client';

const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
];

/**
 * Custom hook that encapsulates all chat-related state and logic.
 * Separates concerns from the UI component for better testability and maintainability.
 */
export function useChatState() {
    const { user } = useAuth();
    const { toast } = useToast();

    // Chat state
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

    // Document state
    const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
    const [docSearchTerm, setDocSearchTerm] = useState('');
    const [uploadStatus, setUploadStatus] = useState('');
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // Copilot state
    const [copilotText, setCopilotText] = useState('');
    const [copilotInstruction, setCopilotInstruction] = useState('');
    const [pdfFile, setPdfFile] = useState<Blob | null>(null);
    const [previewStatus, setPreviewStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [previewError, setPreviewError] = useState<string | null>(null);

    // UI state
    const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isInitialMount = useRef(true);

    // Computed values
    const filteredDocuments = documents.filter(doc =>
        doc.source_file.toLowerCase().includes(docSearchTerm.toLowerCase())
    );

    // Fetch suggested questions when documents are selected
    useEffect(() => {
        if (selectedDocs.length > 0) {
            const timer = setTimeout(() => {
                getSuggestedQuestions(selectedDocs)
                    .then(setSuggestedQuestions)
                    .catch(err => console.error("Error fetching suggested questions:", err));
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setSuggestedQuestions([]);
        }
    }, [selectedDocs]);

    // Load chat history on mount
    useEffect(() => {
        const savedMessages = localStorage.getItem('chat_history');
        if (savedMessages) {
            setMessages(JSON.parse(savedMessages));
        } else {
            const greetingName = user?.full_name || user?.email || 'Usuario';
            setMessages([{ role: 'ai', content: `Hola ${greetingName}! Sube un documento y hazme una pregunta para comenzar.` }]);
        }
    }, [user]);

    // Save chat history on change
    useEffect(() => {
        if (!isInitialMount.current) {
            localStorage.setItem('chat_history', JSON.stringify(messages));
        } else {
            isInitialMount.current = false;
        }
    }, [messages]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Fetch documents
    const fetchDocuments = useCallback(async () => {
        if (!user) return;
        try {
            setDocuments(await listDocuments());
        } catch (error) {
            console.error('Error al cargar los documentos:', error);
            toast({ variant: "destructive", title: "Error de Red", description: "No se pudo cargar la lista de documentos." });
        }
    }, [user, toast]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    // WebSocket connection for real-time updates
    useEffect(() => {
        if (!user) return;

        const ws = new WebSocket(`ws://localhost:8000/ws/${user.id}`);

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.status === 'completed') {
                toast({ title: "Éxito", description: `'${data.filename}' procesado.` });
                fetchDocuments();
            }
        };

        return () => {
            ws.close();
        };
    }, [user, toast, fetchDocuments]);

    // File upload
    const uploadFile = useCallback(async (file: File) => {
        setUploadStatus(`Subiendo ${file.name}...`);
        try {
            await processFile(file);
            toast({ title: "Subida Exitosa", description: `'${file.name}' se está procesando en segundo plano.` });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "No se pudo subir el archivo.";
            toast({ variant: "destructive", title: "Error", description: errorMessage });
        } finally {
            setUploadStatus('');
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, [toast]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadFile(file);
    }, [uploadFile]);

    // Drag and drop handlers
    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            Array.from(files).forEach(file => {
                if (ALLOWED_FILE_TYPES.includes(file.type)) {
                    uploadFile(file);
                } else {
                    toast({ variant: "destructive", title: "Archivo no permitido", description: `El formato del archivo '${file.name}' no es soportado.` });
                }
            });
        }
    }, [uploadFile, toast]);

    // Chat actions
    const handleClearChat = useCallback(() => {
        const initial = [{ role: 'ai' as const, content: `Hola ${user?.email}! Sube un documento y hazme una pregunta para comenzar.` }];
        setMessages(initial);
        localStorage.setItem('chat_history', JSON.stringify(initial));
    }, [user]);

    const handleCopy = useCallback((content: string, index: number) => {
        navigator.clipboard.writeText(content).then(() => {
            setCopiedMessageIndex(index);
            setTimeout(() => setCopiedMessageIndex(null), 2000);
        });
    }, []);

    const handleExportChat = useCallback(() => {
        const formattedChat = messages.map(m => `**${m.role === 'user' ? 'Tú' : 'IA'}:**\n\n${m.content}`).join('\n\n---\n\n');
        const blob = new Blob([formattedChat], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `historial-chat-${new Date().toISOString()}.md`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ description: "Historial de chat exportado." });
    }, [messages, toast]);

    const handleUploadClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleDelete = useCallback(async (docId: number, sourceFile: string) => {
        setDeletingId(docId);
        try {
            await deleteDocument(sourceFile);
            await fetchDocuments();
            setSelectedDocs(prev => prev.filter(doc => doc !== sourceFile));
            toast({ description: `Documento '${sourceFile}' eliminado.` });
        } catch (err: any) {
            toast({ variant: "destructive", title: "Error", description: err.message || "No se pudo eliminar el documento." });
        } finally {
            setDeletingId(null);
        }
    }, [fetchDocuments, toast]);

    const handleDocSelectionChange = useCallback((filename: string, checked: boolean | string) => {
        setSelectedDocs(prev =>
            checked ? [...prev, filename] : prev.filter(doc => doc !== filename)
        );
    }, []);

    // Chat submission
    const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setMessages(prev => [...prev, { role: 'ai', content: '' }]);

        try {
            const stream = streamSearch({
                query: input,
                chat_history: messages,
                source_files: selectedDocs.length > 0 ? selectedDocs : undefined
            });
            let fullResponse = '', jsonBuffer = '', handlingJson = false;

            for await (const chunk of stream) {
                if (handlingJson) {
                    jsonBuffer += chunk;
                    continue;
                }
                if (chunk.includes('|||JSON_START|||')) {
                    const parts = chunk.split('|||JSON_START|||');
                    fullResponse += parts[0];
                    jsonBuffer = parts[1] || '';
                    handlingJson = true;
                } else {
                    fullResponse += chunk;
                }
                setMessages(prev => [...prev.slice(0, -1), { role: 'ai', content: fullResponse }]);
            }

            if (jsonBuffer) {
                const jsonData: SearchResponse = JSON.parse(jsonBuffer);
                if (jsonData.corrected_query) {
                    setMessages(prev => {
                        const last = prev[prev.length - 1];
                        return [...prev.slice(0, -1), { ...last, correctedQuery: jsonData.corrected_query }];
                    });
                }
                if (jsonData.highlighted_source) {
                    setMessages(prev => {
                        const last = prev[prev.length - 1];
                        return [...prev.slice(0, -1), { ...last, source: jsonData.highlighted_source }];
                    });
                }
            }
        } catch (err: any) {
            const msg = 'Lo siento, ocurrió un error al contactar la API.';
            setMessages(prev => [...prev.slice(0, -1), { role: 'ai', content: msg }]);
            toast({ variant: "destructive", title: "Error de Red", description: err.message || "No se pudo comunicar con el backend." });
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, messages, selectedDocs, toast]);

    // Copilot actions
    const handleCopilotSubmit = useCallback(async () => {
        if (!copilotInstruction.trim() || isLoading) return;

        setIsLoading(true);
        let fullResponse = '';
        try {
            const stream = streamCopilot({
                text: copilotText,
                instruction: copilotInstruction,
                source_files: selectedDocs.length > 0 ? selectedDocs : undefined
            });
            for await (const chunk of stream) {
                fullResponse += chunk;
                setCopilotText(fullResponse);
            }
        } catch (err: any) {
            toast({ variant: "destructive", title: "Error de Copiloto", description: err.message || "No se pudo generar la respuesta." });
        } finally {
            setIsLoading(false);
            setCopilotInstruction('');
        }
    }, [copilotInstruction, copilotText, isLoading, selectedDocs, toast]);

    const handlePdfPreview = useCallback(async () => {
        setIsLoading(true);
        setPreviewStatus('loading');
        setPreviewError(null);
        try {
            const blob = await compilePdf({ text: copilotText, instruction: '' });
            setPdfFile(blob);
            setPreviewStatus('success');
            toast({ description: "Vista previa del PDF actualizada." });
        } catch (err: any) {
            setPreviewError(err.message || "Error desconocido al compilar el PDF.");
            setPreviewStatus('error');
            toast({ variant: "destructive", title: "Error de Compilación", description: "No se pudo generar la vista previa." });
        } finally {
            setIsLoading(false);
        }
    }, [copilotText, toast]);

    const handlePdfDownload = useCallback(async () => {
        setIsLoading(true);
        try {
            const blob = await compilePdf({ text: copilotText, instruction: '' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `documento-${new Date().toISOString()}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
            toast({ description: "PDF descargado exitosamente." });
        } catch (err: any) {
            toast({ variant: "destructive", title: "Error de Compilación", description: err.message || "No se pudo generar el PDF." });
        } finally {
            setIsLoading(false);
        }
    }, [copilotText, toast]);

    return {
        // User
        user,

        // Chat state
        messages,
        input,
        setInput,
        isLoading,
        suggestedQuestions,
        copiedMessageIndex,

        // Document state
        documents: filteredDocuments,
        selectedDocs,
        docSearchTerm,
        setDocSearchTerm,
        uploadStatus,
        deletingId,

        // Copilot state
        copilotText,
        setCopilotText,
        copilotInstruction,
        setCopilotInstruction,
        pdfFile,
        previewStatus,
        previewError,
        setPreviewError,

        // Drag state
        isDragging,

        // Refs
        fileInputRef,
        messagesEndRef,

        // Handlers
        fetchDocuments,
        handleFileChange,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        handleClearChat,
        handleCopy,
        handleExportChat,
        handleUploadClick,
        handleDelete,
        handleDocSelectionChange,
        handleSubmit,
        handleCopilotSubmit,
        handlePdfPreview,
        handlePdfDownload,

        // Constants
        ALLOWED_FILE_TYPES,
    };
}

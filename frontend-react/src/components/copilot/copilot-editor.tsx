import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import Editor, { OnMount } from '@monaco-editor/react';
import { Panel, PanelGroup, PanelResizeHandle, ImperativePanelHandle } from 'react-resizable-panels';
import { pdfjs } from 'react-pdf';
import { useState, useEffect, useRef, useCallback } from 'react';
import { latexTemplates, LaTeXTemplate } from '@/lib/latex-templates';
import { registerLatexCompletions } from '@/lib/latex-completions';
import { streamCopilot } from '@/lib/api-client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from "@/lib/hooks/use-toast";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { generateCitation, parseCitationInput, generateBibTeXEntry } from '@/lib/citation-utils';
import { PdfPreview } from './pdf-preview';
import { EditorToolbar } from './editor-toolbar';
import { EditorSidebar } from './editor-sidebar';
import { Loader2, Wand2 } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface CopilotEditorProps {
  text: string;
  setText: (value: string) => void;
  instruction: string;
  setInstruction: (value: string) => void;
  handleSubmit: () => void;
  handleDownload: () => void;
  handlePreview: () => void;
  pdfFile: Blob | null;
  previewStatus: 'idle' | 'loading' | 'success' | 'error';
  previewError: string | null;
  setPreviewError: (error: string | null) => void;
  isLoading: boolean;
}

export function CopilotEditor({ text, setText, instruction, setInstruction, handleSubmit, handleDownload, handlePreview, pdfFile, previewStatus, previewError, setPreviewError, isLoading }: CopilotEditorProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [customTemplates, setCustomTemplates] = useState<LaTeXTemplate[]>([]);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  // Citation Dialog State
  const [isCitationDialogOpen, setIsCitationDialogOpen] = useState(false);
  const [citationFormat, setCitationFormat] = useState<'APA' | 'IEEE' | 'Chicago' | 'MLA' | 'BibTeX'>('APA');
  const [citationInput, setCitationInput] = useState('');

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Closed by default (Minimalist)
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);
  const [zoomLevel, setZoomLevel] = useState<number | 'auto' | 'page-fit'>('auto');

  const { toast } = useToast();
  const isMobile = useMediaQuery('(max-width: 767px)');

  const editorInstanceRef = useRef<any>(null);
  const pdfPreviewRef = useRef<HTMLDivElement>(null);
  const sidebarPanelRef = useRef<ImperativePanelHandle>(null);
  const previewPanelRef = useRef<ImperativePanelHandle>(null);
  const isSyncing = useRef(false);

  // --- Layout Management ---

  const toggleSidebar = () => {
    const sidebar = sidebarPanelRef.current;
    if (sidebar) {
      if (isSidebarOpen) {
        sidebar.collapse();
      } else {
        sidebar.resize(20); // Expand to 20%
      }
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  const togglePreview = () => {
    const preview = previewPanelRef.current;
    if (preview) {
      if (isPreviewOpen) {
        preview.collapse();
      } else {
        preview.resize(40); // Restore to ~40%
      }
      setIsPreviewOpen(!isPreviewOpen);
    }
  };

  // --- Events & Listeners ---

  // Listen for navigation/insert events (from new Sidebar components)
  // Note: We pass handlers directly to EditorSidebar, but if we keep custom events for decoupling:
  // We'll reimplement direct handlers for simplicity in the new architecture.

  const handleNavigateToLine = (line: number) => {
    if (editorInstanceRef.current) {
      editorInstanceRef.current.revealLineInCenter(line);
      editorInstanceRef.current.setPosition({ lineNumber: line, column: 1 });
      editorInstanceRef.current.focus();
    }
  };

  const handleInsertSymbol = (latex: string) => {
    if (editorInstanceRef.current) {
      const editor = editorInstanceRef.current;
      const position = editor.getPosition();
      editor.executeEdits('symbol', [{
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        },
        text: latex,
        forceMoveMarkers: true
      }]);
      editor.focus();
    }
  };


  useEffect(() => {
    const savedTemplates = localStorage.getItem('custom_latex_templates');
    if (savedTemplates) {
      setCustomTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  useEffect(() => {
    if (previewError) {
      setPreviewError(null);
    }
  }, [text, setPreviewError]);

  const previousScrollTop = useRef<number>(0);

  function onDocumentLoadSuccess(numPages: number) {
    setNumPages(numPages);
    // Restore scroll position after reload
    if (pdfPreviewRef.current && previousScrollTop.current > 0) {
      setTimeout(() => {
        if (pdfPreviewRef.current) {
          pdfPreviewRef.current.scrollTop = previousScrollTop.current;
        }
      }, 100);
    }
  }

  // --- Actions ---

  const handleSaveTemplate = () => {
    if (newTemplateName.trim() === '') {
      toast({
        title: "Error",
        description: "El nombre de la plantilla no puede estar vacío.",
        variant: "destructive",
      });
      return;
    }
    const newTemplate: LaTeXTemplate = {
      name: newTemplateName,
      category: "Custom",
      description: "Plantilla personalizada",
      content: text,
    };
    const updatedTemplates = [...customTemplates, newTemplate];
    setCustomTemplates(updatedTemplates);
    localStorage.setItem('custom_latex_templates', JSON.stringify(updatedTemplates));
    setNewTemplateName('');
    setIsSaveDialogOpen(false);
    toast({
      title: "Éxito",
      description: `Plantilla "${newTemplateName}" guardada.`,
    });
  };

  const handleGenerateCitation = () => {
    // (Reusable logic extracted or kept here)
    // For brevity, using the same logic as before but linked to toolbar
    // ... [Dependencies like parseCitationInput needed]
    // We'll reopen the dialog to let user input data
    setIsCitationDialogOpen(true);
  };

  const executeCitationInsert = () => {
    if (citationInput.trim() === '') {
      toast({ title: "Error", description: "Ingresa información de la cita.", variant: "destructive" });
      return;
    }
    const parsedData = parseCitationInput(citationInput);

    if (citationFormat === 'BibTeX') {
      const bibEntry = generateBibTeXEntry(parsedData);
      const keyMatch = bibEntry.match(/@\w+{([^,]+),/);
      const key = keyMatch ? keyMatch[1] : 'citation';
      const citeCmd = `\\cite{${key}}`;

      if (editorInstanceRef.current) {
        const editor = editorInstanceRef.current;
        const position = editor.getPosition();
        editor.executeEdits('citation', [{
          range: {
            startLineNumber: position.lineNumber, startColumn: position.column,
            endLineNumber: position.lineNumber, endColumn: position.column
          },
          text: citeCmd, forceMoveMarkers: true
        }]);

        // Append entry
        const model = editor.getModel();
        const lineCount = model.getLineCount();
        const lastLineLength = model.getLineMaxColumn(lineCount);
        editor.executeEdits('append-bib', [{
          range: {
            startLineNumber: lineCount, startColumn: lastLineLength,
            endLineNumber: lineCount, endColumn: lastLineLength
          },
          text: `\n\n${bibEntry}\n`, forceMoveMarkers: true
        }]);
      } else {
        setText(text + citeCmd + `\n\n${bibEntry}\n`);
      }
      toast({ title: "Cita BibTeX generada", description: `Se insertó \\cite{${key}} y la entrada bibliográfica.` });
    } else {
      const citation = generateCitation(parsedData, citationFormat);
      if (editorInstanceRef.current) {
        const editor = editorInstanceRef.current;
        const position = editor.getPosition();
        editor.executeEdits('citation', [{
          range: {
            startLineNumber: position.lineNumber, startColumn: position.column,
            endLineNumber: position.lineNumber, endColumn: position.column
          },
          text: citation, forceMoveMarkers: true
        }]);
      } else {
        setText(text + '\n' + citation);
      }
      toast({ title: "Cita generada", description: `Formato: ${citationFormat}` });
    }
    setIsCitationDialogOpen(false);
    setCitationInput('');
  };


  const handleAiAction = async (action: string) => {
    let prompt = "";
    switch (action) {
      case 'improve': prompt = "Reescribe este texto con un tono académico, formal y claro para un paper científico en LaTeX. Corrige gramática y estilo."; break;
      case 'translate': prompt = "Traduce este texto al inglés académico para un paper científico."; break;
      case 'summarize': prompt = "Resume este texto en un párrafo conciso pero completo, manteniendo los puntos clave. Formato académico."; break;
      case 'grammar': prompt = "Corrige estrictamente la gramática y ortografía de este texto sin cambiar el estilo."; break;
      case 'expand': prompt = "Expande este texto añadiendo más detalles, ejemplos y argumentos. Mantén el tono académico."; break;
      case 'fix-latex': prompt = "Corrige cualquier error de sintaxis LaTeX en este código. Solo devuelve el código corregido."; break;
      default: return;
    }

    if (editorInstanceRef.current) {
      await handleContextualAction(editorInstanceRef.current, prompt);
    } else {
      toast({ title: "Error", description: "Editor no cargado", variant: "destructive" });
    }
  };

  const handleContextualAction = async (editor: any, instruction: string) => {
    const selection = editor.getSelection();
    const model = editor.getModel();
    const selectedText = model.getValueInRange(selection);

    if (!selectedText || selectedText.trim() === "") {
      toast({ title: "Info", description: "Selecciona texto primero para usar esta función.", variant: "default" });
      return;
    }

    const toastId = toast({ title: "IA Trabajando...", description: "Procesando solicitud..." });

    try {
      let fullResponse = "";
      const stream = streamCopilot({
        text: selectedText,
        instruction: instruction,
        source_files: []
      });

      for await (const chunk of stream) {
        fullResponse += chunk;
      }

      editor.executeEdits("copilot", [{
        range: selection,
        text: fullResponse,
        forceMoveMarkers: true
      }]);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Fallo al procesar solicitud IA", variant: "destructive" });
    }
  };

  // --- Editor Mount ---

  const completionsRegistered = useRef(false);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorInstanceRef.current = editor;

    if (!completionsRegistered.current) {
      registerLatexCompletions(monaco);
      completionsRegistered.current = true;
    }

    // Context Menu Actions (Preserved per user request)
    editor.addAction({
      id: 'improve-writing', label: '✨ Mejorar Redacción', contextMenuGroupId: 'navigation', contextMenuOrder: 1,
      run: (ed: any) => handleAiAction('improve')
    });

    editor.addAction({
      id: 'translate-en', label: '🇺🇸 Traducir a Inglés', contextMenuGroupId: 'navigation', contextMenuOrder: 2,
      run: (ed: any) => handleAiAction('translate')
    });

    editor.addAction({
      id: 'fix-latex', label: '🔧 Corregir Código LaTeX', contextMenuGroupId: 'navigation', contextMenuOrder: 3,
      run: (ed: any) => handleAiAction('fix-latex')
    });

    editor.addAction({
      id: 'summarize', label: '📝 Resumir Sección', contextMenuGroupId: 'navigation', contextMenuOrder: 4,
      run: (ed: any) => handleAiAction('summarize')
    });

    editor.addAction({
      id: 'expand', label: '📚 Expandir Párrafo', contextMenuGroupId: 'navigation', contextMenuOrder: 5,
      run: (ed: any) => handleAiAction('expand')
    });

    editor.addAction({
      id: 'grammar', label: '✅ Corregir Gramática', contextMenuGroupId: 'navigation', contextMenuOrder: 6,
      run: (ed: any) => handleAiAction('grammar')
    });

    // Sync Scroll
    editor.onDidScrollChange((e: { scrollTop: number; scrollHeight: number }) => {
      if (!pdfPreviewRef.current || isSyncing.current) return;
      const scrollPercentage = e.scrollTop / (e.scrollHeight - editor.getLayoutInfo().height);
      isSyncing.current = true;
      const pdfPreview = pdfPreviewRef.current;
      pdfPreview.scrollTop = scrollPercentage * (pdfPreview.scrollHeight - pdfPreview.clientHeight);
      setTimeout(() => { isSyncing.current = false; }, 100);
    });
  };

  const handlePdfScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const pdfPreview = event.currentTarget;
    previousScrollTop.current = pdfPreview.scrollTop;
    const editor = editorInstanceRef.current;
    if (!editor || isSyncing.current) return;
    const scrollPercentage = pdfPreview.scrollTop / (pdfPreview.scrollHeight - pdfPreview.clientHeight);
    isSyncing.current = true;
    editor.setScrollTop(scrollPercentage * (editor.getScrollHeight() - editor.getLayoutInfo().height));
    setTimeout(() => { isSyncing.current = false; }, 100);
  };

  // --- Rendering ---

  return (
    <div className="flex flex-col h-full bg-background">
      {/* 1. Unified Toolbar */}
      <EditorToolbar
        onSaveTemplate={() => setIsSaveDialogOpen(true)}
        onDownloadPdf={handleDownload}
        onCompile={handlePreview}
        onDownloadSource={() => {
          const blob = new Blob([text], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'document.tex';
          a.click();
        }}
        onInsertCitation={() => setIsCitationDialogOpen(true)}
        onToggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
        onTogglePreview={togglePreview}
        isPreviewOpen={isPreviewOpen}
        onAiAction={handleAiAction}
        zoomLevel={zoomLevel}
        onZoomChange={setZoomLevel}
        onUndo={() => editorInstanceRef.current?.trigger('api', 'undo', null)}
        onRedo={() => editorInstanceRef.current?.trigger('api', 'redo', null)}
        onFormat={() => editorInstanceRef.current?.getAction('editor.action.formatDocument').run()}
      />

      {/* 2. Main 3-Panel Layout */}
      <div className="flex-1 min-h-0 relative">
        <PanelGroup direction={isMobile ? "vertical" : "horizontal"} className="h-full">

          {/* Left Panel: Sidebar (Collapsible) */}
          <Panel
            ref={sidebarPanelRef}
            defaultSize={0} // Start Hidden
            minSize={15}
            maxSize={25}
            collapsible={true}
            collapsedSize={0}
            onCollapse={() => setIsSidebarOpen(false)}
            onExpand={() => setIsSidebarOpen(true)}
            className={isSidebarOpen ? "" : "hidden"} // Force hide via class when collapsedSize=0 to avoid borders
          >
            <EditorSidebar
              text={text}
              onNavigate={handleNavigateToLine}
              onInsertSymbol={handleInsertSymbol}
            />
          </Panel>

          {isSidebarOpen && <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />}

          {/* Middle Panel: Code Editor */}
          <Panel minSize={30}>
            <div className="h-full relative flex flex-col">
              <Editor
                height="100%"
                defaultLanguage="latex"
                theme="vs-dark"
                value={text}
                onChange={(value) => setText(value || '')}
                onMount={handleEditorDidMount}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on',
                  padding: { top: 16 },
                  automaticLayout: true,
                }}
              />
              {/* Status Bar Overlay or Separate? Let's use AI bar at bottom */}
              <div className="absolute bottom-4 left-4 right-4 z-10 flex gap-2">
                {/* Floating AI Input */}
                <div className="flex-1 max-w-2xl mx-auto bg-background/80 backdrop-blur border rounded-full shadow-lg p-1 flex items-center px-3 ring-1 ring-border focus-within:ring-primary transition-all">
                  <Wand2 className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
                  <input
                    className="flex-1 bg-transparent border-none outline-none text-sm h-8 placeholder:text-muted-foreground/50"
                    placeholder="Instrucción IA (ej: 'Resume esto', 'Crea una tabla')..."
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    disabled={isLoading}
                  />
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary ml-2" />}
                </div>
              </div>
            </div>
          </Panel>

          {isPreviewOpen && <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />}

          {/* Right Panel: Preview */}
          <Panel
            ref={previewPanelRef}
            defaultSize={40}
            minSize={20}
            collapsible={true}
            collapsedSize={0}
            onCollapse={() => setIsPreviewOpen(false)}
            className={isPreviewOpen ? "bg-secondary/30" : "hidden"}
          >
            <div className="h-full flex flex-col">
              <div className="h-full overflow-hidden">
                {/* Pass zoomLevel if PdfPreview supported it, for now mostly auto-width via flex */}
                <PdfPreview
                  ref={pdfPreviewRef}
                  pdfFile={pdfFile}
                  previewStatus={previewStatus}
                  previewError={previewError}
                  numPages={numPages}
                  onDocumentLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={(error) => setPreviewError(error)}
                  onScroll={handlePdfScroll}
                  zoomLevel={zoomLevel}
                />
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Dialogs */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Guardar Plantilla</DialogTitle></DialogHeader>
          <Input value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} placeholder="Nombre..." />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsSaveDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveTemplate}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Re-implement Citation Dialog logic inside or keep simple */}
      <Dialog open={isCitationDialogOpen} onOpenChange={setIsCitationDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cita Bibliográfica</DialogTitle>
            <DialogDescription>Genera citas en formato BibTeX o estándar.</DialogDescription>
          </DialogHeader>
          {/* Reusing the UI from previous simple implementation, but ideally would be a component */}
          <div className="space-y-4 py-2">
            {/* ... (Select and Textarea logic mapped to state) ... */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Formato</label>
              <select
                className="w-full border rounded p-2 text-sm bg-background"
                value={citationFormat}
                onChange={(e: any) => setCitationFormat(e.target.value)}
              >
                <option value="APA">APA 7th</option>
                <option value="BibTeX">BibTeX (Recomendado)</option>
                <option value="IEEE">IEEE</option>
                <option value="MLA">MLA</option>
              </select>
            </div>
            <textarea
              className="w-full border rounded p-2 text-sm bg-background min-h-[100px]"
              placeholder="Datos de la fuente..."
              value={citationInput}
              onChange={(e) => setCitationInput(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCitationDialogOpen(false)}>Cancelar</Button>
            <Button onClick={executeCitationInsert}>Insertar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

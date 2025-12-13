import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Wand2, Download, Eye, Loader2, AlertTriangle, BookMarked, Save, Quote, BarChart } from 'lucide-react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Document, Page, pdfjs } from 'react-pdf';
import { useState, useEffect, useRef } from 'react';
import { latexTemplates, LaTeXTemplate } from '@/lib/latex-templates';
import { streamCopilot } from '@/lib/api-client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from "@/lib/hooks/use-toast";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { generateCitation, parseCitationInput, type CitationFormat } from '@/lib/citation-utils';

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
  const [isCitationDialogOpen, setIsCitationDialogOpen] = useState(false);
  const [citationFormat, setCitationFormat] = useState<'APA' | 'IEEE' | 'Chicago' | 'MLA'>('APA');
  const [citationInput, setCitationInput] = useState('');
  const { toast } = useToast();
  const isMobile = useMediaQuery('(max-width: 767px)');

  const editorInstanceRef = useRef<any>(null);
  const pdfPreviewRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  // Document statistics
  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const charCount = text.length;
  const lineCount = text.split('\n').length;

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

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const handleTemplateSelect = (template: LaTeXTemplate) => {
    if (text.trim() !== '') {
      const confirmed = window.confirm(`¿Estás seguro de que quieres reemplazar el contenido actual con la plantilla "${template.name}"?`);
      if (!confirmed) {
        return;
      }
    }
    setText(template.content);
  };

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
    if (citationInput.trim() === '') {
      toast({ title: "Error", description: "Ingresa información de la cita.", variant: "destructive" });
      return;
    }

    const parsedData = parseCitationInput(citationInput);
    const citation = generateCitation(parsedData, citationFormat);

    if (editorInstanceRef.current) {
      const editor = editorInstanceRef.current;
      const position = editor.getPosition();

      editor.executeEdits('citation', [{
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        },
        text: citation,
        forceMoveMarkers: true
      }]);
    } else {
      // Fallback: append to end
      setText(text + '\n' + citation);
    }

    setIsCitationDialogOpen(false);
    setCitationInput('');
    toast({ title: "Cita generada", description: `Formato: ${citationFormat}` });
  };

  const handleContextualAction = async (editor: any, instruction: string) => {
    const selection = editor.getSelection();
    const model = editor.getModel();
    const selectedText = model.getValueInRange(selection);

    if (!selectedText || selectedText.trim() === "") {
      toast({ title: "Info", description: "Selecciona texto primero para usar esta función.", variant: "default" });
      return;
    }

    toast({ title: "IA Trabajando...", description: "Procesando tu solicitud..." });

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

      // toast({ title: "Listo", description: "Texto actualizado." }); // Optional: clear toast or show success

    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "No se pudo procesar la solicitud.", variant: "destructive" });
    }
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorInstanceRef.current = editor;

    // Add Context Menu Actions
    editor.addAction({
      id: 'improve-writing',
      label: '✨ Mejorar Redacción (Académico)',
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1,
      run: (ed: any) => handleContextualAction(ed, "Reescribe este texto con un tono académico, formal y claro para un paper científico en LaTeX. Corrige gramática y estilo.")
    });

    editor.addAction({
      id: 'translate-en',
      label: '🇺🇸 Traducir a Inglés',
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 2,
      run: (ed: any) => handleContextualAction(ed, "Traduce este texto al inglés académico para un paper científico.")
    });

    editor.addAction({
      id: 'fix-latex',
      label: '🔧 Corregir Código LaTeX',
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 3,
      run: (ed: any) => handleContextualAction(ed, "Corrige cualquier error de sintaxis LaTeX en este código. Solo devuelve el código corregido.")
    });

    // NEW: Academic Actions
    editor.addAction({
      id: 'summarize',
      label: '📝 Resumir Sección',
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 4,
      run: (ed: any) => handleContextualAction(ed, "Resume este texto en un párrafo conciso pero completo, manteniendo los puntos clave. Formato académico.")
    });

    editor.addAction({
      id: 'expand',
      label: '📚 Expandir Párrafo',
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 5,
      run: (ed: any) => handleContextualAction(ed, "Expande este texto añadiendo más detalles, ejemplos y argumentos. Mantén el tono académico.")
    });

    // Helper function to wrap selection with LaTeX commands
    const wrapSelection = (prefix: string, suffix: string) => {
      const selection = editor.getSelection();
      if (!selection) return;

      const model = editor.getModel();
      if (!model) return;

      const selectedText = model.getValueInRange(selection);
      const newText = prefix + selectedText + suffix;

      editor.executeEdits('keyboard', [{
        range: selection,
        text: newText,
        forceMoveMarkers: true
      }]);

      // Move cursor after inserted text
      const endPos = selection.getEndPosition();
      editor.setPosition({ lineNumber: endPos.lineNumber, column: endPos.column + prefix.length + selectedText.length + suffix.length });
    };

    // Keyboard Shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
      wrapSelection('\\textbf{', '}');
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
      wrapSelection('\\textit{', '}');
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyE, () => {
      const selection = editor.getSelection();
      if (!selection) return;

      const model = editor.getModel();
      if (!model) return;

      const selectedText = model.getValueInRange(selection);
      const newText = '\\begin{equation}\n' + selectedText + '\n\\end{equation}';

      editor.executeEdits('keyboard', [{
        range: selection,
        text: newText,
        forceMoveMarkers: true
      }]);
    });

    editor.onDidScrollChange((e) => {
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
    const editor = editorInstanceRef.current;
    if (!editor || isSyncing.current) return;

    const scrollPercentage = pdfPreview.scrollTop / (pdfPreview.scrollHeight - pdfPreview.clientHeight);

    isSyncing.current = true;
    editor.setScrollTop(scrollPercentage * (editor.getScrollHeight() - editor.getLayoutInfo().height));

    setTimeout(() => { isSyncing.current = false; }, 100);
  };

  const PreviewContent = () => {
    switch (previewStatus) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Loader2 className="h-12 w-12 animate-spin mb-4" />
            <p>Compilando PDF...</p>
          </div>
        );
      case 'error':
        return (
          <div className="flex flex-col items-center justify-center h-full text-destructive p-4">
            <AlertTriangle className="h-12 w-12 mb-4" />
            <h3 className="font-semibold text-lg mb-2">Error de Compilación</h3>
            <pre className="text-xs whitespace-pre-wrap bg-destructive/10 p-2 rounded-md w-full text-left">{previewError}</pre>
          </div>
        );
      case 'success':
        if (pdfFile) {
          return (
            <Document
              file={pdfFile}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(error) => setPreviewError(`Error al cargar el PDF: ${error.message}`)}
            >
              {Array.from(new Array(numPages), (el, index) => (
                <Page
                  key={`page_${index + 1}`}
                  pageNumber={index + 1}
                  renderTextLayer={false}
                  width={pdfPreviewRef.current?.clientWidth ? pdfPreviewRef.current.clientWidth - 32 : undefined}
                />
              ))}
            </Document>
          );
        }
        return null;
      case 'idle':
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Eye className="h-12 w-12 mb-4" />
            <p>Haz clic en "Compilar" para generar la vista previa.</p>
          </div>
        );
    }
  };

  return (
    <>
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guardar Plantilla</DialogTitle>
            <DialogDescription>
              Ingresa un nombre para tu nueva plantilla.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            placeholder="Nombre de la plantilla"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsSaveDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveTemplate}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Citation Generator Dialog */}
      <Dialog open={isCitationDialogOpen} onOpenChange={setIsCitationDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Generador de Citas Académicas</DialogTitle>
            <DialogDescription>
              Ingresa los datos de la publicación y selecciona el formato.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Formato de Cita</label>
              <Select value={citationFormat} onValueChange={(value: any) => setCitationFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APA">APA 7th (Psicología, Educación)</SelectItem>
                  <SelectItem value="IEEE">IEEE (Ingeniería, Computación)</SelectItem>
                  <SelectItem value="Chicago">Chicago (Humanidades)</SelectItem>
                  <SelectItem value="MLA">MLA (Literatura, Artes)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Información de la Publicación</label>
              <Textarea
                value={citationInput}
                onChange={(e) => setCitationInput(e.target.value)}
                placeholder="Autor(es), año, título, revista/libro, etc.&#10;Ejemplo: Smith, J. (2024). Research Paper. Journal Name, 10, 1-15."
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                Tip: Puedes pegar un texto o DOI, el sistema intentará extraer la información.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCitationDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleGenerateCitation}>
              <Quote className="mr-2 h-4 w-4" />
              Generar Cita
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PanelGroup direction={isMobile ? "vertical" : "horizontal"} className="h-full">
        <Panel defaultSize={50} minSize={30}>
          <div className="flex flex-col h-full p-2 md:p-4 gap-2 md:gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-base md:text-lg font-semibold">Editor LaTeX</h3>
              <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs md:text-sm">
                      <BookMarked className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                      <span className="hidden sm:inline">Plantillas</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto">
                    {/* Academic Templates */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      Académicas
                    </div>
                    {latexTemplates
                      .filter(t => t.category === "Academic")
                      .map((template) => (
                        <DropdownMenuItem
                          key={template.name}
                          onSelect={() => handleTemplateSelect(template)}
                          className="flex flex-col items-start py-2"
                        >
                          <div className="font-medium">{template.name}</div>
                          <div className="text-xs text-muted-foreground">{template.description}</div>
                        </DropdownMenuItem>
                      ))}

                    <DropdownMenuSeparator />

                    {/* Professional Templates */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      Profesionales
                    </div>
                    {latexTemplates
                      .filter(t => t.category === "Professional")
                      .map((template) => (
                        <DropdownMenuItem
                          key={template.name}
                          onSelect={() => handleTemplateSelect(template)}
                          className="flex flex-col items-start py-2"
                        >
                          <div className="font-medium">{template.name}</div>
                          <div className="text-xs text-muted-foreground">{template.description}</div>
                        </DropdownMenuItem>
                      ))}

                    <DropdownMenuSeparator />

                    {/* Reports & Books */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      Reportes y Libros
                    </div>
                    {latexTemplates
                      .filter(t => t.category === "Reports & Books")
                      .map((template) => (
                        <DropdownMenuItem
                          key={template.name}
                          onSelect={() => handleTemplateSelect(template)}
                          className="flex flex-col items-start py-2"
                        >
                          <div className="font-medium">{template.name}</div>
                          <div className="text-xs text-muted-foreground">{template.description}</div>
                        </DropdownMenuItem>
                      ))}

                    <DropdownMenuSeparator />

                    {/* Presentations */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      Presentaciones
                    </div>
                    {latexTemplates
                      .filter(t => t.category === "Presentations")
                      .map((template) => (
                        <DropdownMenuItem
                          key={template.name}
                          onSelect={() => handleTemplateSelect(template)}
                          className="flex flex-col items-start py-2"
                        >
                          <div className="font-medium">{template.name}</div>
                          <div className="text-xs text-muted-foreground">{template.description}</div>
                        </DropdownMenuItem>
                      ))}

                    {customTemplates.length > 0 && <DropdownMenuSeparator />}

                    {/* Custom Templates */}
                    {customTemplates.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          Mis Plantillas
                        </div>
                        {customTemplates.map((template, index) => (
                          <DropdownMenuItem
                            key={template.name}
                            onSelect={(e) => {
                              e.preventDefault();
                            }}
                            className="flex items-center justify-between py-2"
                          >
                            <div
                              className="flex flex-col items-start flex-1 cursor-pointer"
                              onClick={() => handleTemplateSelect(template)}
                            >
                              <div className="font-medium">{template.name}</div>
                              {template.description && (
                                <div className="text-xs text-muted-foreground">{template.description}</div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`¿Eliminar plantilla "${template.name}"?`)) {
                                  const updated = customTemplates.filter((_, i) => i !== index);
                                  setCustomTemplates(updated);
                                  localStorage.setItem('custom_latex_templates', JSON.stringify(updated));
                                  toast({ title: "Plantilla eliminada" });
                                }
                              }}
                            >
                              🗑️
                            </Button>
                          </DropdownMenuItem>
                        ))}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="sm" className="text-xs md:text-sm" onClick={() => setIsSaveDialogOpen(true)}>
                  <Save className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                  <span className="hidden md:inline">Guardar</span>
                </Button>
                <Button variant="outline" size="sm" className="text-xs md:text-sm" onClick={() => setIsCitationDialogOpen(true)}>
                  <Quote className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                  <span className="hidden md:inline">Cita</span>
                </Button>
                <Button onClick={handlePreview} disabled={isLoading} size="sm" variant="outline" className="text-xs md:text-sm">
                  <Eye className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                  <span className="hidden lg:inline">Compilar</span>
                </Button>
              </div>
            </div>

            {/* Document Statistics Bar */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-b py-2">
              <div className="flex items-center gap-1">
                <BarChart className="h-3 w-3" />
                <span className="font-medium">{wordCount}</span> palabras
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">{lineCount}</span> líneas
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">{charCount}</span> caracteres
              </div>
            </div>
            <div className="relative flex-grow h-full overflow-hidden border rounded-md">
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
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Ej: 'Crea un resumen del documento X', 'Expande el párrafo anterior', 'Corrige la gramática'..."
                className="flex-1"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
              <Button onClick={handleSubmit} disabled={isLoading} size="icon">
                <Wand2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </Panel>
        <PanelResizeHandle className={isMobile ? "h-2 bg-border hover:bg-primary transition-colors" : "w-2 bg-border hover:bg-primary transition-colors"} />
        <Panel defaultSize={50}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-2 md:p-4 border-b">
              <h3 className="text-sm md:text-lg font-semibold">Vista Previa</h3>
              <Button onClick={handleDownload} disabled={!pdfFile || isLoading} size="sm" variant="outline" className="text-xs md:text-sm">
                <Download className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                <span className="hidden md:inline">Descargar PDF</span>
              </Button>
            </div>
            <div ref={pdfPreviewRef} onScroll={handlePdfScroll} className="h-full overflow-y-auto bg-secondary p-4">
              <PreviewContent />
            </div>
          </div>
        </Panel>
      </PanelGroup>
    </>
  );
}

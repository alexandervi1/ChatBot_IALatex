import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
    Save,
    FileDown,
    FileCode,
    Undo,
    Redo,
    AlignLeft,
    Quote,
    Sigma,
    Image as ImageIcon,
    Table as TableIcon,
    Sparkles,
    Languages,
    FileText,
    ScanText,
    Eye,
    List,
    ZoomIn,
    ChevronDown,
    Wand2
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface EditorToolbarProps {
    onSaveTemplate: () => void;
    onDownloadPdf: () => void;
    onDownloadSource: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    onFormat?: () => void;
    onInsertCitation: () => void;
    onToggleSidebar: () => void;
    isSidebarOpen: boolean;
    onTogglePreview: () => void;
    isPreviewOpen: boolean;
    onAiAction: (action: string) => void;
    zoomLevel: number | 'auto' | 'page-fit';
    onZoomChange: (level: number | 'auto' | 'page-fit') => void;
}

export function EditorToolbar({
    onSaveTemplate,
    onDownloadPdf,
    onDownloadSource,
    onUndo,
    onRedo,
    onFormat,
    onInsertCitation,
    onToggleSidebar,
    isSidebarOpen,
    onTogglePreview,
    isPreviewOpen,
    onAiAction,
    zoomLevel,
    onZoomChange,
}: EditorToolbarProps) {
    return (
        <div className="flex items-center p-1 border-b bg-background gap-1 h-10 shadow-sm z-10">
            {/* --- File Menu --- */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 font-normal">
                        Archivo <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem onClick={onSaveTemplate}>
                        <Save className="mr-2 h-4 w-4" /> Guardar como Plantilla
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onDownloadSource}>
                        <FileCode className="mr-2 h-4 w-4" /> Descargar Fuente (.tex)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onDownloadPdf}>
                        <FileDown className="mr-2 h-4 w-4" /> Descargar PDF
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* --- Edit Menu (Placeholder for future actions) --- */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 font-normal">
                        Edición <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem disabled={!onUndo} onClick={onUndo}>
                        <Undo className="mr-2 h-4 w-4" /> Deshacer
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={!onRedo} onClick={onRedo}>
                        <Redo className="mr-2 h-4 w-4" /> Rehacer
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled={!onFormat} onClick={onFormat}>
                        <AlignLeft className="mr-2 h-4 w-4" /> Formatear Documento
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* --- Insert Menu --- */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 font-normal">
                        Insertar <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem onClick={onInsertCitation}>
                        <Quote className="mr-2 h-4 w-4" /> Cita Bibliográfica
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onToggleSidebar}>
                        <Sigma className="mr-2 h-4 w-4" /> Símbolos Matemáticos
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled>
                        <ImageIcon className="mr-2 h-4 w-4" /> Imagen (Próximamente)
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled>
                        <TableIcon className="mr-2 h-4 w-4" /> Tabla (Próximamente)
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* --- AI Assistant Menu --- */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 font-normal text-purple-600 dark:text-purple-400 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/20">
                        <Wand2 className="mr-1 h-3 w-3" /> Asistente IA <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                        Selecciona texto para aplicar
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onAiAction("improve")}>
                        <Sparkles className="mr-2 h-4 w-4 text-purple-500" /> Mejorar Redacción
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAiAction("translate")}>
                        <Languages className="mr-2 h-4 w-4 text-blue-500" /> Traducir a Inglés (Académico)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAiAction("summarize")}>
                        <FileText className="mr-2 h-4 w-4 text-orange-500" /> Resumir Sección
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAiAction("grammar")}>
                        <ScanText className="mr-2 h-4 w-4 text-green-500" /> Corregir Gramática
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* --- View Menu --- */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 font-normal">
                        Ver <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem onClick={onToggleSidebar}>
                        <List className="mr-2 h-4 w-4" />
                        {isSidebarOpen ? "Ocultar Estructura" : "Mostrar Estructura"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onTogglePreview}>
                        <Eye className="mr-2 h-4 w-4" />
                        {isPreviewOpen ? "Ocultar Vista Previa" : "Mostrar Vista Previa"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <ZoomIn className="mr-2 h-4 w-4" /> Zoom PDF
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuRadioGroup value={zoomLevel.toString()} onValueChange={(v) => onZoomChange(v === 'auto' || v === 'page-fit' ? v : parseInt(v))}>
                                <DropdownMenuRadioItem value="auto">Automático (Ancho)</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="page-fit">Ajustar Página</DropdownMenuRadioItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuRadioItem value="100">100%</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="150">150%</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex-1" />

            {/* --- Primary Actions (Right Side) --- */}
            <TooltipProvider delayDuration={300}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 px-0 mr-1"
                            onClick={onDownloadPdf}
                        >
                            <FileDown className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Descargar PDF</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="default" // Primary Action
                            size="sm"
                            className="h-8 px-3 mr-2 bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={onTogglePreview}
                        >
                            <Eye className="h-4 w-4 mr-2" /> Compilar
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Compilar y Visualizar</TooltipContent>
                </Tooltip>

                <div className="w-px h-4 bg-border mx-1" />

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant={isSidebarOpen ? "secondary" : "ghost"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={onToggleSidebar}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Estructura / Símbolos</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant={isPreviewOpen ? "secondary" : "ghost"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={onTogglePreview}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Vista Previa (Panel)</TooltipContent>
                </Tooltip>
            </TooltipProvider>

        </div>
    );
}

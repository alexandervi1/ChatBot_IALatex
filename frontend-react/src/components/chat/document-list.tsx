
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { DocumentMetadata } from "@/lib/api-client";
import { Paperclip, Loader2, Trash2, Search, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DocumentListProps {
  documents: DocumentMetadata[];
  uploadStatus: string;
  deletingId: number | null;
  docSearchTerm: string;
  setDocSearchTerm: (value: string) => void;
  handleUploadClick: () => void;
  handleDocSelectionChange: (filename: string, checked: boolean | string) => void;
  handleDelete: (docId: number, sourceFile: string) => void;
  fetchDocuments: () => Promise<void>;
}

export function DocumentList({
  documents,
  uploadStatus,
  deletingId,
  docSearchTerm,
  setDocSearchTerm,
  handleUploadClick,
  handleDocSelectionChange,
  handleDelete,
  fetchDocuments
}: DocumentListProps) {
  return (
    <aside className="hidden md:flex md:w-[180px] lg:w-[200px] flex-col gap-2 overflow-y-auto border-r p-2 lg:p-3 bg-muted/40">
      <div className="flex justify-between items-center">
        <h2 className="text-sm lg:text-base font-semibold">Documentos</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchDocuments}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Actualizar lista</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Button variant="outline" className="w-full text-sm" onClick={handleUploadClick}>
        <Paperclip className="mr-2 h-4 w-4" />Cargar PDF
      </Button>
      {uploadStatus && (
        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="truncate">{uploadStatus}</span>
        </div>
      )}

      <div className="relative mt-1 md:mt-2">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar..."
          className="w-full rounded-lg bg-background pl-8 text-sm"
          value={docSearchTerm}
          onChange={(e) => setDocSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex-grow space-y-1.5 md:space-y-2 pt-2 md:pt-4">
        <h3 className="text-sm md:text-md font-semibold">Filtrar:</h3>
        {documents.length > 0 ? (
          documents.map(doc => (
            <div key={doc.id} className="flex items-center justify-between gap-1 md:gap-2 text-xs md:text-sm">
              <div className="flex items-center gap-2 truncate min-w-0">
                <Checkbox id={`doc-${doc.id}`} className="h-4 w-4" onCheckedChange={(checked) => handleDocSelectionChange(doc.source_file, checked)} />
                <Label htmlFor={`doc-${doc.id}`} className="truncate cursor-pointer" title={doc.source_file}>{doc.source_file}</Label>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleDelete(doc.id, doc.source_file)} disabled={deletingId === doc.id} data-testid={`delete-button-${doc.id}`}>
                {deletingId === doc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
              </Button>
            </div>
          ))
        ) : (
          !uploadStatus && <p className="text-xs md:text-sm text-muted-foreground text-center">Sube un documento para empezar.</p>
        )}
      </div>
    </aside>
  );
}

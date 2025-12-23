'use client';

import { useEffect, useState } from 'react';
import { getAllDocuments, deleteDocumentBySource, type DocumentInfo } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/lib/hooks/use-toast";
import {
    FileText,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Search,
    RefreshCw,
    File,
    FileType2,
    FileSpreadsheet,
    Presentation,
    AlertTriangle
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

// ============================================================================
// File Type Icons and Colors
// ============================================================================

const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    switch (ext) {
        case 'pdf':
            return { icon: FileText, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' };
        case 'docx':
        case 'doc':
            return { icon: FileType2, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' };
        case 'txt':
        case 'md':
            return { icon: File, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-900/30' };
        case 'xlsx':
        case 'xls':
        case 'csv':
            return { icon: FileSpreadsheet, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' };
        case 'pptx':
        case 'ppt':
            return { icon: Presentation, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' };
        case 'tex':
            return { icon: FileText, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' };
        default:
            return { icon: File, color: 'text-muted-foreground', bg: 'bg-muted' };
    }
};

const getFileExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toUpperCase() || 'FILE';
    return ext;
};

// ============================================================================
// Component
// ============================================================================

export function DocumentsManagementTable() {
    const [documents, setDocuments] = useState<DocumentInfo[]>([]);
    const [filteredDocs, setFilteredDocs] = useState<DocumentInfo[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const { toast } = useToast();

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [ownerFilter, setOwnerFilter] = useState('');

    const LIMIT = 20;

    useEffect(() => {
        loadDocuments();
    }, [page]);

    useEffect(() => {
        // Filter documents based on search and owner
        let filtered = documents;

        if (searchTerm) {
            filtered = filtered.filter(doc =>
                doc.source_file.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (ownerFilter) {
            filtered = filtered.filter(doc =>
                doc.owner_id.toString() === ownerFilter
            );
        }

        setFilteredDocs(filtered);
    }, [documents, searchTerm, ownerFilter]);

    const loadDocuments = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const data = await getAllDocuments({ skip: page * LIMIT, limit: LIMIT });
            setDocuments(data.documents);
            setFilteredDocs(data.documents);
            setTotal(data.total);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los documentos" });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        loadDocuments(true);
    };

    const handleDelete = async (ownerId: number, sourceFile: string) => {
        setDeleting(sourceFile);
        try {
            await deleteDocumentBySource(ownerId, sourceFile);
            toast({
                title: "Documento eliminado",
                description: `Se eliminó "${sourceFile}" correctamente`
            });
            loadDocuments(true);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el documento" });
        } finally {
            setDeleting(null);
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setOwnerFilter('');
    };

    // Calculate stats
    const totalChunks = filteredDocs.reduce((sum, doc) => sum + doc.chunk_count, 0);
    const uniqueOwners = new Set(filteredDocs.map(doc => doc.owner_id)).size;

    if (loading && documents.length === 0) {
        return (
            <div className="flex justify-center py-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Cargando documentos...
                </div>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Documentos del Sistema
                        </CardTitle>
                        <CardDescription>
                            {total} archivos · {totalChunks.toLocaleString()} chunks · {uniqueOwners} propietarios
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Actualizar
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 pt-4">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre de archivo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Input
                        placeholder="ID propietario..."
                        value={ownerFilter}
                        onChange={(e) => setOwnerFilter(e.target.value)}
                        className="w-[140px]"
                    />
                    {(searchTerm || ownerFilter) && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                            Limpiar
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Archivo</TableHead>
                                <TableHead className="w-[100px]">Tipo</TableHead>
                                <TableHead className="w-[100px]">Propietario</TableHead>
                                <TableHead className="w-[80px] text-center">Chunks</TableHead>
                                <TableHead className="w-[80px] text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredDocs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        {searchTerm || ownerFilter
                                            ? 'No se encontraron documentos con los filtros actuales'
                                            : 'No hay documentos en el sistema'
                                        }
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredDocs.map((doc, index) => {
                                    const fileInfo = getFileIcon(doc.source_file);
                                    const FileIcon = fileInfo.icon;
                                    const ext = getFileExtension(doc.source_file);
                                    const isDeleting = deleting === doc.source_file;

                                    return (
                                        <TableRow key={`${doc.owner_id}-${doc.source_file}-${index}`}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${fileInfo.bg}`}>
                                                        <FileIcon className={`h-4 w-4 ${fileInfo.color}`} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium truncate max-w-[300px]" title={doc.source_file}>
                                                            {doc.source_file}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {ext}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-mono">
                                                    #{doc.owner_id}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="font-medium">{doc.chunk_count}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                                            disabled={isDeleting}
                                                        >
                                                            {isDeleting ? (
                                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle className="flex items-center gap-2">
                                                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                                                ¿Eliminar documento?
                                                            </DialogTitle>
                                                            <DialogDescription>
                                                                Esta acción eliminará permanentemente <strong>{doc.source_file}</strong> y
                                                                todos sus {doc.chunk_count} chunks asociados. Esta acción no se puede deshacer.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <DialogFooter>
                                                            <Button variant="outline" type="button">Cancelar</Button>
                                                            <Button
                                                                onClick={() => handleDelete(doc.owner_id, doc.source_file)}
                                                                variant="destructive"
                                                            >
                                                                Eliminar
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-muted-foreground">
                        Mostrando {Math.min(page * LIMIT + 1, total)} - {Math.min((page + 1) * LIMIT, total)} de {total}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center px-3 text-sm text-muted-foreground">
                            Página {page + 1} de {Math.ceil(total / LIMIT) || 1}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => p + 1)}
                            disabled={(page + 1) * LIMIT >= total}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

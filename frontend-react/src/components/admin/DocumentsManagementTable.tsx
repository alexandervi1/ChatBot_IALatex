'use client';

import { useEffect, useState } from 'react';
import { getAllDocuments, deleteDocumentBySource, type DocumentInfo } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/use-toast";
import { FileText, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export function DocumentsManagementTable() {
    const [documents, setDocuments] = useState<DocumentInfo[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const LIMIT = 20;

    useEffect(() => {
        loadDocuments();
    }, [page]);

    const loadDocuments = async () => {
        try {
            const data = await getAllDocuments({ skip: page * LIMIT, limit: LIMIT });
            setDocuments(data.documents);
            setTotal(data.total);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los documentos" });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (ownerId: number, sourceFile: string) => {
        if (!confirm(`¿Eliminar ${sourceFile}? Esta acción no se puede deshacer.`)) return;

        try {
            await deleteDocumentBySource(ownerId, sourceFile);
            toast({ title: "Documento eliminado" });
            loadDocuments();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar" });
        }
    };

    if (loading) return <div className="flex justify-center py-8">Cargando documentos...</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documentos del Sistema ({total} archivos)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Archivo</TableHead>
                            <TableHead>Propietario (ID)</TableHead>
                            <TableHead>Chunks</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {documents.map((doc, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{doc.source_file}</TableCell>
                                <TableCell>{doc.owner_id}</TableCell>
                                <TableCell>{doc.chunk_count}</TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive/90"
                                        onClick={() => handleDelete(doc.owner_id, doc.source_file)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-muted-foreground">
                        Mostrando {page * LIMIT + 1} - {Math.min((page + 1) * LIMIT, total)} de {total}
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

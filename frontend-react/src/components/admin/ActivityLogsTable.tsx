'use client';

import { useEffect, useState } from 'react';
import { getActivityLogs, type ActivityLog } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/use-toast";
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';

export function ActivityLogsTable() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const LIMIT = 20;

    useEffect(() => {
        loadLogs();
    }, [page]);

    const loadLogs = async () => {
        try {
            const data = await getActivityLogs({ skip: page * LIMIT, limit: LIMIT });
            setLogs(data.logs);
            setTotal(data.total);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los logs" });
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center py-8">Cargando logs...</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Logs de Actividad ({total} registros)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Usuario</TableHead>
                            <TableHead>Acción</TableHead>
                            <TableHead>IP</TableHead>
                            <TableHead>Fecha</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell className="font-mono text-xs">{log.id}</TableCell>
                                <TableCell>{log.user_id || 'Sistema'}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{log.action}</Badge>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{log.ip_address || '-'}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                    {new Date(log.timestamp).toLocaleString()}
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

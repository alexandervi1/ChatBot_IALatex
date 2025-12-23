'use client';

import { useEffect, useState } from 'react';
import { getActivityLogs, type ActivityLog } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/lib/hooks/use-toast";
import { Clock, ChevronLeft, ChevronRight, Search, Filter, RefreshCw, AlertCircle, ShieldCheck, LogIn, FileUp, MessageSquare, Settings2 } from 'lucide-react';

// ============================================================================
// Action Type Badge Styling
// ============================================================================

const getActionBadge = (action: string) => {
    const actionLower = action.toLowerCase();

    if (actionLower.includes('login')) {
        return { icon: LogIn, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', label: 'Login' };
    }
    if (actionLower.includes('logout')) {
        return { icon: LogIn, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', label: 'Logout' };
    }
    if (actionLower.includes('document') || actionLower.includes('upload')) {
        return { icon: FileUp, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', label: 'Documento' };
    }
    if (actionLower.includes('chat') || actionLower.includes('message')) {
        return { icon: MessageSquare, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', label: 'Chat' };
    }
    if (actionLower.includes('admin') || actionLower.includes('role')) {
        return { icon: ShieldCheck, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Admin' };
    }
    if (actionLower.includes('password') || actionLower.includes('reset')) {
        return { icon: Settings2, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', label: 'Seguridad' };
    }
    if (actionLower.includes('error') || actionLower.includes('fail')) {
        return { icon: AlertCircle, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', label: 'Error' };
    }

    return { icon: Clock, color: 'bg-muted text-muted-foreground', label: action };
};

// ============================================================================
// Common Actions for Filter
// ============================================================================

const COMMON_ACTIONS = [
    { value: '', label: 'Todas las acciones' },
    { value: 'LOGIN', label: 'Login' },
    { value: 'LOGOUT', label: 'Logout' },
    { value: 'DOCUMENT_UPLOAD', label: 'Subir documento' },
    { value: 'CHAT', label: 'Chat' },
    { value: 'PASSWORD_RESET', label: 'Reset contraseña' },
    { value: 'ADMIN_ACTION', label: 'Acción admin' },
    { value: 'API_KEY_UPDATE', label: 'Actualizar API Key' },
];

// ============================================================================
// Component
// ============================================================================

export function ActivityLogsTable() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { toast } = useToast();

    // Filters
    const [userIdFilter, setUserIdFilter] = useState<string>('');
    const [actionFilter, setActionFilter] = useState<string>('');

    const LIMIT = 20;

    useEffect(() => {
        loadLogs();
    }, [page, userIdFilter, actionFilter]);

    const loadLogs = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const data = await getActivityLogs({
                skip: page * LIMIT,
                limit: LIMIT,
                action: actionFilter || undefined,
                user_id: userIdFilter ? parseInt(userIdFilter) : undefined
            });
            setLogs(data.logs);
            setTotal(data.total);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los logs" });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        loadLogs(true);
    };

    const clearFilters = () => {
        setUserIdFilter('');
        setActionFilter('');
        setPage(0);
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return {
            date: date.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
    };

    if (loading && logs.length === 0) {
        return (
            <div className="flex justify-center py-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Cargando logs...
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
                            <Clock className="h-5 w-5" />
                            Logs de Actividad
                        </CardTitle>
                        <CardDescription>{total.toLocaleString()} registros totales</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Actualizar
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 pt-4">
                    <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por ID usuario..."
                            value={userIdFilter}
                            onChange={(e) => {
                                setUserIdFilter(e.target.value);
                                setPage(0);
                            }}
                            className="w-[180px]"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select value={actionFilter} onValueChange={(value) => {
                            setActionFilter(value);
                            setPage(0);
                        }}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filtrar por acción" />
                            </SelectTrigger>
                            <SelectContent>
                                {COMMON_ACTIONS.map((action) => (
                                    <SelectItem key={action.value} value={action.value}>
                                        {action.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {(userIdFilter || actionFilter) && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                            Limpiar filtros
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[60px]">ID</TableHead>
                                <TableHead className="w-[80px]">Usuario</TableHead>
                                <TableHead>Acción</TableHead>
                                <TableHead className="hidden md:table-cell">Detalles</TableHead>
                                <TableHead className="hidden lg:table-cell">IP</TableHead>
                                <TableHead className="text-right">Fecha</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No se encontraron logs con los filtros actuales
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => {
                                    const actionBadge = getActionBadge(log.action);
                                    const ActionIcon = actionBadge.icon;
                                    const timestamp = formatTimestamp(log.timestamp);

                                    return (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                {log.id}
                                            </TableCell>
                                            <TableCell>
                                                {log.user_id ? (
                                                    <Badge variant="outline" className="font-mono">
                                                        #{log.user_id}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">Sistema</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`${actionBadge.color} gap-1`}>
                                                    <ActionIcon className="h-3 w-3" />
                                                    {actionBadge.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell max-w-[200px]">
                                                {log.details ? (
                                                    <span className="text-xs text-muted-foreground truncate block">
                                                        {typeof log.details === 'string'
                                                            ? log.details
                                                            : JSON.stringify(log.details).slice(0, 50) + '...'}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground">
                                                {log.ip_address || '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="text-xs">
                                                    <div className="font-medium">{timestamp.date}</div>
                                                    <div className="text-muted-foreground">{timestamp.time}</div>
                                                </div>
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

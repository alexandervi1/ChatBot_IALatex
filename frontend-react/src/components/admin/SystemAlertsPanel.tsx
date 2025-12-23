'use client';

import { useEffect, useState } from 'react';
import { getSystemAlerts, type SystemAlert, type SystemAlertsResponse } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/lib/hooks/use-toast";
import {
    Bell,
    AlertTriangle,
    AlertCircle,
    Info,
    RefreshCw,
    ChevronRight,
    CheckCircle2,
    X
} from 'lucide-react';

// ============================================================================
// Alert Styling
// ============================================================================

const getAlertStyles = (type: SystemAlert['type']) => {
    switch (type) {
        case 'error':
            return {
                icon: AlertCircle,
                bg: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900',
                iconColor: 'text-red-600 dark:text-red-400',
                badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
                badgeLabel: 'Crítico'
            };
        case 'warning':
            return {
                icon: AlertTriangle,
                bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900',
                iconColor: 'text-amber-600 dark:text-amber-400',
                badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
                badgeLabel: 'Advertencia'
            };
        case 'info':
        default:
            return {
                icon: Info,
                bg: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900',
                iconColor: 'text-blue-600 dark:text-blue-400',
                badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
                badgeLabel: 'Info'
            };
    }
};

// ============================================================================
// Component
// ============================================================================

interface SystemAlertsPanelProps {
    onAlertClick?: (alertId: string) => void;
}

export function SystemAlertsPanel({ onAlertClick }: SystemAlertsPanelProps) {
    const [data, setData] = useState<SystemAlertsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
    const { toast } = useToast();

    useEffect(() => {
        loadAlerts();
    }, []);

    const loadAlerts = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const response = await getSystemAlerts();
            setData(response);
        } catch (error) {
            console.warn('Could not load system alerts:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        loadAlerts(true);
    };

    const handleDismiss = (alertId: string) => {
        setDismissedAlerts(prev => new Set(prev).add(alertId));
        toast({
            title: "Alerta descartada",
            description: "Se ocultará hasta que recargues la página"
        });
    };

    // Filter out dismissed alerts
    const visibleAlerts = data?.alerts.filter(a => !dismissedAlerts.has(a.id)) || [];

    if (loading) {
        return (
            <Card>
                <CardContent className="py-8">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Cargando alertas...
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        <div>
                            <CardTitle className="text-lg">Alertas del Sistema</CardTitle>
                            <CardDescription>
                                {visibleAlerts.length === 0
                                    ? 'Sin alertas pendientes'
                                    : `${visibleAlerts.length} alerta(s) activa(s)`
                                }
                            </CardDescription>
                        </div>
                        {data?.has_critical && (
                            <Badge variant="destructive" className="ml-2 animate-pulse">
                                Crítico
                            </Badge>
                        )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {visibleAlerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
                        <p className="font-medium text-green-700 dark:text-green-400">
                            ¡Todo en orden!
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            No hay alertas que requieran tu atención
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {visibleAlerts.map((alert) => {
                            const styles = getAlertStyles(alert.type);
                            const AlertIcon = styles.icon;

                            return (
                                <div
                                    key={alert.id}
                                    className={`relative p-4 rounded-lg border ${styles.bg} transition-all hover:shadow-sm`}
                                >
                                    {/* Dismiss button */}
                                    <button
                                        onClick={() => handleDismiss(alert.id)}
                                        className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                                        title="Descartar"
                                    >
                                        <X className="h-4 w-4 text-muted-foreground" />
                                    </button>

                                    <div className="flex items-start gap-3 pr-6">
                                        <div className={`p-2 rounded-full ${styles.bg}`}>
                                            <AlertIcon className={`h-5 w-5 ${styles.iconColor}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold text-sm">
                                                    {alert.title}
                                                </h4>
                                                <Badge className={styles.badgeClass} variant="secondary">
                                                    {styles.badgeLabel}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                {alert.message}
                                            </p>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 px-2 text-xs"
                                                onClick={() => onAlertClick?.(alert.id)}
                                            >
                                                {alert.action}
                                                <ChevronRight className="h-3 w-3 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {data && (
                    <p className="text-xs text-muted-foreground text-center mt-4">
                        Última actualización: {new Date(data.generated_at).toLocaleTimeString('es')}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

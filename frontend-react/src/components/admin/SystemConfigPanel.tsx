'use client';

import { useEffect, useState } from 'react';
import {
    getSystemConfig,
    updateSystemConfig,
    getSystemHealth,
    type SystemConfig,
    type SystemHealthResponse
} from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/lib/hooks/use-toast";
import {
    Settings2,
    RefreshCw,
    Save,
    Cpu,
    HardDrive,
    Database,
    Activity,
    Shield,
    Zap,
    FileWarning,
    Clock,
    Users,
    AlertTriangle
} from 'lucide-react';

// ============================================================================
// Component
// ============================================================================

export function SystemConfigPanel() {
    const [health, setHealth] = useState<SystemHealthResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const { toast } = useToast();

    // Local form state
    const [formData, setFormData] = useState<Partial<SystemConfig>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [configResponse, healthResponse] = await Promise.all([
                getSystemConfig(),
                getSystemHealth().catch(() => null)
            ]);
            setFormData(configResponse.config);
            setHealth(healthResponse);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la configuración" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await updateSystemConfig(formData);
            setFormData(result.config);
            setHasChanges(false);
            toast({ title: "Configuración guardada", description: "Los cambios se aplicarán inmediatamente" });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la configuración" });
        } finally {
            setSaving(false);
        }
    };

    const updateField = <K extends keyof SystemConfig>(key: K, value: SystemConfig[K]) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const updateRateLimit = (role: 'anonymous' | 'user' | 'admin', value: number) => {
        setFormData(prev => ({
            ...prev,
            rate_limits: {
                ...((prev.rate_limits || {}) as SystemConfig['rate_limits']),
                [role]: value
            }
        }));
        setHasChanges(true);
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Cargando configuración...
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* System Health */}
            {health && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Estado del Sistema
                            <Badge
                                variant={health.status === 'healthy' ? 'default' : 'destructive'}
                                className={health.status === 'healthy' ? 'bg-green-500' : ''}
                            >
                                {health.status === 'healthy' ? 'Saludable' : 'En Mantenimiento'}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 md:grid-cols-3">
                            {/* CPU */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Cpu className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">CPU</span>
                                    </div>
                                    <span className="text-sm font-bold">{health.system.cpu_percent}%</span>
                                </div>
                                <Progress value={health.system.cpu_percent} className="h-2" />
                            </div>

                            {/* Memory */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">RAM</span>
                                    </div>
                                    <span className="text-sm font-bold">
                                        {health.system.memory_used_gb} / {health.system.memory_total_gb} GB
                                    </span>
                                </div>
                                <Progress value={health.system.memory_percent} className="h-2" />
                            </div>

                            {/* Disk */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Disco</span>
                                    </div>
                                    <span className="text-sm font-bold">
                                        {health.system.disk_used_gb} / {health.system.disk_total_gb} GB
                                    </span>
                                </div>
                                <Progress value={health.system.disk_percent} className="h-2" />
                            </div>
                        </div>

                        <Separator className="my-4" />

                        {/* Database Stats */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="flex items-center gap-3">
                                <Users className="h-5 w-5 text-blue-500" />
                                <div>
                                    <p className="text-2xl font-bold">{health.database.total_users}</p>
                                    <p className="text-xs text-muted-foreground">Usuarios</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Database className="h-5 w-5 text-green-500" />
                                <div>
                                    <p className="text-2xl font-bold">{health.database.total_documents}</p>
                                    <p className="text-xs text-muted-foreground">Documentos</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-purple-500" />
                                <div>
                                    <p className="text-2xl font-bold">{health.database.total_logs}</p>
                                    <p className="text-xs text-muted-foreground">Logs</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Configuration Form */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Settings2 className="h-5 w-5" />
                                Configuración del Sistema
                            </CardTitle>
                            <CardDescription>
                                Ajusta los límites y opciones del sistema
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={loadData}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Recargar
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={!hasChanges || saving}
                            >
                                {saving ? (
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                Guardar
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Rate Limits */}
                    <div className="space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Rate Limits (requests/minuto)
                        </h4>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="rate-anon">Anónimo</Label>
                                <Input
                                    id="rate-anon"
                                    type="number"
                                    value={formData.rate_limits?.anonymous || 30}
                                    onChange={(e) => updateRateLimit('anonymous', parseInt(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rate-user">Usuario</Label>
                                <Input
                                    id="rate-user"
                                    type="number"
                                    value={formData.rate_limits?.user || 100}
                                    onChange={(e) => updateRateLimit('user', parseInt(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rate-admin">Admin</Label>
                                <Input
                                    id="rate-admin"
                                    type="number"
                                    value={formData.rate_limits?.admin || 1000}
                                    onChange={(e) => updateRateLimit('admin', parseInt(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Limits */}
                    <div className="space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                            <FileWarning className="h-4 w-4" />
                            Límites de Recursos
                        </h4>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="max-file">Tamaño máximo archivo (MB)</Label>
                                <Input
                                    id="max-file"
                                    type="number"
                                    value={formData.max_file_size_mb || 50}
                                    onChange={(e) => updateField('max_file_size_mb', parseInt(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="max-tokens">Tokens máx. por usuario</Label>
                                <Input
                                    id="max-tokens"
                                    type="number"
                                    value={formData.max_tokens_per_user || 500000}
                                    onChange={(e) => updateField('max_tokens_per_user', parseInt(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="log-retention">Retención de logs (días)</Label>
                                <Input
                                    id="log-retention"
                                    type="number"
                                    value={formData.log_retention_days || 90}
                                    onChange={(e) => updateField('log_retention_days', parseInt(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Toggles */}
                    <div className="space-y-4">
                        <h4 className="font-medium">Opciones del Sistema</h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="analytics">Habilitar Analytics</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Recopila métricas de uso del sistema
                                    </p>
                                </div>
                                <Switch
                                    id="analytics"
                                    checked={formData.enable_analytics ?? true}
                                    onCheckedChange={(checked) => updateField('enable_analytics', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="maintenance" className="flex items-center gap-2">
                                        Modo Mantenimiento
                                        {formData.maintenance_mode && (
                                            <Badge variant="destructive" className="text-xs">
                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                Activo
                                            </Badge>
                                        )}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Muestra un aviso a los usuarios durante mantenimiento
                                    </p>
                                </div>
                                <Switch
                                    id="maintenance"
                                    checked={formData.maintenance_mode ?? false}
                                    onCheckedChange={(checked) => updateField('maintenance_mode', checked)}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

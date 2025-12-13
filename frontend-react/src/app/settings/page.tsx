'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { getMe, updateUser } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useToast } from '@/lib/hooks/use-toast';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

export default function SettingsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [apiKey, setApiKey] = useState('');
    const [usage, setUsage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user) {
            loadUserData();
        }
    }, [user, authLoading, router]);

    const loadUserData = async () => {
        try {
            setLoading(true);
            const userData = await getMe();
            setUsage(userData.token_usage);
            // We don't get the API key back for security, or maybe we do?
            // The backend model has it, but UserPublic schema does NOT have it.
            // So we can't show the current key. We only allow setting a new one.
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error al cargar datos",
                description: "No se pudo obtener la información del usuario.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!apiKey.trim()) return;

        try {
            setSaving(true);
            await updateUser({ gemini_api_key: apiKey });
            toast({
                title: "Configuración guardada",
                description: "Tu clave API ha sido actualizada correctamente.",
            });
            setApiKey(''); // Clear input for security
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error al guardar",
                description: "No se pudo actualizar la configuración.",
            });
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 max-w-2xl">
            <Button
                variant="ghost"
                className="mb-6 pl-0 hover:bg-transparent hover:text-primary"
                onClick={() => router.push('/')}
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Chat
            </Button>

            <h1 className="text-3xl font-bold mb-8">Configuración de Cuenta</h1>

            <div className="grid gap-6">
                {/* Token Usage Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Uso de API</CardTitle>
                        <CardDescription>
                            Monitoriza el consumo de tokens de tu cuenta.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">Tokens Totales Usados</p>
                                <p className="text-sm text-muted-foreground">
                                    Acumulado de todas tus interacciones.
                                </p>
                            </div>
                            <div className="text-2xl font-bold font-mono">
                                {usage.toLocaleString()}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* API Key Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Clave API Personal</CardTitle>
                        <CardDescription>
                            Gestiona tu clave de Google Gemini para el servicio.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {user?.has_api_key ? (
                            <div className="rounded-lg border p-4 bg-green-50 dark:bg-green-950/10 border-green-200 dark:border-green-900">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-green-800 dark:text-green-300">Estado: Activa</p>
                                        <p className="text-xs text-green-600 dark:text-green-400">Tu clave está configurada y funcionando.</p>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={async () => {
                                            if (!confirm("¿Estás seguro de eliminar tu API Key?")) return;
                                            setSaving(true);
                                            try {
                                                await updateUser({ gemini_api_key: "" });
                                                toast({ title: "API Key eliminada" });
                                                window.location.reload();
                                            } catch (e) {
                                                toast({ variant: "destructive", title: "Error al eliminar" });
                                            } finally {
                                                setSaving(false);
                                            }
                                        }}
                                        disabled={saving}
                                    >
                                        Eliminar Clave
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-lg border p-4 bg-amber-50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900">
                                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Estado: No Configurada</p>
                                <p className="text-xs text-amber-600 dark:text-amber-400">Estás usando la cuota compartida o limitada.</p>
                            </div>
                        )}

                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="api-key">{user?.has_api_key ? 'Actualizar Clave' : 'Configurar Nueva Clave'}</Label>
                                <Input
                                    id="api-key"
                                    type="password"
                                    placeholder={user?.has_api_key ? "••••••••••••••••" : "AIzaSy..."}
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {user?.has_api_key
                                        ? "Ingresa una nueva clave solo si deseas reemplazar la actual."
                                        : "Tu clave se almacena de forma segura y se usa solo para tus peticiones."}
                                </p>
                            </div>
                            <Button type="submit" disabled={saving || !apiKey}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" />
                                Guardar Clave
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

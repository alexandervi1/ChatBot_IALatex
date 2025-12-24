import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, Key, CheckCircle2, AlertCircle, Sparkles, Download, Loader2, HardDrive } from 'lucide-react';
import { updateProfile, getProviders, getOllamaStatus, pullOllamaModel, AIProvider, OllamaStatusResponse, OllamaPullProgress } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/lib/hooks/use-toast';

interface ApiKeyGuideProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

// Default providers in case API fails
const DEFAULT_PROVIDERS: AIProvider[] = [
    {
        id: "gemini",
        name: "Google Gemini",
        models: [{ id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" }],
        default_model: "gemini-2.5-flash",
        api_key_url: "https://aistudio.google.com/app/apikey",
        api_key_placeholder: "AIzaSy...",
        setup_steps: [
            "Ve a Google AI Studio",
            "Inicia sesión con tu cuenta de Google",
            "Haz clic en 'Create API key'",
            "Copia la clave generada y pégala abajo"
        ]
    }
];

export function ApiKeyGuide({ isOpen, onOpenChange }: ApiKeyGuideProps) {
    const [apiKey, setApiKey] = useState('');
    const [selectedProvider, setSelectedProvider] = useState<string>('gemini');
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [providers, setProviders] = useState<AIProvider[]>(DEFAULT_PROVIDERS);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [ollamaStatus, setOllamaStatus] = useState<OllamaStatusResponse | null>(null);
    const [isPulling, setIsPulling] = useState(false);
    const [pullProgress, setPullProgress] = useState<string>('');
    const { user } = useAuth();
    const { toast } = useToast();

    // Load providers from API
    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            getProviders()
                .then(response => {
                    if (response.providers && response.providers.length > 0) {
                        setProviders(response.providers);
                    }
                    // Set initial provider from user settings
                    if (user?.ai_provider) {
                        setSelectedProvider(user.ai_provider);
                    }
                    // Set initial model from user settings
                    if (user?.ai_model) {
                        setSelectedModel(user.ai_model);
                    }
                })
                .catch(err => {
                    console.error("Failed to load providers:", err);
                    // Keep default providers
                })
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, user?.ai_provider, user?.ai_model]);

    const currentProvider = providers.find(p => p.id === selectedProvider) || providers[0];

    // When provider changes, set default model for that provider
    useEffect(() => {
        if (currentProvider && !selectedModel) {
            setSelectedModel(currentProvider.default_model);
        }
    }, [currentProvider, selectedModel]);

    // Reset model when provider changes
    const handleProviderChange = (providerId: string) => {
        setSelectedProvider(providerId);
        const provider = providers.find(p => p.id === providerId);
        if (provider) {
            setSelectedModel(provider.default_model);
            // Auto-fill 'local' for Ollama (no API key needed)
            if (providerId === 'ollama') {
                setApiKey('local');
            } else {
                setApiKey('');
            }
        }
    };

    // Check Ollama status when selected
    useEffect(() => {
        if (selectedProvider === 'ollama' && ollamaStatus === null) {
            getOllamaStatus()
                .then(setOllamaStatus)
                .catch(() => setOllamaStatus({ available: false, installed_models: [], recommended_models: [] }));
        }
    }, [selectedProvider, ollamaStatus]);

    const handleSubmit = async () => {
        // Allow empty API key for Ollama (local provider)
        const effectiveApiKey = selectedProvider === 'ollama' ? 'local' : apiKey.trim();
        if (!effectiveApiKey) return;

        setIsSubmitting(true);
        try {
            await updateProfile({
                gemini_api_key: effectiveApiKey,
                ai_provider: selectedProvider,
                ai_model: selectedModel
            });
            toast({
                title: "Configuración guardada",
                description: `Tu clave API de ${currentProvider?.name} ha sido configurada exitosamente.`,
            });
            // Reload to refresh user state
            window.location.reload();
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo guardar la configuración. Inténtalo de nuevo.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteKey = async () => {
        if (!confirm("¿Estás seguro de eliminar tu API Key?")) return;
        setIsSubmitting(true);
        try {
            await updateProfile({ gemini_api_key: "" });
            toast({ title: "API Key eliminada" });
            window.location.reload();
        } catch (e) {
            toast({ variant: "destructive", title: "Error al eliminar" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5 text-primary" />
                        Configuración de IA
                    </DialogTitle>
                    <DialogDescription>
                        Configura tu proveedor de IA preferido y tu clave API personal.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="grid gap-6 py-4">
                        {/* Provider Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="provider" className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4" />
                                Proveedor de IA
                            </Label>
                            <Select
                                value={selectedProvider}
                                onValueChange={handleProviderChange}
                                disabled={isLoading}
                            >
                                <SelectTrigger id="provider">
                                    <SelectValue placeholder="Selecciona un proveedor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {providers.map(provider => (
                                        <SelectItem key={provider.id} value={provider.id}>
                                            {provider.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Model Selection */}
                        {currentProvider && currentProvider.models.length > 0 && (
                            <div className="space-y-2">
                                <Label htmlFor="model" className="flex items-center gap-2">
                                    🤖 Modelo
                                </Label>
                                <Select
                                    value={selectedModel || currentProvider.default_model}
                                    onValueChange={setSelectedModel}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger id="model">
                                        <SelectValue placeholder="Selecciona un modelo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {currentProvider.models.map(model => (
                                            <SelectItem key={model.id} value={model.id}>
                                                {model.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-[0.75rem] text-muted-foreground">
                                    Modelo por defecto: {currentProvider.default_model}
                                </p>
                            </div>
                        )}

                        {/* Provider-specific info */}
                        {currentProvider && (
                            <>
                                <div className="rounded-lg border p-4 bg-muted/50">
                                    <h4 className="font-medium mb-2 flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        {selectedProvider === 'ollama' ? '¿Por qué Ollama?' : '¿Por qué necesito esto?'}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedProvider === 'ollama'
                                            ? 'Ollama ejecuta modelos de IA directamente en tu PC. No necesitas API key ni conexión a internet. 100% privado y gratuito.'
                                            : `Esta aplicación utiliza la tecnología de ${currentProvider.name}. Usar tu propia clave te garantiza control total sobre tu uso y límites.`
                                        }
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm">Pasos para obtener tu clave:</h4>
                                    <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                                        {currentProvider.setup_steps.map((step, index) => (
                                            <li key={index}>
                                                {index === 0 ? (
                                                    <a
                                                        href={currentProvider.api_key_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary hover:underline inline-flex items-center gap-1"
                                                    >
                                                        {step} <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                ) : (
                                                    step
                                                )}
                                            </li>
                                        ))}
                                    </ol>
                                </div>


                            </>
                        )}

                        {/* API Key Input - Hidden for Ollama */}
                        {selectedProvider !== 'ollama' && (
                            <div className="grid gap-2">
                                <Label htmlFor="api-key">
                                    Tu Clave API de {currentProvider?.name || "IA"}
                                </Label>
                                <Input
                                    id="api-key"
                                    type="password"
                                    placeholder={currentProvider?.api_key_placeholder || "API Key..."}
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                />
                                <p className="text-[0.8rem] text-muted-foreground flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Tu clave se guarda de forma segura.
                                </p>
                            </div>
                        )}

                        {/* Ollama info message */}
                        {selectedProvider === 'ollama' && (
                            <div className="space-y-3">
                                {/* Check Ollama Status */}
                                {ollamaStatus === null ? (
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Verificando estado de Ollama...
                                    </div>
                                ) : ollamaStatus.available ? (
                                    <>
                                        <div className="rounded-lg border border-green-500/30 p-4 bg-green-500/10">
                                            <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2 font-medium">
                                                <CheckCircle2 className="h-4 w-4" />
                                                Ollama está corriendo - ¡Listo para usar!
                                            </p>
                                        </div>

                                        {/* Installed Models */}
                                        {ollamaStatus.installed_models.length > 0 && (
                                            <div className="rounded-lg border p-3 bg-muted/50">
                                                <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                                                    <HardDrive className="h-4 w-4" />
                                                    Modelos instalados:
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {ollamaStatus.installed_models.map(m => (
                                                        <span key={m.name} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                                                            {m.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Download recommended models */}
                                        <div className="rounded-lg border p-3 bg-muted/50">
                                            <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                                                <Download className="h-4 w-4" />
                                                Descargar modelos:
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {ollamaStatus.recommended_models.slice(0, 4).map(m => {
                                                    const isInstalled = ollamaStatus.installed_models.some(
                                                        im => im.name === m.id || im.name.startsWith(m.id.split(':')[0])
                                                    );
                                                    return (
                                                        <Button
                                                            key={m.id}
                                                            variant={isInstalled ? "outline" : "secondary"}
                                                            size="sm"
                                                            disabled={isPulling || isInstalled}
                                                            onClick={async () => {
                                                                setIsPulling(true);
                                                                setPullProgress(`Descargando ${m.id}...`);
                                                                try {
                                                                    await pullOllamaModel(m.id, (p) => {
                                                                        if (p.status) setPullProgress(p.status);
                                                                        if (p.completed && p.total) {
                                                                            const pct = Math.round((p.completed / p.total) * 100);
                                                                            setPullProgress(`${pct}%`);
                                                                        }
                                                                    });
                                                                    toast({ title: `Modelo ${m.id} instalado` });
                                                                    const status = await getOllamaStatus();
                                                                    setOllamaStatus(status);
                                                                } catch (e) {
                                                                    toast({ variant: "destructive", title: "Error al descargar" });
                                                                } finally {
                                                                    setIsPulling(false);
                                                                    setPullProgress('');
                                                                }
                                                            }}
                                                        >
                                                            {isInstalled ? <CheckCircle2 className="h-3 w-3 mr-1" /> : null}
                                                            {m.id.split(':')[0]}
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                            {isPulling && (
                                                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                    {pullProgress}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    /* Ollama not running */
                                    <div className="space-y-3">
                                        <div className="rounded-lg border border-yellow-500/30 p-4 bg-yellow-500/10">
                                            <p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-2 font-medium">
                                                <AlertCircle className="h-4 w-4" />
                                                Ollama no está corriendo
                                            </p>
                                        </div>

                                        <div className="rounded-lg border p-4 bg-muted/50 space-y-3">
                                            <h4 className="font-medium text-sm">Pasos para usar Ollama:</h4>
                                            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                                                <li>
                                                    <a
                                                        href="https://ollama.com/download"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary hover:underline inline-flex items-center gap-1"
                                                    >
                                                        Descarga Ollama <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                </li>
                                                <li>Instala y ejecuta Ollama</li>
                                                <li>Recarga esta página</li>
                                            </ol>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={async () => {
                                                    setOllamaStatus(null);
                                                    const status = await getOllamaStatus();
                                                    setOllamaStatus(status);
                                                }}
                                            >
                                                <Loader2 className="h-3 w-3 mr-1" />
                                                Verificar de nuevo
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter className="flex justify-between sm:justify-between">
                    {user?.has_api_key && (
                        <Button
                            variant="destructive"
                            onClick={handleDeleteKey}
                            disabled={isSubmitting}
                        >
                            Eliminar Key
                        </Button>
                    )}
                    <Button
                        onClick={handleSubmit}
                        disabled={(selectedProvider !== 'ollama' && !apiKey.trim()) || isSubmitting}
                    >
                        {isSubmitting ? "Guardando..." : "Guardar y Continuar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

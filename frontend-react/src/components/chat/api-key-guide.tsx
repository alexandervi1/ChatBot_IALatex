import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, Key, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { updateProfile, getProviders, AIProvider } from '@/lib/api-client';
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
    const [providers, setProviders] = useState<AIProvider[]>(DEFAULT_PROVIDERS);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
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
                })
                .catch(err => {
                    console.error("Failed to load providers:", err);
                    // Keep default providers
                })
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, user?.ai_provider]);

    const currentProvider = providers.find(p => p.id === selectedProvider) || providers[0];

    const handleSubmit = async () => {
        // Allow empty API key for local provider
        const isLocalProvider = selectedProvider === 'local';
        if (!isLocalProvider && !apiKey.trim()) return;

        setIsSubmitting(true);
        try {
            await updateProfile({
                gemini_api_key: apiKey,
                ai_provider: selectedProvider
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
                                onValueChange={setSelectedProvider}
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

                        {/* Provider-specific info */}
                        {currentProvider && (
                            <>
                                <div className="rounded-lg border p-4 bg-muted/50">
                                    <h4 className="font-medium mb-2 flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        ¿Por qué necesito esto?
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        Esta aplicación utiliza la tecnología de {currentProvider.name}.
                                        Usar tu propia clave te garantiza control total sobre tu uso y límites.
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

                                {/* Hardware requirements for local model */}
                                {currentProvider.id === 'local' && (
                                    <div className="rounded-lg border p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                                        <h4 className="font-medium mb-2 flex items-center gap-2 text-amber-900 dark:text-amber-100">
                                            <AlertCircle className="h-4 w-4" />
                                            Requisitos de Hardware
                                        </h4>
                                        <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1 list-disc list-inside">
                                            <li>GPU: 8GB+ VRAM (recomendado, opcional)</li>
                                            <li>RAM: 16GB+ (mínimo 8GB)</li>
                                            <li>CPU: 8+ cores</li>
                                            <li>Disco: ~2-4GB por modelo</li>
                                        </ul>
                                        <p className="text-xs mt-2 text-amber-700 dark:text-amber-300">
                                            ⚡ GPU acelera mucho la generación. Sin GPU, funciona pero más lento.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        {/* API Key Input - hidden for local provider */}
                        {currentProvider.id !== 'local' ? (
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
                        ) : (
                            <div className="rounded-lg border p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                                <p className="text-sm text-green-800 dark:text-green-200">
                                    ✓ No necesitas API key. Solo haz clic en "Guardar Configuración" para activar el modo local.
                                </p>
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
                        disabled={(selectedProvider !== 'local' && !apiKey.trim()) || isSubmitting}
                    >
                        {isSubmitting ? "Guardando..." : "Guardar y Continuar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

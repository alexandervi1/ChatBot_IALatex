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
    const [selectedModel, setSelectedModel] = useState<string>('');
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
        }
    };

    const handleSubmit = async () => {
        if (!apiKey.trim()) return;

        setIsSubmitting(true);
        try {
            await updateProfile({
                gemini_api_key: apiKey,
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


                            </>
                        )}

                        {/* API Key Input */}
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
                        disabled={!apiKey.trim() || isSubmitting}
                    >
                        {isSubmitting ? "Guardando..." : "Guardar y Continuar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

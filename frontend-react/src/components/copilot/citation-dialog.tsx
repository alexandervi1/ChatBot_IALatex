import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Quote } from 'lucide-react';
import { useState } from 'react';

interface CitationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onGenerateCitation: (format: string, input: string) => void;
}

/**
 * Dialog component for generating academic citations.
 * Supports APA, IEEE, Chicago, and MLA formats.
 */
export function CitationDialog({ open, onOpenChange, onGenerateCitation }: CitationDialogProps) {
    const [citationFormat, setCitationFormat] = useState<'APA' | 'IEEE' | 'Chicago' | 'MLA'>('APA');
    const [citationInput, setCitationInput] = useState('');

    const handleGenerate = () => {
        onGenerateCitation(citationFormat, citationInput);
        setCitationInput('');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Generador de Citas Académicas</DialogTitle>
                    <DialogDescription>
                        Ingresa los datos de la publicación y selecciona el formato.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Formato de Cita</label>
                        <Select value={citationFormat} onValueChange={(value: any) => setCitationFormat(value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="APA">APA 7th (Psicología, Educación)</SelectItem>
                                <SelectItem value="IEEE">IEEE (Ingeniería, Computación)</SelectItem>
                                <SelectItem value="Chicago">Chicago (Humanidades)</SelectItem>
                                <SelectItem value="MLA">MLA (Literatura, Artes)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Información de la Publicación</label>
                        <Textarea
                            value={citationInput}
                            onChange={(e) => setCitationInput(e.target.value)}
                            placeholder="Autor(es), año, título, revista/libro, etc.&#10;Ejemplo: Smith, J. (2024). Research Paper. Journal Name, 10, 1-15."
                            className="min-h-[100px]"
                        />
                        <p className="text-xs text-muted-foreground">
                            Tip: Puedes pegar un texto o DOI, el sistema intentará extraer la información.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleGenerate}>
                        <Quote className="mr-2 h-4 w-4" />
                        Generar Cita
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

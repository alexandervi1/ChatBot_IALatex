import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useState } from 'react';

interface SaveTemplateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (name: string) => void;
}

/**
 * Dialog component for saving custom LaTeX templates.
 */
export function SaveTemplateDialog({ open, onOpenChange, onSave }: SaveTemplateDialogProps) {
    const [templateName, setTemplateName] = useState('');

    const handleSave = () => {
        if (templateName.trim()) {
            onSave(templateName);
            setTemplateName('');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Guardar Plantilla</DialogTitle>
                    <DialogDescription>
                        Ingresa un nombre para tu nueva plantilla.
                    </DialogDescription>
                </DialogHeader>
                <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Nombre de la plantilla"
                />
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave}>Guardar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

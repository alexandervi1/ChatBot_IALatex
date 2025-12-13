import { Loader2, AlertTriangle, Eye } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { forwardRef } from 'react';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PdfPreviewProps {
    pdfFile: Blob | null;
    previewStatus: 'idle' | 'loading' | 'success' | 'error';
    previewError: string | null;
    numPages: number | null;
    onDocumentLoadSuccess: (numPages: number) => void;
    onLoadError: (error: string) => void;
    onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
}

/**
 * PDF Preview component for the CopilotEditor.
 * Handles different states: idle, loading, success, error.
 */
export const PdfPreview = forwardRef<HTMLDivElement, PdfPreviewProps>(({
    pdfFile,
    previewStatus,
    previewError,
    numPages,
    onDocumentLoadSuccess,
    onLoadError,
    onScroll,
}, ref) => {
    const renderContent = () => {
        switch (previewStatus) {
            case 'loading':
                return (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Loader2 className="h-12 w-12 animate-spin mb-4" />
                        <p>Compilando PDF...</p>
                    </div>
                );
            case 'error':
                return (
                    <div className="flex flex-col items-center justify-center h-full text-destructive p-4">
                        <AlertTriangle className="h-12 w-12 mb-4" />
                        <h3 className="font-semibold text-lg mb-2">Error de Compilación</h3>
                        <pre className="text-xs whitespace-pre-wrap bg-destructive/10 p-2 rounded-md w-full text-left">
                            {previewError}
                        </pre>
                    </div>
                );
            case 'success':
                if (pdfFile) {
                    return (
                        <Document
                            file={pdfFile}
                            onLoadSuccess={({ numPages }) => onDocumentLoadSuccess(numPages)}
                            onLoadError={(error) => onLoadError(`Error al cargar el PDF: ${error.message}`)}
                        >
                            {Array.from(new Array(numPages), (_, index) => (
                                <Page
                                    key={`page_${index + 1}`}
                                    pageNumber={index + 1}
                                    renderTextLayer={false}
                                    width={(ref as React.RefObject<HTMLDivElement>)?.current?.clientWidth
                                        ? (ref as React.RefObject<HTMLDivElement>).current!.clientWidth - 32
                                        : undefined}
                                />
                            ))}
                        </Document>
                    );
                }
                return null;
            case 'idle':
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Eye className="h-12 w-12 mb-4" />
                        <p>Haz clic en "Compilar" para generar la vista previa.</p>
                    </div>
                );
        }
    };

    return (
        <div ref={ref} onScroll={onScroll} className="h-full overflow-y-auto bg-secondary p-4">
            {renderContent()}
        </div>
    );
});

PdfPreview.displayName = 'PdfPreview';

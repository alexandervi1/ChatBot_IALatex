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
    zoomLevel: number | 'auto' | 'page-fit';
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
    zoomLevel,
}, ref) => {

    // Helper to calculate page width/height based on zoom setting
    const getPageProps = (containerWidth: number, containerHeight: number) => {
        if (zoomLevel === 'auto') {
            return { width: containerWidth - 32 }; // Default: Fil width minus padding
        }
        if (zoomLevel === 'page-fit') {
            return { height: containerHeight - 32 }; // Fit height
        }
        if (typeof zoomLevel === 'number') {
            // Manual zoom. Assuming 100% is roughly standard width (e.g. 800px) or just scale if library supported it.
            // React-pdf 'width' prop sets the width in pixels.
            // Let's assume 800px is 100% for a baseline.
            return { width: 800 * (zoomLevel / 100) };
        }
        return { width: containerWidth - 32 };
    };

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
                    // Safe reference access
                    const container = (ref as React.RefObject<HTMLDivElement>)?.current;
                    const containerWidth = container?.clientWidth || 800;
                    const containerHeight = container?.clientHeight || 600;
                    const pageProps = getPageProps(containerWidth, containerHeight);

                    return (
                        <Document
                            file={pdfFile}
                            onLoadSuccess={({ numPages }) => onDocumentLoadSuccess(numPages)}
                            onLoadError={(error) => onLoadError(`Error al cargar el PDF: ${error.message}`)}
                            className="flex flex-col items-center"
                        >
                            {Array.from(new Array(numPages), (_, index) => (
                                <Page
                                    key={`page_${index + 1}`}
                                    pageNumber={index + 1}
                                    renderTextLayer={false}
                                    className="my-2 shadow-sm border bg-white"
                                    {...pageProps}
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
        <div ref={ref} onScroll={onScroll} className="h-full overflow-y-auto bg-secondary/50 p-4">
            {renderContent()}
        </div>
    );
});

PdfPreview.displayName = 'PdfPreview';

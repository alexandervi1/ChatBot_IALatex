
import { Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  setInput: (value: string) => void;
  suggestedQuestions?: string[];
}

export function WelcomeScreen({ setInput, suggestedQuestions = [] }: WelcomeScreenProps) {
  const defaultQuestions = [
    '¿Cuál es el tema principal del documento?',
    'Haz un resumen de las ideas clave.',
    '¿Qué es la arquitectura RAG?',
    'Explica el concepto de \'chunking\'.',
  ];

  const questionsToShow = suggestedQuestions.length > 0 ? suggestedQuestions : defaultQuestions;

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-background">
      <div className="max-w-2xl w-full">
        <div className="p-6 rounded-lg bg-card shadow-lg border border-border">
          <Sparkles className="h-14 w-14 mx-auto text-primary mb-4" />
          <h1 className="text-2xl font-bold text-card-foreground mb-2">Asistente Inteligente de Documentos</h1>
          <p className="text-muted-foreground mb-6">
            Sube un PDF y hazle preguntas. Obtén resúmenes, explicaciones y respuestas al instante.
          </p>

          <div className="space-y-3">
            <h3 className="font-semibold text-md">
              {suggestedQuestions.length > 0 ? 'Preguntas sugeridas para tus documentos:' : 'Prueba con estas preguntas:'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {questionsToShow.map((question, i) => (
                <button
                  key={i}
                  onClick={() => setInput(question)}
                  className="p-3 border rounded-lg bg-card hover:bg-muted transition-colors text-left text-sm font-medium shadow-sm"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

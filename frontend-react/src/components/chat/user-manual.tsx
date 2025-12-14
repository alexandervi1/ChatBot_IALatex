import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  FileText,
  Upload,
  Sparkles,
  Settings,
  Zap,
  BookOpen,
  Cpu,
  Cloud,
  Palette,
  Check,
  HelpCircle,
  FileCode,
  Download
} from "lucide-react";

interface UserManualProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserManual({ open, onOpenChange }: UserManualProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-medium flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            Guía de Usuario
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Sistema de chat con IA, búsqueda semántica y editor LaTeX profesional
          </p>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-100px)]">
          <div className="px-6 pb-6 space-y-6">

            {/* Proveedores de IA */}
            <Section title="Proveedores de IA" icon={<Cpu className="h-4 w-4" />}>
              <p className="text-sm text-muted-foreground mb-3">
                Elige entre 4 proveedores de IA. Configúralo al iniciar sesión por primera vez.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <ProviderCard
                  icon={<Cloud className="h-4 w-4" />}
                  name="Google Gemini"
                  desc="Rápido, económico, recomendado"
                  features={["gemini-2.5-flash", "gemini-1.5-pro"]}
                  highlight
                />
                <ProviderCard
                  icon={<Zap className="h-4 w-4" />}
                  name="Cerebras"
                  desc="Ultra-rápido, capa gratuita"
                  features={["llama3.1-8b", "llama-3.3-70b"]}
                  highlight
                />
                <ProviderCard
                  icon={<Cloud className="h-4 w-4" />}
                  name="OpenAI"
                  desc="GPT-4o, alta calidad"
                  features={["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"]}
                />
                <ProviderCard
                  icon={<Cloud className="h-4 w-4" />}
                  name="Anthropic Claude"
                  desc="Preciso, seguro"
                  features={["claude-3-5-sonnet", "claude-3-haiku"]}
                />
              </div>
              <Tip>Gemini y Cerebras tienen capa gratuita. OpenAI y Anthropic requieren pago.</Tip>
            </Section>

            <Separator />

            {/* Chat con Documentos */}
            <Section title="Chat con Documentos" icon={<MessageSquare className="h-4 w-4" />}>
              <div className="space-y-4">
                <SubSection title="Cargar Documentos" icon={<Upload className="h-4 w-4" />}>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Haz clic en <strong>"Cargar Documentos"</strong> en la barra superior</li>
                    <li>Selecciona archivos <strong>PDF, DOCX, TXT o Markdown</strong></li>
                    <li>Espera el procesamiento (se generan embeddings automáticamente)</li>
                    <li>Tus documentos aparecerán en la lista lateral</li>
                  </ol>
                </SubSection>

                <SubSection title="Hacer Preguntas" icon={<MessageSquare className="h-4 w-4" />}>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Escribe tu pregunta en el campo de texto inferior</li>
                    <li><strong>(Opcional)</strong> Filtra por documentos específicos con los checkboxes</li>
                    <li>Presiona <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> o haz clic en enviar</li>
                    <li>La IA buscará en tus documentos y generará una respuesta contextual</li>
                  </ol>
                </SubSection>

                <FeatureGrid features={[
                  "Historial de conversación persistente",
                  "Respuestas en streaming (tiempo real)",
                  "Citas y referencias a documentos fuente",
                  "Búsqueda híbrida (semántica + keywords)",
                  "Re-ranking inteligente de resultados",
                  "Formato TOON: ahorra 30-60% tokens"
                ]} />
              </div>
            </Section>

            <Separator />

            {/* Editor LaTeX */}
            <Section title="Editor LaTeX con Copiloto" icon={<FileCode className="h-4 w-4" />}>
              <div className="space-y-4">
                <SubSection title="10 Plantillas Profesionales" icon={<FileText className="h-4 w-4" />}>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground text-xs uppercase tracking-wider mb-1">Académicas</p>
                      <ul className="space-y-0.5 text-xs">
                        <li>• Artículo Básico</li>
                        <li>• Artículo Matemáticas (AMS)</li>
                        <li>• Tesis/Reporte</li>
                        <li>• Tesis de Grado</li>
                        <li>• Tarea Universitaria</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-xs uppercase tracking-wider mb-1">Profesionales</p>
                      <ul className="space-y-0.5 text-xs">
                        <li>• Curriculum Vitae</li>
                        <li>• Carta Formal</li>
                        <li>• Informe Técnico</li>
                        <li>• Libro (Book)</li>
                        <li>• Presentación Beamer</li>
                      </ul>
                    </div>
                  </div>
                </SubSection>

                <SubSection title="Usar el Asistente IA" icon={<Sparkles className="h-4 w-4" />}>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Cambia a modo <strong>"Copiloto"</strong> en la navegación superior</li>
                    <li>Selecciona una plantilla o empieza desde cero</li>
                    <li>Escribe instrucciones en lenguaje natural:
                      <ul className="ml-6 mt-1 text-xs space-y-0.5 text-muted-foreground/80">
                        <li>• "Crea una sección de introducción sobre IA"</li>
                        <li>• "Agrega una tabla con 3 columnas"</li>
                        <li>• "Genera una ecuación de regresión lineal"</li>
                        <li>• "Crea una bibliografía en formato APA"</li>
                      </ul>
                    </li>
                    <li>El asistente generará código LaTeX automáticamente</li>
                    <li>Haz clic en <strong>"Compilar"</strong> para ver el PDF</li>
                  </ol>
                </SubSection>

                <SubSection title="Acciones con Clic Derecho" icon={<Sparkles className="h-4 w-4" />}>
                  <p className="text-sm text-muted-foreground mb-2">
                    Selecciona texto y haz clic derecho para acceder a acciones IA:
                  </p>
                  <FeatureGrid features={[
                    "✨ Mejorar redacción académica",
                    "🇺🇸 Traducir a inglés técnico",
                    "🔧 Corregir errores de sintaxis",
                    "📚 Generar citas bibliográficas"
                  ]} cols={2} />
                </SubSection>

                <FeatureGrid features={[
                  "Editor Monaco (como VS Code)",
                  "Resaltado de sintaxis LaTeX",
                  "Compilación en tiempo real",
                  "Vista previa PDF integrada",
                  "Scroll sincronizado",
                  "Plantillas personalizadas",
                  "Descarga PDF directo",
                  "Citas automáticas"
                ]} />
              </div>
            </Section>

            <Separator />

            {/* Configuración */}
            <Section title="Configuración" icon={<Settings className="h-4 w-4" />}>
              <div className="grid grid-cols-2 gap-3">
                <ConfigCard
                  icon={<Cpu className="h-4 w-4" />}
                  title="Proveedor de IA"
                  items={["Cambiar entre Gemini, OpenAI, Anthropic o Cerebras", "Seleccionar modelo específico", "Ver consumo de tokens"]}
                />
                <ConfigCard
                  icon={<Palette className="h-4 w-4" />}
                  title="6 Temas Visuales"
                  items={["🌙 Oscuro (por defecto)", "☀️ Claro", "🔥 Rojo Pasión", "👁️ Alto Contraste", "💚 Matrix", "🕰️ Vintage"]}
                />
              </div>
              <Tip>Accede a Configuración con el ícono ⚙️ en la barra superior</Tip>
            </Section>

            <Separator />

            {/* Tips y Atajos */}
            <Section title="Tips y Atajos" icon={<Zap className="h-4 w-4" />}>
              <div className="space-y-2">
                <TipCard color="blue" title="💡 Mejores Resultados">
                  <ul className="text-xs space-y-0.5">
                    <li>• Sé específico en tus preguntas</li>
                    <li>• Filtra por documentos relevantes</li>
                    <li>• Usa el historial para preguntas de seguimiento</li>
                  </ul>
                </TipCard>
                <TipCard color="purple" title="⌨️ Atajos de Teclado">
                  <ul className="text-xs space-y-0.5">
                    <li>• <kbd className="px-1 bg-muted rounded">Enter</kbd> - Enviar mensaje</li>
                    <li>• <kbd className="px-1 bg-muted rounded">Ctrl+Enter</kbd> - Compilar LaTeX</li>
                    <li>• <kbd className="px-1 bg-muted rounded">Clic derecho</kbd> - Acciones IA en editor</li>
                  </ul>
                </TipCard>
                <TipCard color="green" title="⚡ Ahorro de Tokens">
                  <ul className="text-xs space-y-0.5">
                    <li>• Formato TOON reduce consumo 30-60% automáticamente</li>
                    <li>• Gemini y Cerebras = capa gratuita generosa</li>
                  </ul>
                </TipCard>
              </div>
            </Section>

            {/* Footer */}
            <div className="text-center pt-4">
              <p className="text-xs text-muted-foreground">
                <HelpCircle className="h-3 w-3 inline mr-1" />
                ¿Problemas? Consulta el <strong>README.md</strong> del proyecto
              </p>
            </div>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Componentes auxiliares
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

function SubSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-muted/30 p-3 rounded-lg">
      <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
        {icon}
        {title}
      </h4>
      {children}
    </div>
  );
}

function ProviderCard({ icon, name, desc, features, highlight }: {
  icon: React.ReactNode;
  name: string;
  desc: string;
  features: string[];
  highlight?: boolean;
}) {
  return (
    <div className={`p-3 rounded-lg border ${highlight ? 'border-primary/30 bg-primary/5' : 'bg-card'}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-muted-foreground">{icon}</span>
        <span className="font-medium text-sm">{name}</span>
        {highlight && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">Gratis</span>}
      </div>
      <p className="text-xs text-muted-foreground mb-1">{desc}</p>
      <p className="text-[10px] text-muted-foreground/70">{features.join(" • ")}</p>
    </div>
  );
}

function FeatureGrid({ features, cols = 3 }: { features: string[]; cols?: number }) {
  return (
    <div className={`grid gap-1 text-xs ${cols === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
      {features.map((feature, i) => (
        <div key={i} className="flex items-center gap-1.5 text-muted-foreground">
          <Check className="h-3 w-3 text-primary flex-shrink-0" />
          <span>{feature}</span>
        </div>
      ))}
    </div>
  );
}

function ConfigCard({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <div className="p-3 rounded-lg border bg-card">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-muted-foreground">{icon}</span>
        <span className="font-medium text-sm">{title}</span>
      </div>
      <ul className="text-xs text-muted-foreground space-y-0.5">
        {items.map((item, i) => <li key={i}>• {item}</li>)}
      </ul>
    </div>
  );
}

function TipCard({ color, title, children }: { color: string; title: string; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500/5 border-blue-500/10 text-blue-700 dark:text-blue-400',
    purple: 'bg-purple-500/5 border-purple-500/10 text-purple-700 dark:text-purple-400',
    green: 'bg-green-500/5 border-green-500/10 text-green-700 dark:text-green-400',
  };
  return (
    <div className={`p-3 rounded-lg border ${colors[color]}`}>
      <p className="font-medium text-xs mb-1">{title}</p>
      <div className="text-muted-foreground">{children}</div>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1">
      <Zap className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
      {children}
    </p>
  );
}
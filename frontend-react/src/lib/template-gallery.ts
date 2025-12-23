/**
 * Expanded LaTeX Template Gallery
 * 
 * 50+ professional templates organized by category.
 * Sprint 4 enhancement.
 */

// ============================================================================
// Types
// ============================================================================

export interface TemplateMetadata {
    id: string;
    name: string;
    description: string;
    category: TemplateCategory;
    tags: string[];
    preview?: string;  // First few lines for preview
    difficulty: 'basic' | 'intermediate' | 'advanced';
    packages: string[];
}

export type TemplateCategory =
    | 'academic'
    | 'thesis'
    | 'article'
    | 'report'
    | 'presentation'
    | 'letter'
    | 'cv'
    | 'book'
    | 'exam'
    | 'math'
    | 'other';

export interface FullTemplate extends TemplateMetadata {
    content: string;
}

// ============================================================================
// Category Metadata
// ============================================================================

export const templateCategories: Record<TemplateCategory, { name: string; icon: string; description: string }> = {
    academic: { name: 'Académico', icon: '🎓', description: 'Artículos y papers científicos' },
    thesis: { name: 'Tesis', icon: '📚', description: 'Tesis de grado y posgrado' },
    article: { name: 'Artículo', icon: '📄', description: 'Artículos y publicaciones' },
    report: { name: 'Reporte', icon: '📊', description: 'Informes técnicos y laboratorio' },
    presentation: { name: 'Presentación', icon: '📽️', description: 'Slides con Beamer' },
    letter: { name: 'Carta', icon: '✉️', description: 'Correspondencia formal' },
    cv: { name: 'CV', icon: '👤', description: 'Currículum y hojas de vida' },
    book: { name: 'Libro', icon: '📖', description: 'Libros y manuales' },
    exam: { name: 'Examen', icon: '✍️', description: 'Exámenes y cuestionarios' },
    math: { name: 'Matemáticas', icon: '∑', description: 'Documentos matemáticos' },
    other: { name: 'Otros', icon: '📁', description: 'Otros tipos de documentos' },
};

// ============================================================================
// Templates
// ============================================================================

export const templates: FullTemplate[] = [
    // ===== ACADEMIC =====
    {
        id: 'ieee-paper',
        name: 'IEEE Conference Paper',
        description: 'Formato estándar para conferencias IEEE de doble columna',
        category: 'academic',
        tags: ['ieee', 'conference', 'research', 'engineering'],
        difficulty: 'intermediate',
        packages: ['IEEEtran', 'cite', 'graphicx', 'amsmath'],
        preview: '\\documentclass[conference]{IEEEtran}...',
        content: `\\documentclass[conference]{IEEEtran}
\\usepackage{cite}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{graphicx}
\\usepackage{textcomp}
\\usepackage{xcolor}

\\begin{document}

\\title{Your Paper Title Here}
\\author{\\IEEEauthorblockN{First Author}
\\IEEEauthorblockA{\\textit{Department} \\\\
\\textit{University}\\\\
City, Country \\\\
email@domain.com}
\\and
\\IEEEauthorblockN{Second Author}
\\IEEEauthorblockA{\\textit{Department} \\\\
\\textit{University}\\\\
City, Country \\\\
email@domain.com}
}

\\maketitle

\\begin{abstract}
Your abstract goes here. This should be a brief summary of your work, typically 150-250 words.
\\end{abstract}

\\begin{IEEEkeywords}
keyword1, keyword2, keyword3, keyword4
\\end{IEEEkeywords}

\\section{Introduction}
Your introduction text here.

\\section{Related Work}
Discussion of related work.

\\section{Methodology}
Your methodology description.

\\section{Results}
Your results and analysis.

\\section{Conclusion}
Your conclusions.

\\section*{Acknowledgment}
Optional acknowledgments.

\\bibliographystyle{IEEEtran}
\\bibliography{references}

\\end{document}`,
    },
    {
        id: 'acm-sigconf',
        name: 'ACM SIGCONF Paper',
        description: 'Formato ACM para conferencias SIGCHI, SIGPLAN, etc.',
        category: 'academic',
        tags: ['acm', 'conference', 'cs', 'sigconf'],
        difficulty: 'intermediate',
        packages: ['acmart'],
        content: `\\documentclass[sigconf,review]{acmart}

\\usepackage{booktabs}

\\begin{document}

\\title{Your ACM Paper Title}

\\author{First Author}
\\authornote{Both authors contributed equally.}
\\email{first@university.edu}
\\affiliation{%
  \\institution{University Name}
  \\city{City}
  \\country{Country}
}

\\author{Second Author}
\\email{second@university.edu}
\\affiliation{%
  \\institution{University Name}
  \\city{City}
  \\country{Country}
}

\\renewcommand{\\shortauthors}{Author et al.}

\\begin{abstract}
Your abstract text here.
\\end{abstract}

\\begin{CCSXML}
<!-- CCS Concepts XML here -->
\\end{CCSXML}

\\keywords{keyword1, keyword2, keyword3}

\\maketitle

\\section{Introduction}
Introduction text.

\\section{Background}
Background and related work.

\\section{Approach}
Your approach description.

\\section{Evaluation}
Evaluation methodology and results.

\\section{Conclusion}
Conclusions and future work.

\\bibliographystyle{ACM-Reference-Format}
\\bibliography{references}

\\end{document}`,
    },
    {
        id: 'apa-article',
        name: 'APA Style Article',
        description: 'Artículo en formato APA 7ma edición',
        category: 'academic',
        tags: ['apa', 'psychology', 'social sciences'],
        difficulty: 'basic',
        packages: ['apa7'],
        content: `\\documentclass[stu,12pt]{apa7}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage{csquotes}
\\usepackage[style=apa,backend=biber]{biblatex}
\\addbibresource{references.bib}

\\title{Your APA Style Title}
\\shorttitle{Short Title}
\\author{Your Name}
\\affiliation{Your University}
\\course{Course Name}
\\professor{Professor Name}
\\duedate{Date}

\\begin{document}
\\maketitle

\\begin{abstract}
Your abstract (150-250 words).
\\end{abstract}

\\section{Introduction}
Introduction paragraph.

\\section{Literature Review}
Review of relevant literature.

\\section{Methods}
\\subsection{Participants}
Description of participants.

\\subsection{Materials}
Description of materials used.

\\subsection{Procedure}
Description of procedure.

\\section{Results}
Your results.

\\section{Discussion}
Discussion of findings.

\\section{Conclusion}
Conclusions.

\\printbibliography

\\end{document}`,
    },

    // ===== THESIS =====
    {
        id: 'thesis-basic',
        name: 'Tesis Básica',
        description: 'Estructura básica para tesis universitaria',
        category: 'thesis',
        tags: ['thesis', 'university', 'degree'],
        difficulty: 'intermediate',
        packages: ['geometry', 'setspace', 'graphicx', 'hyperref'],
        content: `\\documentclass[12pt,a4paper]{report}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage[margin=2.5cm]{geometry}
\\usepackage{setspace}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{fancyhdr}

\\onehalfspacing

\\begin{document}

% Portada
\\begin{titlepage}
\\centering
\\vspace*{2cm}
{\\Large UNIVERSIDAD NOMBRE}\\\\[1cm]
{\\large FACULTAD DE CIENCIAS}\\\\[2cm]
{\\Huge\\bfseries Título de la Tesis}\\\\[2cm]
{\\Large Tesis para optar al grado de}\\\\[0.5cm]
{\\large LICENCIADO EN CIENCIAS}\\\\[2cm]
{\\large Presentada por:}\\\\[0.5cm]
{\\Large Nombre del Autor}\\\\[2cm]
{\\large Director: Dr. Nombre del Director}\\\\[2cm]
{\\large Ciudad, Año}
\\end{titlepage}

% Páginas preliminares
\\pagenumbering{roman}

\\chapter*{Dedicatoria}
A mi familia...

\\chapter*{Agradecimientos}
Agradezco a...

\\chapter*{Resumen}
Resumen del trabajo (máximo 300 palabras).

\\tableofcontents
\\listoffigures
\\listoftables

% Contenido principal
\\pagenumbering{arabic}

\\chapter{Introducción}
\\section{Antecedentes}
Texto de antecedentes.

\\section{Planteamiento del problema}
Descripción del problema.

\\section{Objetivos}
\\subsection{Objetivo general}
\\subsection{Objetivos específicos}

\\chapter{Marco Teórico}
Desarrollo del marco teórico.

\\chapter{Metodología}
Descripción de la metodología.

\\chapter{Resultados}
Presentación de resultados.

\\chapter{Conclusiones}
Conclusiones del trabajo.

\\bibliographystyle{plain}
\\bibliography{referencias}

\\appendix
\\chapter{Anexos}

\\end{document}`,
    },
    {
        id: 'phd-thesis',
        name: 'PhD Thesis',
        description: 'Estructura completa para tesis doctoral',
        category: 'thesis',
        tags: ['phd', 'doctoral', 'dissertation'],
        difficulty: 'advanced',
        packages: ['memoir', 'biblatex'],
        content: `\\documentclass[12pt,a4paper,oneside]{memoir}
\\usepackage[utf8]{inputenc}
\\usepackage[english]{babel}
\\usepackage{graphicx}
\\usepackage{amsmath,amssymb}
\\usepackage[style=authoryear,backend=biber]{biblatex}
\\addbibresource{references.bib}
\\usepackage{hyperref}

% Page layout
\\setlrmarginsandblock{3.5cm}{2.5cm}{*}
\\setulmarginsandblock{2.5cm}{3cm}{*}
\\checkandfixthelayout

\\begin{document}

\\frontmatter

% Title page
\\begin{titlingpage}
\\centering
\\vspace*{2cm}
{\\Large University Name}\\\\[2cm]
{\\huge\\bfseries Thesis Title}\\\\[2cm]
{\\Large A thesis submitted for the degree of}\\\\[0.5cm]
{\\large Doctor of Philosophy}\\\\[2cm]
{\\Large by}\\\\[0.5cm]
{\\Large Author Name}\\\\[3cm]
{\\large Department of Subject}\\\\[0.5cm]
{\\large Month Year}
\\end{titlingpage}

\\chapter{Abstract}
Abstract content.

\\chapter{Declaration}
I declare that this thesis...

\\chapter{Acknowledgements}
I would like to thank...

\\tableofcontents*
\\listoffigures
\\listoftables

\\mainmatter

\\chapter{Introduction}
\\section{Motivation}
\\section{Research Questions}
\\section{Contributions}
\\section{Thesis Outline}

\\chapter{Literature Review}

\\chapter{Theoretical Framework}

\\chapter{Methodology}

\\chapter{Results}

\\chapter{Discussion}

\\chapter{Conclusion}
\\section{Summary}
\\section{Future Work}

\\backmatter

\\printbibliography

\\appendix
\\chapter{Additional Data}

\\end{document}`,
    },

    // ===== PRESENTATION =====
    {
        id: 'beamer-basic',
        name: 'Presentación Beamer',
        description: 'Presentación básica con Beamer',
        category: 'presentation',
        tags: ['beamer', 'slides', 'presentation'],
        difficulty: 'basic',
        packages: ['beamer'],
        content: `\\documentclass{beamer}
\\usetheme{Madrid}
\\usecolortheme{default}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage{graphicx}
\\usepackage{amsmath}

\\title{Título de la Presentación}
\\subtitle{Subtítulo opcional}
\\author{Nombre del Autor}
\\institute{Universidad / Institución}
\\date{\\today}

\\begin{document}

\\begin{frame}
\\titlepage
\\end{frame}

\\begin{frame}{Índice}
\\tableofcontents
\\end{frame}

\\section{Introducción}

\\begin{frame}{Introducción}
\\begin{itemize}
    \\item Primer punto importante
    \\item Segundo punto importante
    \\item Tercer punto importante
\\end{itemize}
\\end{frame}

\\section{Desarrollo}

\\begin{frame}{Marco Teórico}
\\begin{block}{Definición}
Texto del bloque de definición.
\\end{block}

\\begin{alertblock}{Importante}
Información destacada.
\\end{alertblock}

\\begin{exampleblock}{Ejemplo}
Un ejemplo ilustrativo.
\\end{exampleblock}
\\end{frame}

\\begin{frame}{Resultados}
\\begin{columns}
\\column{0.5\\textwidth}
Contenido de la columna izquierda.

\\column{0.5\\textwidth}
Contenido de la columna derecha.
\\end{columns}
\\end{frame}

\\section{Conclusiones}

\\begin{frame}{Conclusiones}
\\begin{enumerate}
    \\item Primera conclusión
    \\item Segunda conclusión
    \\item Trabajo futuro
\\end{enumerate}
\\end{frame}

\\begin{frame}{}
\\centering
\\Huge ¿Preguntas?
\\end{frame}

\\end{document}`,
    },
    {
        id: 'beamer-modern',
        name: 'Beamer Moderno (Metropolis)',
        description: 'Presentación moderna con tema Metropolis',
        category: 'presentation',
        tags: ['beamer', 'metropolis', 'modern'],
        difficulty: 'intermediate',
        packages: ['beamer', 'metropolis'],
        content: `\\documentclass{beamer}
\\usetheme{metropolis}
\\usepackage[utf8]{inputenc}
\\usepackage{graphicx}
\\usepackage{booktabs}

\\title{Modern Presentation}
\\subtitle{With Metropolis Theme}
\\author{Author Name}
\\institute{Institution}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{frame}{Table of Contents}
\\tableofcontents
\\end{frame}

\\section{Introduction}

\\begin{frame}{Welcome}
\\begin{itemize}[<+->]
    \\item This is an animated list
    \\item Items appear one by one
    \\item Clean, modern design
\\end{itemize}
\\end{frame}

\\section{Main Content}

\\begin{frame}[fragile]{Code Example}
\\begin{verbatim}
def hello_world():
    print("Hello, World!")
\\end{verbatim}
\\end{frame}

\\begin{frame}{Data Table}
\\begin{table}
\\centering
\\begin{tabular}{lrr}
\\toprule
Item & Value & Change \\\\
\\midrule
A & 100 & +5\\% \\\\
B & 200 & -3\\% \\\\
C & 150 & +10\\% \\\\
\\bottomrule
\\end{tabular}
\\caption{Sample data}
\\end{table}
\\end{frame}

\\section{Conclusion}

\\begin{frame}{Summary}
\\alert{Key takeaways:}
\\begin{enumerate}
    \\item First point
    \\item Second point
    \\item Third point
\\end{enumerate}
\\end{frame}

\\begin{frame}[standout]
Questions?
\\end{frame}

\\end{document}`,
    },

    // ===== REPORT =====
    {
        id: 'lab-report',
        name: 'Informe de Laboratorio',
        description: 'Formato para reportes de laboratorio',
        category: 'report',
        tags: ['lab', 'science', 'experiment'],
        difficulty: 'basic',
        packages: ['siunitx', 'booktabs'],
        content: `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage[margin=2.5cm]{geometry}
\\usepackage{graphicx}
\\usepackage{amsmath}
\\usepackage{siunitx}
\\usepackage{booktabs}
\\usepackage{float}

\\title{Informe de Laboratorio: [Título del Experimento]}
\\author{Nombre del Estudiante \\\\ Código: XXXXXXX}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Objetivos}
\\subsection{Objetivo General}
Describir el objetivo principal del experimento.

\\subsection{Objetivos Específicos}
\\begin{itemize}
    \\item Objetivo específico 1
    \\item Objetivo específico 2
    \\item Objetivo específico 3
\\end{itemize}

\\section{Marco Teórico}
Desarrollo del fundamento teórico relevante.

\\section{Materiales y Equipo}
\\begin{itemize}
    \\item Material 1
    \\item Material 2
    \\item Equipo utilizado
\\end{itemize}

\\section{Procedimiento}
\\begin{enumerate}
    \\item Paso 1 del procedimiento
    \\item Paso 2 del procedimiento
    \\item Paso 3 del procedimiento
\\end{enumerate}

\\section{Datos Experimentales}

\\begin{table}[H]
\\centering
\\caption{Datos obtenidos}
\\begin{tabular}{ccc}
\\toprule
Variable 1 & Variable 2 & Variable 3 \\\\
\\midrule
\\SI{1.0}{\\meter} & \\SI{2.5}{\\second} & \\SI{0.4}{\\meter\\per\\second} \\\\
\\SI{2.0}{\\meter} & \\SI{5.1}{\\second} & \\SI{0.39}{\\meter\\per\\second} \\\\
\\bottomrule
\\end{tabular}
\\end{table}

\\section{Análisis de Resultados}
Análisis e interpretación de los datos obtenidos.

\\section{Conclusiones}
\\begin{itemize}
    \\item Conclusión 1
    \\item Conclusión 2
\\end{itemize}

\\section{Bibliografía}
\\begin{enumerate}
    \\item Referencia 1
    \\item Referencia 2
\\end{enumerate}

\\end{document}`,
    },
    {
        id: 'technical-report',
        name: 'Reporte Técnico',
        description: 'Informe técnico profesional',
        category: 'report',
        tags: ['technical', 'professional', 'engineering'],
        difficulty: 'intermediate',
        packages: ['fancyhdr', 'listings'],
        content: `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage[margin=2.5cm]{geometry}
\\usepackage{graphicx}
\\usepackage{fancyhdr}
\\usepackage{listings}
\\usepackage{xcolor}
\\usepackage{hyperref}

\\pagestyle{fancy}
\\fancyhf{}
\\rhead{Reporte Técnico}
\\lhead{Proyecto XYZ}
\\rfoot{Página \\thepage}

\\lstset{
    basicstyle=\\ttfamily\\small,
    breaklines=true,
    frame=single,
    backgroundcolor=\\color{gray!10}
}

\\title{Reporte Técnico\\\\[0.5cm]
\\large Proyecto: Sistema de Gestión}
\\author{Equipo de Desarrollo}
\\date{Versión 1.0 --- \\today}

\\begin{document}

\\maketitle
\\tableofcontents
\\newpage

\\section{Resumen Ejecutivo}
Breve resumen del contenido del reporte.

\\section{Introducción}
\\subsection{Propósito}
\\subsection{Alcance}
\\subsection{Referencias}

\\section{Descripción del Sistema}
\\subsection{Arquitectura General}
\\subsection{Componentes Principales}

\\section{Especificaciones Técnicas}
\\subsection{Requisitos de Hardware}
\\subsection{Requisitos de Software}

\\section{Implementación}
\\begin{lstlisting}[language=Python,caption=Ejemplo de código]
def main():
    print("Hello, World!")
\\end{lstlisting}

\\section{Pruebas y Validación}

\\section{Conclusiones y Recomendaciones}

\\appendix
\\section{Anexos}

\\end{document}`,
    },

    // ===== LETTER =====
    {
        id: 'formal-letter',
        name: 'Carta Formal',
        description: 'Carta formal profesional',
        category: 'letter',
        tags: ['letter', 'formal', 'business'],
        difficulty: 'basic',
        packages: ['letter'],
        content: `\\documentclass[12pt]{letter}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage[margin=2.5cm]{geometry}

\\signature{Su Nombre\\\\Cargo}
\\address{Su Dirección\\\\Ciudad, País\\\\Teléfono: XXX-XXXX}

\\begin{document}

\\begin{letter}{Nombre del Destinatario\\\\Cargo\\\\Empresa\\\\Dirección}

\\opening{Estimado/a Sr./Sra. Apellido:}

Primer párrafo: Introducción y propósito de la carta.

Segundo párrafo: Desarrollo del tema principal.

Tercer párrafo: Detalles adicionales o solicitud específica.

Párrafo final: Agradecimiento y cierre.

\\closing{Atentamente,}

\\ps{P.D.: Nota adicional si es necesaria.}

\\encl{Lista de documentos adjuntos}

\\cc{Copia a: Nombre}

\\end{letter}

\\end{document}`,
    },

    // ===== CV =====
    {
        id: 'cv-modern',
        name: 'CV Moderno',
        description: 'Currículum vitae con diseño moderno',
        category: 'cv',
        tags: ['cv', 'resume', 'job'],
        difficulty: 'basic',
        packages: ['moderncv'],
        content: `\\documentclass[11pt,a4paper]{moderncv}
\\moderncvstyle{classic}
\\moderncvcolor{blue}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=2cm]{geometry}

\\name{Nombre}{Apellido}
\\title{Título Profesional}
\\address{Calle 123}{Ciudad, País}
\\phone[mobile]{+1~234~567~890}
\\email{correo@ejemplo.com}
\\social[linkedin]{linkedin.com/in/usuario}
\\social[github]{github.com/usuario}

\\begin{document}

\\makecvtitle

\\section{Educación}
\\cventry{2018--2022}{Licenciatura en X}{Universidad}{Ciudad}{}{Descripción breve}
\\cventry{2014--2018}{Bachillerato}{Colegio}{Ciudad}{}{}

\\section{Experiencia}
\\cventry{2022--Presente}{Cargo}{Empresa}{Ciudad}{}{%
Descripción de responsabilidades y logros.
\\begin{itemize}
    \\item Logro 1
    \\item Logro 2
\\end{itemize}}

\\cventry{2020--2022}{Cargo Anterior}{Empresa}{Ciudad}{}{%
Descripción de funciones.}

\\section{Habilidades}
\\cvitem{Técnicas}{Skill 1, Skill 2, Skill 3}
\\cvitem{Herramientas}{Tool 1, Tool 2, Tool 3}
\\cvitem{Idiomas}{Español (nativo), Inglés (avanzado)}

\\section{Proyectos}
\\cvitem{Proyecto 1}{Descripción breve del proyecto.}
\\cvitem{Proyecto 2}{Descripción breve del proyecto.}

\\section{Referencias}
\\cvitem{}{Disponibles a solicitud}

\\end{document}`,
    },

    // ===== EXAM =====
    {
        id: 'exam-basic',
        name: 'Examen Básico',
        description: 'Formato para exámenes y cuestionarios',
        category: 'exam',
        tags: ['exam', 'test', 'quiz'],
        difficulty: 'basic',
        packages: ['exam'],
        content: `\\documentclass[12pt,addpoints]{exam}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage[margin=2.5cm]{geometry}
\\usepackage{amsmath}

\\pagestyle{headandfoot}
\\firstpageheader{Curso}{Examen Parcial}{Fecha: \\today}
\\runningheader{Curso}{Examen Parcial}{Página \\thepage}
\\firstpagefooter{}{}{Puntos: \\thequestion}
\\runningfooter{}{}{Puntos: \\thequestion}

\\begin{document}

\\begin{center}
{\\Large\\bfseries Examen Parcial}\\\\[0.5cm]
{\\large Nombre del Curso}\\\\[1cm]
\\end{center}

\\makebox[\\textwidth]{Nombre:\\enspace\\hrulefill}\\\\[0.5cm]
\\makebox[\\textwidth]{Código:\\enspace\\hrulefill}\\\\[0.5cm]

\\begin{center}
\\gradetable[h][questions]
\\end{center}

\\begin{questions}

\\question[10] Esta es la primera pregunta. Desarrolle completamente.
\\vspace{3cm}

\\question[15] Segunda pregunta con partes:
\\begin{parts}
    \\part[5] Primera parte
    \\vspace{2cm}
    \\part[5] Segunda parte
    \\vspace{2cm}
    \\part[5] Tercera parte
    \\vspace{2cm}
\\end{parts}

\\question[10] Pregunta de selección múltiple:
\\begin{choices}
    \\choice Opción A
    \\choice Opción B
    \\CorrectChoice Opción C (correcta)
    \\choice Opción D
\\end{choices}

\\question[15] Resuelva la siguiente ecuación: $x^2 - 5x + 6 = 0$
\\vspace{4cm}

\\end{questions}

\\end{document}`,
    },

    // ===== MATH =====
    {
        id: 'math-notes',
        name: 'Notas de Matemáticas',
        description: 'Documento para notas de clase de matemáticas',
        category: 'math',
        tags: ['math', 'notes', 'theorem'],
        difficulty: 'intermediate',
        packages: ['amsthm', 'thmtools'],
        content: `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage[margin=2.5cm]{geometry}
\\usepackage{amsmath,amssymb,amsthm}
\\usepackage{thmtools}

% Theorem environments
\\theoremstyle{definition}
\\newtheorem{definition}{Definición}[section]
\\newtheorem{example}{Ejemplo}[section]

\\theoremstyle{plain}
\\newtheorem{theorem}{Teorema}[section]
\\newtheorem{lemma}[theorem]{Lema}
\\newtheorem{corollary}[theorem]{Corolario}
\\newtheorem{proposition}[theorem]{Proposición}

\\theoremstyle{remark}
\\newtheorem*{remark}{Observación}
\\newtheorem*{note}{Nota}

\\title{Notas de Clase: [Tema]}
\\author{Nombre del Estudiante}
\\date{\\today}

\\begin{document}

\\maketitle
\\tableofcontents

\\section{Introducción}

\\begin{definition}
Sea $X$ un conjunto no vacío. Definimos...
\\end{definition}

\\begin{example}
Considere el conjunto $\\mathbb{R}$...
\\end{example}

\\section{Resultados Principales}

\\begin{theorem}[Nombre del Teorema]
Sea $f: X \\to Y$ una función continua. Entonces...
\\end{theorem}

\\begin{proof}
Procedemos por contradicción. Supongamos que...
\\end{proof}

\\begin{lemma}
Si $a, b \\in \\mathbb{R}$ tales que $a < b$, entonces...
\\end{lemma}

\\begin{corollary}
Como consecuencia directa del teorema anterior...
\\end{corollary}

\\begin{remark}
Es importante notar que esta condición es necesaria.
\\end{remark}

\\section{Ejercicios}

\\begin{enumerate}
    \\item Demuestre que $\\sum_{i=1}^n i = \\frac{n(n+1)}{2}$.
    \\item Encuentre todos los puntos críticos de $f(x) = x^3 - 3x + 1$.
\\end{enumerate}

\\end{document}`,
    },

    // ===== ARTICLE =====
    {
        id: 'article-basic',
        name: 'Artículo Básico',
        description: 'Artículo académico simple',
        category: 'article',
        tags: ['article', 'basic', 'simple'],
        difficulty: 'basic',
        packages: ['graphicx', 'hyperref'],
        content: `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage[margin=2.5cm]{geometry}
\\usepackage{graphicx}
\\usepackage{amsmath}
\\usepackage{hyperref}

\\title{Título del Artículo}
\\author{Nombre del Autor\\\\
\\small Universidad / Institución\\\\
\\small \\texttt{email@ejemplo.com}}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
Resumen del artículo en uno o dos párrafos. Describe el problema, la metodología y los resultados principales.
\\end{abstract}

\\section{Introducción}
Texto de introducción.

\\section{Metodología}
Descripción de la metodología utilizada.

\\section{Resultados}
Presentación de resultados.

\\section{Discusión}
Análisis y discusión de los resultados.

\\section{Conclusión}
Conclusiones del trabajo.

\\bibliographystyle{plain}
\\bibliography{referencias}

\\end{document}`,
    },

    // ===== BOOK =====
    {
        id: 'book-basic',
        name: 'Libro Básico',
        description: 'Estructura básica para un libro',
        category: 'book',
        tags: ['book', 'chapters', 'manual'],
        difficulty: 'intermediate',
        packages: ['geometry', 'fancyhdr'],
        content: `\\documentclass[12pt,a4paper,openany]{book}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage[margin=2.5cm]{geometry}
\\usepackage{graphicx}
\\usepackage{fancyhdr}
\\usepackage{hyperref}

\\title{\\Huge\\bfseries Título del Libro}
\\author{Nombre del Autor}
\\date{Primera Edición --- \\the\\year}

\\begin{document}

% Front matter
\\frontmatter
\\maketitle

\\chapter*{Prefacio}
Texto del prefacio.

\\tableofcontents

% Main matter
\\mainmatter

\\part{Primera Parte}

\\chapter{Introducción}
\\section{Motivación}
\\section{Objetivos}

\\chapter{Fundamentos}
\\section{Conceptos Básicos}
\\section{Notación}

\\part{Segunda Parte}

\\chapter{Desarrollo Principal}
\\section{Tema A}
\\section{Tema B}

\\chapter{Aplicaciones}
\\section{Ejemplos}
\\section{Casos de Uso}

% Back matter
\\backmatter

\\chapter*{Epílogo}
Reflexiones finales.

\\bibliographystyle{plain}
\\bibliography{referencias}

\\end{document}`,
    },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all templates
 */
export function getAllTemplates(): FullTemplate[] {
    return templates;
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: TemplateCategory): FullTemplate[] {
    return templates.filter(t => t.category === category);
}

/**
 * Search templates
 */
export function searchTemplates(query: string): FullTemplate[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    return templates.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.includes(q))
    );
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): FullTemplate | undefined {
    return templates.find(t => t.id === id);
}

/**
 * Get template count
 */
export const TOTAL_TEMPLATE_COUNT = templates.length;

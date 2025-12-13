export const tesisGrado = {
    name: 'Tesis de Grado',
    category: 'Academic',
    description: 'Plantilla completa de tesis con portada, dedicatoria, índices y bibliografía',
    content: `
\\documentclass[12pt,a4paper,oneside]{book}

% ===== PAQUETES =====
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage{geometry}
\\usepackage{graphicx}
\\usepackage{setspace}
\\usepackage{fancyhdr}
\\usepackage{titlesec}
\\usepackage{tocbibind}
\\usepackage{hyperref}
\\usepackage[backend=biber,style=apa]{biblatex}

% ===== CONFIGURACIÓN =====
\\geometry{top=3cm, bottom=3cm, left=3.5cm, right=2.5cm}
\\onehalfspacing
\\addbibresource{bibliografia.bib}

% Enlaces en azul
\\hypersetup{
    colorlinks=true,
    linkcolor=blue,
    citecolor=blue,
    urlcolor=blue
}

% ===== INFORMACIÓN DE LA TESIS =====
\\newcommand{\\tituloTesis}{TÍTULO DE LA TESIS EN MAYÚSCULAS}
\\newcommand{\\autorTesis}{Nombre Completo del Autor}
\\newcommand{\\universidadNombre}{UNIVERSIDAD XYZ}
\\newcommand{\\facultadNombre}{Facultad de [Nombre de Facultad]}
\\newcommand{\\carreraNombre}{Carrera de [Nombre de Carrera]}
\\newcommand{\\tutorNombre}{Dr./Msc./Ing. [Nombre del Tutor]}
\\newcommand{\\ciudadAnio}{Ciudad - Año}

\\begin{document}

% ===== PORTADA =====
\\begin{titlepage}
    \\centering
    \\vspace*{1cm}
    
    % PLACEHOLDER: Reemplace esta línea con su logo/sello universitario
    % Ejemplo: \\includegraphics[width=4cm]{logo_universidad.png}
    \\fbox{\\parbox{4cm}{\\centering LOGO\\\\UNIVERSIDAD\\\\[1cm]}}
    
    \\vspace{1.5cm}
    {\\Large \\universidadNombre \\\\[0.3cm]}
    {\\large \\facultadNombre \\\\[0.3cm]}
    {\\large \\carreraNombre}
    
    \\vspace{2cm}
    {\\LARGE\\bfseries \\tituloTesis}
    
    \\vspace{2cm}
    {\\large Tesis presentada para optar al título de\\\\[0.3cm]}
    {\\large\\bfseries [TÍTULO PROFESIONAL]}
    
    \\vfill
    
    {\\large Por:\\\\[0.3cm]}
    {\\Large\\bfseries \\autorTesis}
    
    \\vspace{1cm}
    {\\large Tutor: \\tutorNombre}
    
    \\vspace{2cm}
    \\ciudadAnio
\\end{titlepage}

\\newpage
\\thispagestyle{empty}
\\mbox{}

% ===== DEDICATORIA =====
\\newpage
\\thispagestyle{empty}
\\vspace*{8cm}
\\begin{flushright}
\\textit{Dedicado a...}
\\end{flushright}

% ===== AGRADECIMIENTOS =====
\\chapter*{Agradecimientos}
\\addcontentsline{toc}{chapter}{Agradecimientos}
Texto de agradecimientos...

% ===== RESUMEN =====
\\chapter*{Resumen}
\\addcontentsline{toc}{chapter}{Resumen}
Breve resumen de la investigación...

\\textbf{Palabras clave:} palabra1, palabra2, palabra3

% ===== ÍNDICES =====
\\frontmatter
\\tableofcontents
\\listoffigures
\\listoftables

% ===== CUERPO PRINCIPAL =====
\\mainmatter

\\chapter{Introducción}
\\label{ch:intro}

Texto de introducción...

\\section{Antecedentes}
\\section{Planteamiento del Problema}
\\section{Objetivos}

\\subsection{Objetivo General}
\\subsection{Objetivos Específicos}

\\section{Justificación}
\\section{Alcance y Limitaciones}

\\chapter{Marco Teórico}
\\label{ch:marco}

Revisión de la literatura y fundamento teórico...

\\chapter{Metodología}
\\label{ch:metodologia}

Descripción de la metodología empleada...

\\chapter{Resultados}
\\label{ch:resultados}

Presentación de resultados...

\\chapter{Discusión}
\\label{ch:discusion}

Análisis y discusión de resultados...

\\chapter{Conclusiones y Recomendaciones}
\\label{ch:conclusiones}

\\section{Conclusiones}
\\section{Recomendaciones}

% ===== BIBLIOGRAFÍA =====
\\backmatter
\\printbibliography[heading=bibintoc,title={Bibliografía}]

% ===== ANEXOS =====
\\appendix
\\chapter{Anexo A: [Título]}
Contenido del anexo...

\\end{document}
`
};

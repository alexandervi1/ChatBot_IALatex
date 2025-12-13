import { LaTeXTemplate } from '.';

export const articuloBasico: LaTeXTemplate = {
  name: "Artículo Básico",
  category: "Academic",
  description: "Artículo académico con formato profesional, secciones estándar y ejemplos de figuras y tablas",
  content: `\\documentclass[12pt,a4paper]{article}

% --- PAQUETES ESENCIALES ---
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage[T1]{fontenc}

% --- FORMATO Y DISEÑO ---
\\usepackage[margin=2.5cm]{geometry}
\\usepackage{fancyhdr}
\\usepackage{setspace}
\\onehalfspacing

% --- GRÁFICOS Y TABLAS ---
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{caption}

% --- MATEMÁTICAS ---
\\usepackage{amsmath}
\\usepackage{amssymb}

% --- ENLACES E HIPERVÍNCULOS ---
\\usepackage[colorlinks=true,linkcolor=blue,citecolor=blue,urlcolor=blue]{hyperref}

% --- BIBLIOGRAFÍA ---
\\usepackage{cite}

% --- ENCABEZADO Y PIE DE PÁGINA ---
\\pagestyle{fancy}
\\fancyhf{}
\\rhead{\\thepage}
\\lhead{Título Corto del Artículo}

% --- INFORMACIÓN DEL DOCUMENTO ---
\\title{\\textbf{Título de Tu Artículo Académico}}
\\author{Tu Nombre\\\\
        \\small Departamento, Universidad\\\\
        \\small \\texttt{tu.email@universidad.edu}}
\\date{\\today}

\\begin{document}

\\maketitle

% --- RESUMEN ---
\\begin{abstract}
Este es el resumen de tu artículo. Debe ser conciso (150-250 palabras) y describir el objetivo, metodología, resultados principales y conclusiones de tu trabajo. El resumen permite a los lectores determinar rápidamente si el artículo es relevante para sus intereses.

\\textbf{Palabras clave:} Palabra 1, Palabra 2, Palabra 3, Palabra 4
\\end{abstract}

% --- INTRODUCCIÓN ---
\\section{Introducción}
La introducción establece el contexto de tu investigación. Aquí debes:
\\begin{itemize}
    \\item Presentar el tema general
    \\item Revisar brevemente la literatura relevante
    \\item Identificar el problema o pregunta de investigación
    \\item Explicar la importancia del estudio
    \\item Describir los objetivos específicos
\\end{itemize}

Puedes citar trabajos previos usando \\cite{ejemplo2024} para referencias bibliográficas.

% --- METODOLOGÍA ---
\\section{Metodología}
Describe los métodos utilizados en tu investigación. Esta sección debe ser lo suficientemente detallada para que otros puedan replicar tu trabajo.

\\subsection{Diseño del Estudio}
Explica el diseño experimental o metodológico utilizado.

\\subsection{Materiales y Procedimientos}
Detalla los materiales, equipos y procedimientos específicos.

% --- RESULTADOS ---
\\section{Resultados}
Presenta tus hallazgos de manera clara y objetiva. Utiliza tablas y figuras para facilitar la comprensión.

\\subsection{Ejemplo de Tabla}
La Tabla~\\ref{tab:ejemplo} muestra un ejemplo de cómo presentar datos tabulares.

\\begin{table}[h]
\\centering
\\caption{Resultados experimentales}
\\label{tab:ejemplo}
\\begin{tabular}{@{}lcc@{}}
\\toprule
\\textbf{Categoría} & \\textbf{Valor 1} & \\textbf{Valor 2} \\\\ \\midrule
Grupo A & 85.3 & 12.4 \\\\
Grupo B & 92.1 & 8.7 \\\\
Grupo C & 78.9 & 15.2 \\\\ \\bottomrule
\\end{tabular}
\\end{table}

\\subsection{Ejemplo de Figura}
La Figura~\\ref{fig:ejemplo} ilustra un concepto clave.

\\begin{figure}[h]
\\centering
% \\includegraphics[width=0.6\\textwidth]{imagen.png}
\\caption{Descripción de la figura (reemplaza con tu imagen)}
\\label{fig:ejemplo}
\\end{figure}

% --- DISCUSIÓN ---
\\section{Discusión}
Interpreta tus resultados en el contexto de la literatura existente. Discute:
\\begin{itemize}
    \\item Implicaciones de los hallazgos
    \\item Limitaciones del estudio
    \\item Comparación con trabajos previos
    \\item Posibles aplicaciones prácticas
\\end{itemize}

% --- CONCLUSIONES ---
\\section{Conclusiones}
Resume los puntos principales de tu trabajo y sus contribuciones. Sugiere direcciones para investigaciones futuras.

% --- AGRADECIMIENTOS (OPCIONAL) ---
\\section*{Agradecimientos}
Reconoce el apoyo financiero, técnico o intelectual recibido.

% --- REFERENCIAS ---
\\bibliographystyle{plain}
% \\bibliography{referencias} % Descomenta y crea un archivo .bib

% Ejemplo manual de referencias:
\\begin{thebibliography}{9}
\\bibitem{ejemplo2024}
Autor, A. y Coautor, B. (2024).
\\textit{Título del artículo}.
Nombre de la Revista, 10(2), 123-145.
\\end{thebibliography}

\\end{document}`,
};

import { LaTeXTemplate } from '.';

export const presentacionBeamer: LaTeXTemplate = {
  name: "Presentación (Beamer)",
  category: "Presentations",
  description: "Presentación profesional con Beamer, temas personalizables y estructura de diapositivas",
  content: `\\documentclass{beamer}
\\usepackage[spanish]{babel}

\\usetheme{Madrid}
\\usecolortheme{default}

\\title[Título Corto]{Título Completo de la Presentación}
\\author{Tu Nombre}
\\institute{Tu Institución}
\\date{\\today}

\\begin{document}

\\begin{frame}
  \\titlepage
\\end{frame}

\\begin{frame}{Contenido}
  \\tableofcontents
\\end{frame}

\\section{Introducción}
\\begin{frame}{Título de la Diapositiva}
  \\begin{itemize}
    \\item Primer punto.
    \\item Segundo punto.
    \\item Tercer punto.
  \\end{itemize}
\\end{frame}

\\section{Conclusión}
\\begin{frame}{Preguntas}
  ¿Preguntas?
\\end{frame}

\\end{document}`,
};

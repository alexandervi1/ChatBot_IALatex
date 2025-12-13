import { LaTeXTemplate } from '.';

export const articuloMatematicasAMS: LaTeXTemplate = {
  name: "Artículo de Matemáticas (AMS)",
  category: "Academic",
  description: "Artículo matemático con paquetes AMS, teoremas, lemas y demostraciones",
  content: `\\documentclass{amsart}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}

\\newtheorem{theorem}{Theorem}[section]
\\newtheorem{lemma}[theorem]{Lemma}

\\title[Título Corto]{Título del Paper de Matemáticas}
\\author{Tu Nombre}

\\begin{document}

\\begin{abstract}
El resumen (abstract) va aquí.
\\end{abstract}

\\maketitle

\\section{Introducción}

\\begin{theorem}[Nombre del Teorema]
La declaración del teorema va aquí.
\\end{theorem}

\\begin{proof}
La prueba del teorema va aquí.
\\end{proof}

\\end{document}`,
};

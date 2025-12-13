import { LaTeXTemplate } from '.';

export const informeTecnico: LaTeXTemplate = {
  name: "Informe Técnico",
  category: "Reports & Books",
  description: "Informe técnico con abstract, metodología, resultados y conclusiones",
  content: `\\documentclass[12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage{amsmath}
\\usepackage{graphicx}
\\usepackage{hyperref}

\\title{Informe Técnico: [Título del Informe]}
\\author{Autor 1 \\\\ Autor 2}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
Resumen del informe técnico.
\\end{abstract}

\\section{Introducción}
Descripción del problema y objetivos.

\\section{Metodología}
Detalles de la metodología utilizada.

\\section{Resultados}
Presentación y análisis de los resultados.

\\section{Conclusiones}
Conclusiones y recomendaciones.

\\end{document}`,
};

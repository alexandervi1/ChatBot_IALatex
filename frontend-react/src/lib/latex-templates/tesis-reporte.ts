import { LaTeXTemplate } from '.';

export const tesisReporte: LaTeXTemplate = {
  name: "Tesis / Reporte",
  category: "Academic",
  description: "Estructura completa de tesis o reporte largo con capítulos, abstract y apéndices",
  content: `\\documentclass[12pt, a4paper]{report}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage{graphicx}
\\usepackage{setspace}
\\onehalfspacing

\\title{Título de la Tesis}
\\author{Tu Nombre}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
Resumen de la tesis.
\\end{abstract}

\\tableofcontents

\\chapter{Introducción}

\\chapter{Revisión de la Literatura}

\\chapter{Metodología}

\\chapter{Resultados}

\\chapter{Conclusión}

\\appendix
\\chapter{Apéndice A}

\\end{document}`,
};

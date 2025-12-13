import { LaTeXTemplate } from '.';

export const libroBook: LaTeXTemplate = {
  name: "Libro (Book)",
  category: "Reports & Books",
  description: "Estructura completa de libro con frontmatter, mainmatter, backmatter y capítulos",
  content: `\\documentclass[12pt, openany]{book}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage{graphicx}
\\usepackage{lipsum} % Para texto de relleno

\\title{Título del Libro}
\\author{Tu Nombre}
\\date{\\today}

\\begin{document}

\\frontmatter
\\maketitle
\\tableofcontents

\\mainmatter
\\chapter{Primer Capítulo}
\\lipsum[1-5]

\\section{Primera Sección}
\\lipsum[6-10]

\\chapter{Segundo Capítulo}
\\lipsum[11-15]

\\backmatter
% Aquí puedes incluir apéndices, bibliografía, etc.

\\end{document}`,
};

import { LaTeXTemplate } from '.';

export const tareaUniversitaria: LaTeXTemplate = {
  name: "Tarea Universitaria",
  category: "Academic",
  description: "Formato simple para tareas y trabajos universitarios con preguntas numeradas",
  content: `\\documentclass[12pt]{article}
\\usepackage{amsmath,amssymb}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage[a4paper, total={6in, 8in}]{geometry}

\\author{Tu Nombre}
\\title{Nombre de la Asignatura \\\\ Tarea N°: 1}
\\date{\\today}

\\begin{document}

\\maketitle

\\section*{Pregunta 1}
La respuesta a la primera pregunta va aquí.

\\section*{Pregunta 2}
La respuesta a la segunda pregunta va aquí.

\\end{document}`,
};

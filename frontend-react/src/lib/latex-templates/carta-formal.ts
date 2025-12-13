import { LaTeXTemplate } from '.';

export const cartaFormal: LaTeXTemplate = {
  name: "Carta Formal",
  category: "Professional",
  description: "Carta formal profesional con formato estándar de correspondencia",
  content: `\\documentclass[12pt]{letter}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}

\\address{Tu Nombre \\\\ Tu Dirección \\\\ Tu Ciudad, Código Postal}
\\signature{Tu Nombre}

\\begin{document}

\\begin{letter}{Nombre del Destinatario \\\\ Dirección del Destinatario \\\\ Ciudad, Código Postal}

\\opening{Estimado/a [Nombre del Destinatario]},

Escribe el cuerpo de la carta aquí.

\\closing{Atentamente,}

\\end{letter}

\\end{document}`,
};

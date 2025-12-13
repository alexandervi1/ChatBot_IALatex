import { LaTeXTemplate } from '.';

export const curriculumVitae: LaTeXTemplate = {
    name: "Currículum Vitae (CV)",
    category: "Professional",
    description: "CV tradicional con secciones de educación, experiencia y habilidades",
    content: `\\documentclass[a4paper,11pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage[T1]{fontenc}
\\usepackage{hyperref}

% --- FORMATO ---
\\pagestyle{empty}
\\titleformat{\\section}{\\scshape\\raggedright\\large}{}{0em}{}[\\titlerule]

% --- SECCIONES ---
\\newcommand{\\contactinfo}[3]{
  \\centerline{\\large\\bfseries #1 \\hfill #2 \\hfill #3}
}

\\newcommand{\\sectionbreak}{\\vspace{8pt}}

\\begin{document}

% --- ENCABEZADO ---
\\begin{center}
    {\\Huge\\scshape Tu Nombre}
    \\sectionbreak
    \\contactinfo{Tu Dirección}{tu.email@dominio.com}{+123 456 7890}
\\end{center}

% --- EDUCACIÓN ---
\\section{Educación}
\\begin{itemize}
    \\item \\textbf{Tu Título}, Universidad, Ciudad \\hfill {\\em Fechas}
    \\item Grado, Instituto, Ciudad \\hfill {\\em Fechas}
\\end{itemize}
\\sectionbreak

% --- EXPERIENCIA ---
\\section{Experiencia}
\\begin{itemize}
    \\item \\textbf{Cargo}, Empresa, Ciudad \\hfill {\\em Fechas}
    \\begin{itemize}
        \\item Logro o responsabilidad 1.
        \\item Logro o responsabilidad 2.
    \\end{itemize}
\\end{itemize}
\\sectionbreak

% --- HABILIDADES ---
\\section{Habilidades}
\\begin{itemize}
    \\item \\textbf{Lenguajes de Programación:} Python, C++, JavaScript
    \\item \\textbf{Idiomas:} Español (Nativo), Inglés (Profesional)
\\end{itemize}

\\end{document}`,
};

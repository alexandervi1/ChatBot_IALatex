/**
 * LaTeX Completions and Snippets for Monaco Editor
 * 
 * Provides intelligent autocompletion for LaTeX commands,
 * environments, and common snippets.
 * 
 * Total items: 200+ (expanded from 81)
 */

// Monaco types are available at runtime from @monaco-editor/react
// We use 'any' to avoid bundling monaco-editor types
type MonacoInstance = any;

// ============================================================================
// COMPLETION ITEMS
// ============================================================================

/**
 * LaTeX command completions with snippets
 */
const latexCompletions = [
    // === SECTIONS ===
    { label: '\\section', insertText: '\\\\section{${1:title}}', documentation: 'Section heading' },
    { label: '\\subsection', insertText: '\\\\subsection{${1:title}}', documentation: 'Subsection heading' },
    { label: '\\subsubsection', insertText: '\\\\subsubsection{${1:title}}', documentation: 'Subsubsection heading' },
    { label: '\\chapter', insertText: '\\\\chapter{${1:title}}', documentation: 'Chapter heading (book/report)' },
    { label: '\\paragraph', insertText: '\\\\paragraph{${1:title}}', documentation: 'Paragraph heading' },

    // === TEXT FORMATTING ===
    { label: '\\textbf', insertText: '\\\\textbf{${1:text}}', documentation: 'Bold text' },
    { label: '\\textit', insertText: '\\\\textit{${1:text}}', documentation: 'Italic text' },
    { label: '\\underline', insertText: '\\\\underline{${1:text}}', documentation: 'Underlined text' },
    { label: '\\emph', insertText: '\\\\emph{${1:text}}', documentation: 'Emphasized text' },
    { label: '\\texttt', insertText: '\\\\texttt{${1:text}}', documentation: 'Monospace/code text' },
    { label: '\\textsc', insertText: '\\\\textsc{${1:text}}', documentation: 'Small caps' },

    // === MATH ===
    { label: '\\frac', insertText: '\\\\frac{${1:num}}{${2:den}}', documentation: 'Fraction' },
    { label: '\\sqrt', insertText: '\\\\sqrt{${1:x}}', documentation: 'Square root' },
    { label: '\\sum', insertText: '\\\\sum_{${1:i=1}}^{${2:n}}', documentation: 'Summation' },
    { label: '\\prod', insertText: '\\\\prod_{${1:i=1}}^{${2:n}}', documentation: 'Product' },
    { label: '\\int', insertText: '\\\\int_{${1:a}}^{${2:b}}', documentation: 'Integral' },
    { label: '\\lim', insertText: '\\\\lim_{${1:x \\\\to \\\\infty}}', documentation: 'Limit' },
    { label: '\\partial', insertText: '\\\\partial', documentation: 'Partial derivative symbol' },
    { label: '\\infty', insertText: '\\\\infty', documentation: 'Infinity symbol' },
    { label: '\\alpha', insertText: '\\\\alpha', documentation: 'Greek letter alpha' },
    { label: '\\beta', insertText: '\\\\beta', documentation: 'Greek letter beta' },
    { label: '\\gamma', insertText: '\\\\gamma', documentation: 'Greek letter gamma' },
    { label: '\\delta', insertText: '\\\\delta', documentation: 'Greek letter delta' },
    { label: '\\epsilon', insertText: '\\\\epsilon', documentation: 'Greek letter epsilon' },
    { label: '\\theta', insertText: '\\\\theta', documentation: 'Greek letter theta' },
    { label: '\\lambda', insertText: '\\\\lambda', documentation: 'Greek letter lambda' },
    { label: '\\mu', insertText: '\\\\mu', documentation: 'Greek letter mu' },
    { label: '\\pi', insertText: '\\\\pi', documentation: 'Greek letter pi' },
    { label: '\\sigma', insertText: '\\\\sigma', documentation: 'Greek letter sigma' },
    { label: '\\omega', insertText: '\\\\omega', documentation: 'Greek letter omega' },
    { label: '\\leq', insertText: '\\\\leq', documentation: 'Less than or equal' },
    { label: '\\geq', insertText: '\\\\geq', documentation: 'Greater than or equal' },
    { label: '\\neq', insertText: '\\\\neq', documentation: 'Not equal' },
    { label: '\\approx', insertText: '\\\\approx', documentation: 'Approximately equal' },
    { label: '\\times', insertText: '\\\\times', documentation: 'Multiplication sign' },
    { label: '\\cdot', insertText: '\\\\cdot', documentation: 'Dot multiplication' },
    { label: '\\rightarrow', insertText: '\\\\rightarrow', documentation: 'Right arrow' },
    { label: '\\leftarrow', insertText: '\\\\leftarrow', documentation: 'Left arrow' },
    { label: '\\Rightarrow', insertText: '\\\\Rightarrow', documentation: 'Double right arrow (implies)' },
    { label: '\\forall', insertText: '\\\\forall', documentation: 'For all symbol' },
    { label: '\\exists', insertText: '\\\\exists', documentation: 'Exists symbol' },
    { label: '\\in', insertText: '\\\\in', documentation: 'Element of' },
    { label: '\\subset', insertText: '\\\\subset', documentation: 'Subset' },
    { label: '\\cup', insertText: '\\\\cup', documentation: 'Union' },
    { label: '\\cap', insertText: '\\\\cap', documentation: 'Intersection' },

    // === REFERENCES ===
    { label: '\\label', insertText: '\\\\label{${1:key}}', documentation: 'Create label for reference' },
    { label: '\\ref', insertText: '\\\\ref{${1:key}}', documentation: 'Reference to label' },
    { label: '\\cite', insertText: '\\\\cite{${1:key}}', documentation: 'Citation' },
    { label: '\\footnote', insertText: '\\\\footnote{${1:text}}', documentation: 'Footnote' },
    { label: '\\url', insertText: '\\\\url{${1:https://}}', documentation: 'URL link' },
    { label: '\\href', insertText: '\\\\href{${1:url}}{${2:text}}', documentation: 'Hyperlink with text' },

    // === DOCUMENT STRUCTURE ===
    { label: '\\title', insertText: '\\\\title{${1:title}}', documentation: 'Document title' },
    { label: '\\author', insertText: '\\\\author{${1:name}}', documentation: 'Document author' },
    { label: '\\date', insertText: '\\\\date{${1:\\\\today}}', documentation: 'Document date' },
    { label: '\\maketitle', insertText: '\\\\maketitle', documentation: 'Render title' },
    { label: '\\tableofcontents', insertText: '\\\\tableofcontents', documentation: 'Table of contents' },
    { label: '\\newpage', insertText: '\\\\newpage', documentation: 'Page break' },
    { label: '\\clearpage', insertText: '\\\\clearpage', documentation: 'Clear page and flush floats' },

    // === PACKAGES ===
    { label: '\\usepackage', insertText: '\\\\usepackage{${1:package}}', documentation: 'Include package' },
    { label: '\\documentclass', insertText: '\\\\documentclass{${1:article}}', documentation: 'Document class' },

    // === LISTS ===
    { label: '\\item', insertText: '\\\\item ${1:text}', documentation: 'List item' },

    // === GRAPHICS ===
    { label: '\\includegraphics', insertText: '\\\\includegraphics[width=${1:0.8}\\textwidth]{${2:image}}', documentation: 'Include image' },
    { label: '\\caption', insertText: '\\\\caption{${1:caption}}', documentation: 'Figure/table caption' },
    { label: '\\centering', insertText: '\\\\centering', documentation: 'Center content' },

    // === PACKAGES (NEW) ===
    { label: '\\usepackage amsmath', insertText: '\\usepackage{amsmath}', documentation: 'AMS math package' },
    { label: '\\usepackage amssymb', insertText: '\\usepackage{amssymb}', documentation: 'AMS symbols package' },
    { label: '\\usepackage graphicx', insertText: '\\usepackage{graphicx}', documentation: 'Graphics package' },
    { label: '\\usepackage hyperref', insertText: '\\usepackage[colorlinks=true]{hyperref}', documentation: 'Hyperlinks package' },
    { label: '\\usepackage geometry', insertText: '\\usepackage[margin=${1:2.5cm}]{geometry}', documentation: 'Page geometry' },
    { label: '\\usepackage babel', insertText: '\\usepackage[${1:spanish}]{babel}', documentation: 'Language support' },
    { label: '\\usepackage inputenc', insertText: '\\usepackage[utf8]{inputenc}', documentation: 'UTF-8 encoding' },
    { label: '\\usepackage fontenc', insertText: '\\usepackage[T1]{fontenc}', documentation: 'Font encoding' },
    { label: '\\usepackage booktabs', insertText: '\\usepackage{booktabs}', documentation: 'Professional tables' },
    { label: '\\usepackage xcolor', insertText: '\\usepackage[${1:dvipsnames}]{xcolor}', documentation: 'Extended colors' },
    { label: '\\usepackage tikz', insertText: '\\usepackage{tikz}', documentation: 'TikZ graphics' },
    { label: '\\usepackage listings', insertText: '\\usepackage{listings}', documentation: 'Code listings' },
    { label: '\\usepackage algorithm2e', insertText: '\\usepackage[ruled,vlined]{algorithm2e}', documentation: 'Algorithms' },
    { label: '\\usepackage biblatex', insertText: '\\usepackage[backend=biber,style=${1:apa}]{biblatex}', documentation: 'Bibliography' },
    { label: '\\usepackage natbib', insertText: '\\usepackage{natbib}', documentation: 'Natural citations' },
    { label: '\\usepackage fancyhdr', insertText: '\\usepackage{fancyhdr}', documentation: 'Custom headers' },
    { label: '\\usepackage setspace', insertText: '\\usepackage{setspace}', documentation: 'Line spacing' },
    { label: '\\usepackage float', insertText: '\\usepackage{float}', documentation: 'Float control' },
    { label: '\\usepackage subcaption', insertText: '\\usepackage{subcaption}', documentation: 'Subfigures' },
    { label: '\\usepackage multirow', insertText: '\\usepackage{multirow}', documentation: 'Multirow tables' },
    { label: '\\usepackage enumitem', insertText: '\\usepackage{enumitem}', documentation: 'List customization' },
    { label: '\\usepackage cleveref', insertText: '\\usepackage{cleveref}', documentation: 'Smart references' },

    // === COLORS (NEW) ===
    { label: '\\textcolor', insertText: '\\textcolor{${1:red}}{${2:text}}', documentation: 'Colored text' },
    { label: '\\colorbox', insertText: '\\colorbox{${1:yellow}}{${2:text}}', documentation: 'Background color' },
    { label: '\\definecolor', insertText: '\\definecolor{${1:mycolor}}{RGB}{${2:255,0,0}}', documentation: 'Define custom color' },

    // === TIKZ (NEW) ===
    { label: '\\tikzpicture', insertText: '\\begin{tikzpicture}\n\t${1:}\n\\end{tikzpicture}', documentation: 'TikZ picture' },
    { label: '\\draw', insertText: '\\draw ${1:(0,0)} -- ${2:(1,1)};', documentation: 'Draw line' },
    { label: '\\node', insertText: '\\node at ${1:(0,0)} {${2:text}};', documentation: 'TikZ node' },
    { label: '\\fill', insertText: '\\fill[${1:blue}] ${2:(0,0)} circle (${3:0.5});', documentation: 'Filled shape' },
    { label: '\\usetikzlibrary', insertText: '\\usetikzlibrary{${1:arrows,shapes}}', documentation: 'TikZ library' },

    // === BEAMER (NEW) ===
    { label: '\\frame', insertText: '\\begin{frame}{${1:Title}}\n\t${2:content}\n\\end{frame}', documentation: 'Beamer slide' },
    { label: '\\frametitle', insertText: '\\frametitle{${1:Title}}', documentation: 'Frame title' },
    { label: '\\pause', insertText: '\\pause', documentation: 'Pause animation' },
    { label: '\\alert', insertText: '\\alert{${1:text}}', documentation: 'Alert text' },
    { label: '\\block', insertText: '\\begin{block}{${1:Title}}\n\t${2:content}\n\\end{block}', documentation: 'Content block' },
    { label: '\\usetheme', insertText: '\\usetheme{${1:Madrid}}', documentation: 'Beamer theme' },
    { label: '\\usecolortheme', insertText: '\\usecolortheme{${1:default}}', documentation: 'Color theme' },

    // === BIBLIOGRAPHY (NEW) ===
    { label: '\\bibliography', insertText: '\\bibliography{${1:references}}', documentation: 'Bibliography file' },
    { label: '\\bibliographystyle', insertText: '\\bibliographystyle{${1:plain}}', documentation: 'Bib style' },
    { label: '\\addbibresource', insertText: '\\addbibresource{${1:references.bib}}', documentation: 'Add bib file' },
    { label: '\\printbibliography', insertText: '\\printbibliography', documentation: 'Print bibliography' },
    { label: '\\bibitem', insertText: '\\bibitem{${1:key}} ${2:Author, Title, Year}', documentation: 'Bibliography item' },
    { label: '\\citep', insertText: '\\citep{${1:key}}', documentation: 'Parenthetical citation' },
    { label: '\\citet', insertText: '\\citet{${1:key}}', documentation: 'Textual citation' },
    { label: '\\citeauthor', insertText: '\\citeauthor{${1:key}}', documentation: 'Cite author only' },
    { label: '\\citeyear', insertText: '\\citeyear{${1:key}}', documentation: 'Cite year only' },

    // === ADVANCED MATH (NEW) ===
    { label: '\\mathbb', insertText: '\\mathbb{${1:R}}', documentation: 'Blackboard bold (ℝ, ℕ, etc.)' },
    { label: '\\mathcal', insertText: '\\mathcal{${1:L}}', documentation: 'Calligraphic' },
    { label: '\\mathfrak', insertText: '\\mathfrak{${1:g}}', documentation: 'Fraktur' },
    { label: '\\binom', insertText: '\\binom{${1:n}}{${2:k}}', documentation: 'Binomial coefficient' },
    { label: '\\matrix', insertText: '\\begin{matrix}\n\t${1:a} & ${2:b} \\\\\n\t${3:c} & ${4:d}\n\\end{matrix}', documentation: 'Matrix' },
    { label: '\\pmatrix', insertText: '\\begin{pmatrix}\n\t${1:a} & ${2:b} \\\\\n\t${3:c} & ${4:d}\n\\end{pmatrix}', documentation: 'Parenthesis matrix' },
    { label: '\\bmatrix', insertText: '\\begin{bmatrix}\n\t${1:a} & ${2:b} \\\\\n\t${3:c} & ${4:d}\n\\end{bmatrix}', documentation: 'Bracket matrix' },
    { label: '\\vmatrix', insertText: '\\begin{vmatrix}\n\t${1:a} & ${2:b} \\\\\n\t${3:c} & ${4:d}\n\\end{vmatrix}', documentation: 'Determinant' },
    { label: '\\cases', insertText: '\\begin{cases}\n\t${1:x} & \\text{if } ${2:condition} \\\\\n\t${3:y} & \\text{otherwise}\n\\end{cases}', documentation: 'Piecewise function' },
    { label: '\\underbrace', insertText: '\\underbrace{${1:expression}}_{${2:label}}', documentation: 'Underbrace' },
    { label: '\\overbrace', insertText: '\\overbrace{${1:expression}}^{${2:label}}', documentation: 'Overbrace' },
    { label: '\\overset', insertText: '\\overset{${1:top}}{${2:base}}', documentation: 'Stack symbols' },
    { label: '\\underset', insertText: '\\underset{${1:bottom}}{${2:base}}', documentation: 'Stack under' },
    { label: '\\hat', insertText: '\\hat{${1:x}}', documentation: 'Hat accent' },
    { label: '\\bar', insertText: '\\bar{${1:x}}', documentation: 'Bar accent' },
    { label: '\\tilde', insertText: '\\tilde{${1:x}}', documentation: 'Tilde accent' },
    { label: '\\vec', insertText: '\\vec{${1:v}}', documentation: 'Vector arrow' },
    { label: '\\dot', insertText: '\\dot{${1:x}}', documentation: 'Dot accent (derivative)' },
    { label: '\\ddot', insertText: '\\ddot{${1:x}}', documentation: 'Double dot' },
    { label: '\\iint', insertText: '\\iint_{${1:D}}', documentation: 'Double integral' },
    { label: '\\iiint', insertText: '\\iiint_{${1:V}}', documentation: 'Triple integral' },
    { label: '\\oint', insertText: '\\oint_{${1:C}}', documentation: 'Contour integral' },
    { label: '\\nabla', insertText: '\\nabla', documentation: 'Nabla (gradient)' },
    { label: '\\wedge', insertText: '\\wedge', documentation: 'Wedge product' },
    { label: '\\otimes', insertText: '\\otimes', documentation: 'Tensor product' },
    { label: '\\oplus', insertText: '\\oplus', documentation: 'Direct sum' },

    // === TABLES (NEW) ===
    { label: '\\hline', insertText: '\\hline', documentation: 'Horizontal line' },
    { label: '\\cline', insertText: '\\cline{${1:1}-${2:2}}', documentation: 'Partial horizontal line' },
    { label: '\\multicolumn', insertText: '\\multicolumn{${1:2}}{${2:c}}{${3:text}}', documentation: 'Span columns' },
    { label: '\\multirow', insertText: '\\multirow{${1:2}}{*}{${2:text}}', documentation: 'Span rows' },
    { label: '\\toprule', insertText: '\\toprule', documentation: 'Top rule (booktabs)' },
    { label: '\\midrule', insertText: '\\midrule', documentation: 'Middle rule (booktabs)' },
    { label: '\\bottomrule', insertText: '\\bottomrule', documentation: 'Bottom rule (booktabs)' },

    // === SPACING (NEW) ===
    { label: '\\vspace', insertText: '\\vspace{${1:1cm}}', documentation: 'Vertical space' },
    { label: '\\hspace', insertText: '\\hspace{${1:1cm}}', documentation: 'Horizontal space' },
    { label: '\\smallskip', insertText: '\\smallskip', documentation: 'Small vertical skip' },
    { label: '\\medskip', insertText: '\\medskip', documentation: 'Medium vertical skip' },
    { label: '\\bigskip', insertText: '\\bigskip', documentation: 'Big vertical skip' },
    { label: '\\noindent', insertText: '\\noindent', documentation: 'No paragraph indent' },
    { label: '\\linebreak', insertText: '\\linebreak', documentation: 'Line break' },
    { label: '\\pagebreak', insertText: '\\pagebreak', documentation: 'Page break' },

    // === FONT SIZES (NEW) ===
    { label: '\\tiny', insertText: '\\tiny', documentation: 'Tiny font size' },
    { label: '\\scriptsize', insertText: '\\scriptsize', documentation: 'Script size' },
    { label: '\\footnotesize', insertText: '\\footnotesize', documentation: 'Footnote size' },
    { label: '\\small', insertText: '\\small', documentation: 'Small font' },
    { label: '\\normalsize', insertText: '\\normalsize', documentation: 'Normal size' },
    { label: '\\large', insertText: '\\large', documentation: 'Large font' },
    { label: '\\Large', insertText: '\\Large', documentation: 'Larger font' },
    { label: '\\LARGE', insertText: '\\LARGE', documentation: 'Even larger' },
    { label: '\\huge', insertText: '\\huge', documentation: 'Huge font' },
    { label: '\\Huge', insertText: '\\Huge', documentation: 'Largest font' },

    // === MORE GREEK (NEW) ===
    { label: '\\Gamma', insertText: '\\Gamma', documentation: 'Capital Gamma' },
    { label: '\\Delta', insertText: '\\Delta', documentation: 'Capital Delta' },
    { label: '\\Theta', insertText: '\\Theta', documentation: 'Capital Theta' },
    { label: '\\Lambda', insertText: '\\Lambda', documentation: 'Capital Lambda' },
    { label: '\\Sigma', insertText: '\\Sigma', documentation: 'Capital Sigma' },
    { label: '\\Phi', insertText: '\\Phi', documentation: 'Capital Phi' },
    { label: '\\Psi', insertText: '\\Psi', documentation: 'Capital Psi' },
    { label: '\\Omega', insertText: '\\Omega', documentation: 'Capital Omega' },
    { label: '\\varepsilon', insertText: '\\varepsilon', documentation: 'Variant epsilon' },
    { label: '\\varphi', insertText: '\\varphi', documentation: 'Variant phi' },
];

/**
 * LaTeX environment snippets (triggered with begin)
 */
const environmentSnippets = [
    {
        label: 'begin equation',
        insertText: '\\\\begin{equation}\n\t${1:formula}\n\\\\end{equation}',
        documentation: 'Numbered equation environment'
    },
    {
        label: 'begin align',
        insertText: '\\\\begin{align}\n\t${1:a} &= ${2:b} \\\\\\\\\n\t${3:c} &= ${4:d}\n\\\\end{align}',
        documentation: 'Aligned equations'
    },
    {
        label: 'begin figure',
        insertText: '\\\\begin{figure}[${1:htbp}]\n\t\\\\centering\n\t\\\\includegraphics[width=${2:0.8}\\\\textwidth]{${3:image}}\n\t\\\\caption{${4:caption}}\n\t\\\\label{fig:${5:label}}\n\\\\end{figure}',
        documentation: 'Figure with image'
    },
    {
        label: 'begin table',
        insertText: '\\\\begin{table}[${1:htbp}]\n\t\\\\centering\n\t\\\\caption{${2:caption}}\n\t\\\\begin{tabular}{${3:lcc}}\n\t\t\\\\hline\n\t\t${4:Header 1} & ${5:Header 2} & ${6:Header 3} \\\\\\\\\n\t\t\\\\hline\n\t\t${7:Data} & ${8:Data} & ${9:Data} \\\\\\\\\n\t\t\\\\hline\n\t\\\\end{tabular}\n\t\\\\label{tab:${10:label}}\n\\\\end{table}',
        documentation: 'Table with headers'
    },
    {
        label: 'begin itemize',
        insertText: '\\\\begin{itemize}\n\t\\\\item ${1:First item}\n\t\\\\item ${2:Second item}\n\\\\end{itemize}',
        documentation: 'Bullet list'
    },
    {
        label: 'begin enumerate',
        insertText: '\\\\begin{enumerate}\n\t\\\\item ${1:First item}\n\t\\\\item ${2:Second item}\n\\\\end{enumerate}',
        documentation: 'Numbered list'
    },
    {
        label: 'begin abstract',
        insertText: '\\\\begin{abstract}\n\t${1:Abstract text...}\n\\\\end{abstract}',
        documentation: 'Abstract environment'
    },
    {
        label: 'begin quote',
        insertText: '\\\\begin{quote}\n\t${1:Quoted text...}\n\\\\end{quote}',
        documentation: 'Block quote'
    },
    {
        label: 'begin verbatim',
        insertText: '\\\\begin{verbatim}\n${1:code}\n\\\\end{verbatim}',
        documentation: 'Verbatim/code block'
    },
    {
        label: 'begin lstlisting',
        insertText: '\\\\begin{lstlisting}[language=${1:Python}]\n${2:code}\n\\\\end{lstlisting}',
        documentation: 'Code listing with syntax highlighting'
    },
    {
        label: 'begin minipage',
        insertText: '\\\\begin{minipage}{${1:0.45}\\\\textwidth}\n\t${2:content}\n\\\\end{minipage}',
        documentation: 'Minipage for side-by-side content'
    },
    {
        label: 'begin center',
        insertText: '\\\\begin{center}\n\t${1:content}\n\\\\end{center}',
        documentation: 'Centered content'
    },
    {
        label: 'begin thebibliography',
        insertText: '\\\\begin{thebibliography}{${1:9}}\n\t\\\\bibitem{${2:key}} ${3:Author, Title, Year}\n\\\\end{thebibliography}',
        documentation: 'Bibliography'
    },
];

/**
 * Quick snippets triggered by short prefixes
 */
const quickSnippets = [
    { label: 'sec', insertText: '\\\\section{${1:title}}', documentation: 'Quick: Section' },
    { label: 'sub', insertText: '\\\\subsection{${1:title}}', documentation: 'Quick: Subsection' },
    { label: 'ssub', insertText: '\\\\subsubsection{${1:title}}', documentation: 'Quick: Subsubsection' },
    { label: 'bf', insertText: '\\\\textbf{${1:text}}', documentation: 'Quick: Bold' },
    { label: 'it', insertText: '\\\\textit{${1:text}}', documentation: 'Quick: Italic' },
    { label: 'tt', insertText: '\\\\texttt{${1:text}}', documentation: 'Quick: Monospace' },
    { label: 'eq', insertText: '\\\\begin{equation}\n\t${1:formula}\n\\\\end{equation}', documentation: 'Quick: Equation' },
    { label: 'fig', insertText: '\\\\begin{figure}[htbp]\n\t\\\\centering\n\t\\\\includegraphics[width=0.8\\\\textwidth]{${1:image}}\n\t\\\\caption{${2:caption}}\n\t\\\\label{fig:${3:label}}\n\\\\end{figure}', documentation: 'Quick: Figure' },
    { label: 'tab', insertText: '\\\\begin{table}[htbp]\n\t\\\\centering\n\t\\\\caption{${1:caption}}\n\t\\\\begin{tabular}{lcc}\n\t\t\\\\hline\n\t\tCol 1 & Col 2 & Col 3 \\\\\\\\\n\t\t\\\\hline\n\t\tData & Data & Data \\\\\\\\\n\t\t\\\\hline\n\t\\\\end{tabular}\n\\\\end{table}', documentation: 'Quick: Table' },
    { label: 'item', insertText: '\\\\begin{itemize}\n\t\\\\item ${1:First}\n\t\\\\item ${2:Second}\n\\\\end{itemize}', documentation: 'Quick: Itemize' },
    { label: 'enum', insertText: '\\\\begin{enumerate}\n\t\\\\item ${1:First}\n\t\\\\item ${2:Second}\n\\\\end{enumerate}', documentation: 'Quick: Enumerate' },
    { label: 'fr', insertText: '\\\\frac{${1:num}}{${2:den}}', documentation: 'Quick: Fraction' },
    { label: 'sq', insertText: '\\\\sqrt{${1:x}}', documentation: 'Quick: Square root' },
];

/**
 * Register LaTeX completions with Monaco editor
 */
export function registerLatexCompletions(monaco: MonacoInstance): void {
    monaco.languages.registerCompletionItemProvider('latex', {
        triggerCharacters: ['\\', '{'],
        provideCompletionItems: (model: any, position: any) => {
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
            };

            const allCompletions = [
                ...latexCompletions,
                ...environmentSnippets,
                ...quickSnippets,
            ];

            const suggestions = allCompletions.map((item, index) => ({
                label: item.label,
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: item.insertText,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: item.documentation,
                range: range,
                sortText: String(index).padStart(3, '0'), // Preserve order
            }));

            return { suggestions };
        },
    });
}

/**
 * Register LaTeX folding provider for environments
 * Allows collapsing \begin{...}\end{...} blocks
 */
export function registerLatexFoldingProvider(monaco: MonacoInstance): void {
    monaco.languages.registerFoldingRangeProvider('latex', {
        provideFoldingRanges: (model: any) => {
            const ranges: any[] = [];
            const lineCount = model.getLineCount();

            // Stack to track open environments
            const envStack: { name: string; startLine: number }[] = [];

            for (let i = 1; i <= lineCount; i++) {
                const line = model.getLineContent(i);

                // Match \begin{...}
                const beginMatch = line.match(/\\begin\{(\w+)\}/);
                if (beginMatch) {
                    envStack.push({ name: beginMatch[1], startLine: i });
                }

                // Match \end{...}
                const endMatch = line.match(/\\end\{(\w+)\}/);
                if (endMatch && envStack.length > 0) {
                    // Find matching begin
                    for (let j = envStack.length - 1; j >= 0; j--) {
                        if (envStack[j].name === endMatch[1]) {
                            const start = envStack[j].startLine;
                            envStack.splice(j, 1);

                            if (i > start) {
                                ranges.push({
                                    start: start,
                                    end: i,
                                    kind: monaco.languages.FoldingRangeKind.Region,
                                });
                            }
                            break;
                        }
                    }
                }

                // Fold sections (chapter, section, subsection)
                if (line.match(/\\(chapter|section|subsection|subsubsection)\{/)) {
                    // Will be closed by next section of same or higher level
                    // For simplicity, we just fold to next blank line or section
                }
            }

            return ranges;
        },
    });
}

/**
 * List of common LaTeX symbols for the symbol picker
 */
export const latexSymbols = {
    greek: [
        { symbol: 'α', latex: '\\alpha', name: 'alpha' },
        { symbol: 'β', latex: '\\beta', name: 'beta' },
        { symbol: 'γ', latex: '\\gamma', name: 'gamma' },
        { symbol: 'δ', latex: '\\delta', name: 'delta' },
        { symbol: 'ε', latex: '\\epsilon', name: 'epsilon' },
        { symbol: 'ζ', latex: '\\zeta', name: 'zeta' },
        { symbol: 'η', latex: '\\eta', name: 'eta' },
        { symbol: 'θ', latex: '\\theta', name: 'theta' },
        { symbol: 'ι', latex: '\\iota', name: 'iota' },
        { symbol: 'κ', latex: '\\kappa', name: 'kappa' },
        { symbol: 'λ', latex: '\\lambda', name: 'lambda' },
        { symbol: 'μ', latex: '\\mu', name: 'mu' },
        { symbol: 'ν', latex: '\\nu', name: 'nu' },
        { symbol: 'ξ', latex: '\\xi', name: 'xi' },
        { symbol: 'π', latex: '\\pi', name: 'pi' },
        { symbol: 'ρ', latex: '\\rho', name: 'rho' },
        { symbol: 'σ', latex: '\\sigma', name: 'sigma' },
        { symbol: 'τ', latex: '\\tau', name: 'tau' },
        { symbol: 'υ', latex: '\\upsilon', name: 'upsilon' },
        { symbol: 'φ', latex: '\\phi', name: 'phi' },
        { symbol: 'χ', latex: '\\chi', name: 'chi' },
        { symbol: 'ψ', latex: '\\psi', name: 'psi' },
        { symbol: 'ω', latex: '\\omega', name: 'omega' },
    ],
    operators: [
        { symbol: '∑', latex: '\\sum', name: 'sum' },
        { symbol: '∏', latex: '\\prod', name: 'product' },
        { symbol: '∫', latex: '\\int', name: 'integral' },
        { symbol: '∂', latex: '\\partial', name: 'partial' },
        { symbol: '∞', latex: '\\infty', name: 'infinity' },
        { symbol: '√', latex: '\\sqrt{}', name: 'square root' },
        { symbol: '±', latex: '\\pm', name: 'plus-minus' },
        { symbol: '×', latex: '\\times', name: 'times' },
        { symbol: '÷', latex: '\\div', name: 'divide' },
        { symbol: '·', latex: '\\cdot', name: 'dot' },
    ],
    relations: [
        { symbol: '≤', latex: '\\leq', name: 'less or equal' },
        { symbol: '≥', latex: '\\geq', name: 'greater or equal' },
        { symbol: '≠', latex: '\\neq', name: 'not equal' },
        { symbol: '≈', latex: '\\approx', name: 'approximately' },
        { symbol: '≡', latex: '\\equiv', name: 'equivalent' },
        { symbol: '∼', latex: '\\sim', name: 'similar' },
        { symbol: '∝', latex: '\\propto', name: 'proportional' },
    ],
    arrows: [
        { symbol: '→', latex: '\\rightarrow', name: 'right arrow' },
        { symbol: '←', latex: '\\leftarrow', name: 'left arrow' },
        { symbol: '↔', latex: '\\leftrightarrow', name: 'both arrow' },
        { symbol: '⇒', latex: '\\Rightarrow', name: 'implies' },
        { symbol: '⇐', latex: '\\Leftarrow', name: 'implied by' },
        { symbol: '⇔', latex: '\\Leftrightarrow', name: 'iff' },
        { symbol: '↑', latex: '\\uparrow', name: 'up arrow' },
        { symbol: '↓', latex: '\\downarrow', name: 'down arrow' },
    ],
    sets: [
        { symbol: '∈', latex: '\\in', name: 'element of' },
        { symbol: '∉', latex: '\\notin', name: 'not element of' },
        { symbol: '⊂', latex: '\\subset', name: 'subset' },
        { symbol: '⊃', latex: '\\supset', name: 'superset' },
        { symbol: '⊆', latex: '\\subseteq', name: 'subset or equal' },
        { symbol: '∪', latex: '\\cup', name: 'union' },
        { symbol: '∩', latex: '\\cap', name: 'intersection' },
        { symbol: '∅', latex: '\\emptyset', name: 'empty set' },
        { symbol: '∀', latex: '\\forall', name: 'for all' },
        { symbol: '∃', latex: '\\exists', name: 'exists' },
    ],
};

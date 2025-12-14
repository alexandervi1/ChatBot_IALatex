/**
 * LaTeX Completions and Snippets for Monaco Editor
 * 
 * Provides intelligent autocompletion for LaTeX commands,
 * environments, and common snippets.
 */

// Monaco types are available at runtime from @monaco-editor/react
// We use 'any' to avoid bundling monaco-editor types
type MonacoInstance = any;

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
    { label: '\\includegraphics', insertText: '\\\\includegraphics[width=${1:0.8}\\\\textwidth]{${2:image}}', documentation: 'Include image' },
    { label: '\\caption', insertText: '\\\\caption{${1:caption}}', documentation: 'Figure/table caption' },
    { label: '\\centering', insertText: '\\\\centering', documentation: 'Center content' },
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

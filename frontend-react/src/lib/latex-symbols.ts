/**
 * Expanded LaTeX Symbol Palette
 * 
 * 200+ symbols organized by category for the symbol picker UI.
 * Sprint 4 enhancement.
 */

// ============================================================================
// Symbol Interface
// ============================================================================

export interface LatexSymbol {
    symbol: string;
    latex: string;
    name: string;
    keywords?: string[];  // For search
}

export interface SymbolCategory {
    id: string;
    name: string;
    icon: string;
    symbols: LatexSymbol[];
}

// ============================================================================
// Greek Letters (Complete)
// ============================================================================

const greekLowercase: LatexSymbol[] = [
    { symbol: 'α', latex: '\\alpha', name: 'alpha', keywords: ['greek'] },
    { symbol: 'β', latex: '\\beta', name: 'beta', keywords: ['greek'] },
    { symbol: 'γ', latex: '\\gamma', name: 'gamma', keywords: ['greek'] },
    { symbol: 'δ', latex: '\\delta', name: 'delta', keywords: ['greek'] },
    { symbol: 'ε', latex: '\\epsilon', name: 'epsilon', keywords: ['greek'] },
    { symbol: 'ϵ', latex: '\\varepsilon', name: 'varepsilon', keywords: ['greek'] },
    { symbol: 'ζ', latex: '\\zeta', name: 'zeta', keywords: ['greek'] },
    { symbol: 'η', latex: '\\eta', name: 'eta', keywords: ['greek'] },
    { symbol: 'θ', latex: '\\theta', name: 'theta', keywords: ['greek'] },
    { symbol: 'ϑ', latex: '\\vartheta', name: 'vartheta', keywords: ['greek'] },
    { symbol: 'ι', latex: '\\iota', name: 'iota', keywords: ['greek'] },
    { symbol: 'κ', latex: '\\kappa', name: 'kappa', keywords: ['greek'] },
    { symbol: 'λ', latex: '\\lambda', name: 'lambda', keywords: ['greek'] },
    { symbol: 'μ', latex: '\\mu', name: 'mu', keywords: ['greek'] },
    { symbol: 'ν', latex: '\\nu', name: 'nu', keywords: ['greek'] },
    { symbol: 'ξ', latex: '\\xi', name: 'xi', keywords: ['greek'] },
    { symbol: 'π', latex: '\\pi', name: 'pi', keywords: ['greek'] },
    { symbol: 'ϖ', latex: '\\varpi', name: 'varpi', keywords: ['greek'] },
    { symbol: 'ρ', latex: '\\rho', name: 'rho', keywords: ['greek'] },
    { symbol: 'ϱ', latex: '\\varrho', name: 'varrho', keywords: ['greek'] },
    { symbol: 'σ', latex: '\\sigma', name: 'sigma', keywords: ['greek'] },
    { symbol: 'ς', latex: '\\varsigma', name: 'varsigma', keywords: ['greek', 'final'] },
    { symbol: 'τ', latex: '\\tau', name: 'tau', keywords: ['greek'] },
    { symbol: 'υ', latex: '\\upsilon', name: 'upsilon', keywords: ['greek'] },
    { symbol: 'φ', latex: '\\phi', name: 'phi', keywords: ['greek'] },
    { symbol: 'ϕ', latex: '\\varphi', name: 'varphi', keywords: ['greek'] },
    { symbol: 'χ', latex: '\\chi', name: 'chi', keywords: ['greek'] },
    { symbol: 'ψ', latex: '\\psi', name: 'psi', keywords: ['greek'] },
    { symbol: 'ω', latex: '\\omega', name: 'omega', keywords: ['greek'] },
];

const greekUppercase: LatexSymbol[] = [
    { symbol: 'Γ', latex: '\\Gamma', name: 'Gamma', keywords: ['greek', 'uppercase'] },
    { symbol: 'Δ', latex: '\\Delta', name: 'Delta', keywords: ['greek', 'uppercase'] },
    { symbol: 'Θ', latex: '\\Theta', name: 'Theta', keywords: ['greek', 'uppercase'] },
    { symbol: 'Λ', latex: '\\Lambda', name: 'Lambda', keywords: ['greek', 'uppercase'] },
    { symbol: 'Ξ', latex: '\\Xi', name: 'Xi', keywords: ['greek', 'uppercase'] },
    { symbol: 'Π', latex: '\\Pi', name: 'Pi', keywords: ['greek', 'uppercase'] },
    { symbol: 'Σ', latex: '\\Sigma', name: 'Sigma', keywords: ['greek', 'uppercase'] },
    { symbol: 'Υ', latex: '\\Upsilon', name: 'Upsilon', keywords: ['greek', 'uppercase'] },
    { symbol: 'Φ', latex: '\\Phi', name: 'Phi', keywords: ['greek', 'uppercase'] },
    { symbol: 'Ψ', latex: '\\Psi', name: 'Psi', keywords: ['greek', 'uppercase'] },
    { symbol: 'Ω', latex: '\\Omega', name: 'Omega', keywords: ['greek', 'uppercase'] },
];

// ============================================================================
// Mathematical Operators
// ============================================================================

const operators: LatexSymbol[] = [
    // Basic
    { symbol: '+', latex: '+', name: 'plus', keywords: ['add', 'arithmetic'] },
    { symbol: '−', latex: '-', name: 'minus', keywords: ['subtract', 'arithmetic'] },
    { symbol: '×', latex: '\\times', name: 'times', keywords: ['multiply', 'arithmetic'] },
    { symbol: '÷', latex: '\\div', name: 'divide', keywords: ['division', 'arithmetic'] },
    { symbol: '±', latex: '\\pm', name: 'plus-minus', keywords: ['arithmetic'] },
    { symbol: '∓', latex: '\\mp', name: 'minus-plus', keywords: ['arithmetic'] },
    { symbol: '·', latex: '\\cdot', name: 'center dot', keywords: ['dot', 'multiply'] },
    { symbol: '∗', latex: '\\ast', name: 'asterisk', keywords: ['star'] },
    { symbol: '⋆', latex: '\\star', name: 'star', keywords: ['asterisk'] },
    { symbol: '∘', latex: '\\circ', name: 'circle', keywords: ['compose'] },
    { symbol: '•', latex: '\\bullet', name: 'bullet', keywords: ['dot'] },

    // Large operators
    { symbol: '∑', latex: '\\sum', name: 'summation', keywords: ['sum', 'sigma'] },
    { symbol: '∏', latex: '\\prod', name: 'product', keywords: ['pi', 'multiply'] },
    { symbol: '∐', latex: '\\coprod', name: 'coproduct', keywords: ['sum'] },
    { symbol: '∫', latex: '\\int', name: 'integral', keywords: ['calculus'] },
    { symbol: '∬', latex: '\\iint', name: 'double integral', keywords: ['calculus'] },
    { symbol: '∭', latex: '\\iiint', name: 'triple integral', keywords: ['calculus'] },
    { symbol: '∮', latex: '\\oint', name: 'contour integral', keywords: ['calculus', 'path'] },
    { symbol: '∂', latex: '\\partial', name: 'partial derivative', keywords: ['calculus'] },
    { symbol: '∇', latex: '\\nabla', name: 'nabla', keywords: ['gradient', 'del'] },

    // Roots and fractions
    { symbol: '√', latex: '\\sqrt{}', name: 'square root', keywords: ['root'] },
    { symbol: '∛', latex: '\\sqrt[3]{}', name: 'cube root', keywords: ['root'] },
    { symbol: '∜', latex: '\\sqrt[4]{}', name: 'fourth root', keywords: ['root'] },

    // Limits
    { symbol: 'lim', latex: '\\lim', name: 'limit', keywords: ['calculus'] },
    { symbol: 'inf', latex: '\\inf', name: 'infimum', keywords: ['limit'] },
    { symbol: 'sup', latex: '\\sup', name: 'supremum', keywords: ['limit'] },
    { symbol: 'max', latex: '\\max', name: 'maximum', keywords: ['limit'] },
    { symbol: 'min', latex: '\\min', name: 'minimum', keywords: ['limit'] },
];

// ============================================================================
// Relations
// ============================================================================

const relations: LatexSymbol[] = [
    // Equality
    { symbol: '=', latex: '=', name: 'equals', keywords: ['equal'] },
    { symbol: '≠', latex: '\\neq', name: 'not equal', keywords: ['inequality'] },
    { symbol: '≈', latex: '\\approx', name: 'approximately', keywords: ['similar'] },
    { symbol: '≅', latex: '\\cong', name: 'congruent', keywords: ['equal'] },
    { symbol: '≡', latex: '\\equiv', name: 'equivalent', keywords: ['identical'] },
    { symbol: '∼', latex: '\\sim', name: 'similar', keywords: ['tilde'] },
    { symbol: '≃', latex: '\\simeq', name: 'similar or equal', keywords: [] },
    { symbol: '≐', latex: '\\doteq', name: 'approaches', keywords: ['equal'] },

    // Ordering
    { symbol: '<', latex: '<', name: 'less than', keywords: ['compare'] },
    { symbol: '>', latex: '>', name: 'greater than', keywords: ['compare'] },
    { symbol: '≤', latex: '\\leq', name: 'less or equal', keywords: ['compare'] },
    { symbol: '≥', latex: '\\geq', name: 'greater or equal', keywords: ['compare'] },
    { symbol: '≪', latex: '\\ll', name: 'much less', keywords: ['compare'] },
    { symbol: '≫', latex: '\\gg', name: 'much greater', keywords: ['compare'] },
    { symbol: '≺', latex: '\\prec', name: 'precedes', keywords: ['order'] },
    { symbol: '≻', latex: '\\succ', name: 'succeeds', keywords: ['order'] },
    { symbol: '⪯', latex: '\\preceq', name: 'precedes or equal', keywords: ['order'] },
    { symbol: '⪰', latex: '\\succeq', name: 'succeeds or equal', keywords: ['order'] },

    // Other relations
    { symbol: '∝', latex: '\\propto', name: 'proportional', keywords: ['ratio'] },
    { symbol: '∥', latex: '\\parallel', name: 'parallel', keywords: ['geometry'] },
    { symbol: '⊥', latex: '\\perp', name: 'perpendicular', keywords: ['geometry'] },
    { symbol: '⊢', latex: '\\vdash', name: 'proves', keywords: ['logic'] },
    { symbol: '⊣', latex: '\\dashv', name: 'left tack', keywords: ['logic'] },
    { symbol: '⊨', latex: '\\models', name: 'models', keywords: ['logic'] },
];

// ============================================================================
// Set Theory
// ============================================================================

const sets: LatexSymbol[] = [
    // Membership
    { symbol: '∈', latex: '\\in', name: 'element of', keywords: ['member', 'set'] },
    { symbol: '∉', latex: '\\notin', name: 'not element of', keywords: ['set'] },
    { symbol: '∋', latex: '\\ni', name: 'contains', keywords: ['set'] },

    // Subsets
    { symbol: '⊂', latex: '\\subset', name: 'subset', keywords: ['set'] },
    { symbol: '⊃', latex: '\\supset', name: 'superset', keywords: ['set'] },
    { symbol: '⊆', latex: '\\subseteq', name: 'subset or equal', keywords: ['set'] },
    { symbol: '⊇', latex: '\\supseteq', name: 'superset or equal', keywords: ['set'] },
    { symbol: '⊄', latex: '\\not\\subset', name: 'not subset', keywords: ['set'] },
    { symbol: '⊊', latex: '\\subsetneq', name: 'proper subset', keywords: ['set'] },

    // Operations
    { symbol: '∪', latex: '\\cup', name: 'union', keywords: ['set', 'join'] },
    { symbol: '∩', latex: '\\cap', name: 'intersection', keywords: ['set', 'meet'] },
    { symbol: '∖', latex: '\\setminus', name: 'set difference', keywords: ['set', 'minus'] },
    { symbol: '⊔', latex: '\\sqcup', name: 'disjoint union', keywords: ['set'] },
    { symbol: '⊓', latex: '\\sqcap', name: 'square cap', keywords: ['set'] },

    // Special sets
    { symbol: '∅', latex: '\\emptyset', name: 'empty set', keywords: ['null', 'set'] },
    { symbol: '∅', latex: '\\varnothing', name: 'empty set (var)', keywords: ['null', 'set'] },

    // Number sets (requires amssymb)
    { symbol: 'ℕ', latex: '\\mathbb{N}', name: 'natural numbers', keywords: ['set', 'numbers'] },
    { symbol: 'ℤ', latex: '\\mathbb{Z}', name: 'integers', keywords: ['set', 'numbers'] },
    { symbol: 'ℚ', latex: '\\mathbb{Q}', name: 'rationals', keywords: ['set', 'numbers'] },
    { symbol: 'ℝ', latex: '\\mathbb{R}', name: 'real numbers', keywords: ['set', 'numbers'] },
    { symbol: 'ℂ', latex: '\\mathbb{C}', name: 'complex numbers', keywords: ['set', 'numbers'] },
];

// ============================================================================
// Logic
// ============================================================================

const logic: LatexSymbol[] = [
    // Quantifiers
    { symbol: '∀', latex: '\\forall', name: 'for all', keywords: ['universal', 'quantifier'] },
    { symbol: '∃', latex: '\\exists', name: 'exists', keywords: ['existential', 'quantifier'] },
    { symbol: '∄', latex: '\\nexists', name: 'does not exist', keywords: ['quantifier'] },

    // Connectives
    { symbol: '¬', latex: '\\neg', name: 'negation', keywords: ['not', 'logic'] },
    { symbol: '∧', latex: '\\land', name: 'logical and', keywords: ['conjunction'] },
    { symbol: '∨', latex: '\\lor', name: 'logical or', keywords: ['disjunction'] },
    { symbol: '⊕', latex: '\\oplus', name: 'xor', keywords: ['exclusive or'] },
    { symbol: '⊻', latex: '\\veebar', name: 'xor (bar)', keywords: ['exclusive or'] },

    // Implications
    { symbol: '→', latex: '\\to', name: 'maps to', keywords: ['arrow', 'function'] },
    { symbol: '⇒', latex: '\\Rightarrow', name: 'implies', keywords: ['logic', 'if then'] },
    { symbol: '⇐', latex: '\\Leftarrow', name: 'implied by', keywords: ['logic'] },
    { symbol: '⇔', latex: '\\Leftrightarrow', name: 'if and only if', keywords: ['iff', 'logic'] },

    // Other
    { symbol: '⊤', latex: '\\top', name: 'top/true', keywords: ['logic', 'true'] },
    { symbol: '⊥', latex: '\\bot', name: 'bottom/false', keywords: ['logic', 'false'] },
];

// ============================================================================
// Arrows
// ============================================================================

const arrows: LatexSymbol[] = [
    // Simple arrows
    { symbol: '→', latex: '\\rightarrow', name: 'right arrow', keywords: ['direction'] },
    { symbol: '←', latex: '\\leftarrow', name: 'left arrow', keywords: ['direction'] },
    { symbol: '↑', latex: '\\uparrow', name: 'up arrow', keywords: ['direction'] },
    { symbol: '↓', latex: '\\downarrow', name: 'down arrow', keywords: ['direction'] },
    { symbol: '↔', latex: '\\leftrightarrow', name: 'left-right arrow', keywords: ['both'] },
    { symbol: '↕', latex: '\\updownarrow', name: 'up-down arrow', keywords: ['both'] },

    // Double arrows
    { symbol: '⇒', latex: '\\Rightarrow', name: 'right double arrow', keywords: ['implies'] },
    { symbol: '⇐', latex: '\\Leftarrow', name: 'left double arrow', keywords: ['reverse'] },
    { symbol: '⇑', latex: '\\Uparrow', name: 'up double arrow', keywords: [] },
    { symbol: '⇓', latex: '\\Downarrow', name: 'down double arrow', keywords: [] },
    { symbol: '⇔', latex: '\\Leftrightarrow', name: 'left-right double', keywords: ['iff'] },
    { symbol: '⇕', latex: '\\Updownarrow', name: 'up-down double', keywords: [] },

    // Long arrows
    { symbol: '⟶', latex: '\\longrightarrow', name: 'long right arrow', keywords: [] },
    { symbol: '⟵', latex: '\\longleftarrow', name: 'long left arrow', keywords: [] },
    { symbol: '⟷', latex: '\\longleftrightarrow', name: 'long both arrow', keywords: [] },
    { symbol: '⟹', latex: '\\Longrightarrow', name: 'long double right', keywords: [] },
    { symbol: '⟸', latex: '\\Longleftarrow', name: 'long double left', keywords: [] },

    // Special arrows
    { symbol: '↦', latex: '\\mapsto', name: 'maps to', keywords: ['function'] },
    { symbol: '⟼', latex: '\\longmapsto', name: 'long maps to', keywords: ['function'] },
    { symbol: '↪', latex: '\\hookrightarrow', name: 'hook right', keywords: ['inject'] },
    { symbol: '↩', latex: '\\hookleftarrow', name: 'hook left', keywords: [] },
    { symbol: '↠', latex: '\\twoheadrightarrow', name: 'two head right', keywords: ['surject'] },
    { symbol: '↣', latex: '\\rightarrowtail', name: 'right tail', keywords: ['inject'] },

    // Diagonal arrows
    { symbol: '↗', latex: '\\nearrow', name: 'north-east arrow', keywords: ['diagonal'] },
    { symbol: '↘', latex: '\\searrow', name: 'south-east arrow', keywords: ['diagonal'] },
    { symbol: '↙', latex: '\\swarrow', name: 'south-west arrow', keywords: ['diagonal'] },
    { symbol: '↖', latex: '\\nwarrow', name: 'north-west arrow', keywords: ['diagonal'] },
];

// ============================================================================
// Geometry
// ============================================================================

const geometry: LatexSymbol[] = [
    { symbol: '∠', latex: '\\angle', name: 'angle', keywords: ['geometry'] },
    { symbol: '∟', latex: '\\measuredangle', name: 'right angle', keywords: ['geometry'] },
    { symbol: '△', latex: '\\triangle', name: 'triangle', keywords: ['geometry'] },
    { symbol: '□', latex: '\\square', name: 'square', keywords: ['geometry'] },
    { symbol: '▽', latex: '\\bigtriangledown', name: 'triangle down', keywords: ['geometry'] },
    { symbol: '◯', latex: '\\bigcirc', name: 'circle', keywords: ['geometry'] },
    { symbol: '⬡', latex: '\\hexagon', name: 'hexagon', keywords: ['geometry'] },
    { symbol: '∥', latex: '\\parallel', name: 'parallel', keywords: ['geometry'] },
    { symbol: '⊥', latex: '\\perp', name: 'perpendicular', keywords: ['geometry'] },
    { symbol: '≅', latex: '\\cong', name: 'congruent', keywords: ['geometry'] },
    { symbol: '∼', latex: '\\sim', name: 'similar', keywords: ['geometry'] },
];

// ============================================================================
// Miscellaneous Symbols
// ============================================================================

const misc: LatexSymbol[] = [
    // Infinity and special
    { symbol: '∞', latex: '\\infty', name: 'infinity', keywords: ['infinite'] },
    { symbol: 'ℵ', latex: '\\aleph', name: 'aleph', keywords: ['cardinal', 'hebrew'] },
    { symbol: 'ℶ', latex: '\\beth', name: 'beth', keywords: ['hebrew'] },
    { symbol: 'ℷ', latex: '\\gimel', name: 'gimel', keywords: ['hebrew'] },

    // Dots
    { symbol: '…', latex: '\\ldots', name: 'low dots', keywords: ['ellipsis'] },
    { symbol: '⋯', latex: '\\cdots', name: 'center dots', keywords: ['ellipsis'] },
    { symbol: '⋮', latex: '\\vdots', name: 'vertical dots', keywords: ['ellipsis'] },
    { symbol: '⋱', latex: '\\ddots', name: 'diagonal dots', keywords: ['ellipsis'] },

    // Accents
    { symbol: 'x̂', latex: '\\hat{x}', name: 'hat', keywords: ['accent'] },
    { symbol: 'x̃', latex: '\\tilde{x}', name: 'tilde', keywords: ['accent'] },
    { symbol: 'x̄', latex: '\\bar{x}', name: 'bar', keywords: ['accent', 'average'] },
    { symbol: 'ẋ', latex: '\\dot{x}', name: 'dot', keywords: ['accent', 'derivative'] },
    { symbol: 'ẍ', latex: '\\ddot{x}', name: 'double dot', keywords: ['accent'] },
    { symbol: 'x⃗', latex: '\\vec{x}', name: 'vector', keywords: ['accent', 'arrow'] },

    // Brackets
    { symbol: '⟨', latex: '\\langle', name: 'left angle bracket', keywords: ['bracket'] },
    { symbol: '⟩', latex: '\\rangle', name: 'right angle bracket', keywords: ['bracket'] },
    { symbol: '⌊', latex: '\\lfloor', name: 'left floor', keywords: ['bracket'] },
    { symbol: '⌋', latex: '\\rfloor', name: 'right floor', keywords: ['bracket'] },
    { symbol: '⌈', latex: '\\lceil', name: 'left ceiling', keywords: ['bracket'] },
    { symbol: '⌉', latex: '\\rceil', name: 'right ceiling', keywords: ['bracket'] },

    // Other
    { symbol: '†', latex: '\\dagger', name: 'dagger', keywords: ['footnote'] },
    { symbol: '‡', latex: '\\ddagger', name: 'double dagger', keywords: ['footnote'] },
    { symbol: '§', latex: '\\S', name: 'section', keywords: ['reference'] },
    { symbol: '¶', latex: '\\P', name: 'paragraph', keywords: ['reference'] },
    { symbol: '©', latex: '\\copyright', name: 'copyright', keywords: [] },
    { symbol: '®', latex: '\\textregistered', name: 'registered', keywords: [] },
    { symbol: '™', latex: '\\texttrademark', name: 'trademark', keywords: [] },
    { symbol: '°', latex: '^\\circ', name: 'degree', keywords: ['angle', 'temperature'] },
    { symbol: '′', latex: "'", name: 'prime', keywords: ['derivative'] },
    { symbol: '″', latex: "''", name: 'double prime', keywords: ['second'] },
    { symbol: '‰', latex: '\\permil', name: 'per mille', keywords: ['percent'] },
];

// ============================================================================
// Functions
// ============================================================================

const functions: LatexSymbol[] = [
    // Trigonometric
    { symbol: 'sin', latex: '\\sin', name: 'sine', keywords: ['trig'] },
    { symbol: 'cos', latex: '\\cos', name: 'cosine', keywords: ['trig'] },
    { symbol: 'tan', latex: '\\tan', name: 'tangent', keywords: ['trig'] },
    { symbol: 'cot', latex: '\\cot', name: 'cotangent', keywords: ['trig'] },
    { symbol: 'sec', latex: '\\sec', name: 'sekante', keywords: ['trig'] },
    { symbol: 'csc', latex: '\\csc', name: 'cosecant', keywords: ['trig'] },

    // Inverse trig
    { symbol: 'arcsin', latex: '\\arcsin', name: 'arcsin', keywords: ['trig', 'inverse'] },
    { symbol: 'arccos', latex: '\\arccos', name: 'arccos', keywords: ['trig', 'inverse'] },
    { symbol: 'arctan', latex: '\\arctan', name: 'arctan', keywords: ['trig', 'inverse'] },

    // Hyperbolic
    { symbol: 'sinh', latex: '\\sinh', name: 'sinh', keywords: ['hyperbolic'] },
    { symbol: 'cosh', latex: '\\cosh', name: 'cosh', keywords: ['hyperbolic'] },
    { symbol: 'tanh', latex: '\\tanh', name: 'tanh', keywords: ['hyperbolic'] },

    // Logarithms
    { symbol: 'log', latex: '\\log', name: 'logarithm', keywords: [] },
    { symbol: 'ln', latex: '\\ln', name: 'natural log', keywords: [] },
    { symbol: 'lg', latex: '\\lg', name: 'log base 10', keywords: [] },

    // Other
    { symbol: 'exp', latex: '\\exp', name: 'exponential', keywords: [] },
    { symbol: 'det', latex: '\\det', name: 'determinant', keywords: ['matrix'] },
    { symbol: 'dim', latex: '\\dim', name: 'dimension', keywords: ['linear algebra'] },
    { symbol: 'ker', latex: '\\ker', name: 'kernel', keywords: ['linear algebra'] },
    { symbol: 'gcd', latex: '\\gcd', name: 'gcd', keywords: ['greatest common divisor'] },
    { symbol: 'lcm', latex: '\\text{lcm}', name: 'lcm', keywords: ['least common multiple'] },
    { symbol: 'mod', latex: '\\mod', name: 'modulo', keywords: ['remainder'] },
    { symbol: 'arg', latex: '\\arg', name: 'argument', keywords: ['complex'] },
];

// ============================================================================
// Exported Categories
// ============================================================================

export const symbolCategories: SymbolCategory[] = [
    {
        id: 'greek',
        name: 'Letras Griegas',
        icon: 'α',
        symbols: [...greekLowercase, ...greekUppercase],
    },
    {
        id: 'operators',
        name: 'Operadores',
        icon: '∑',
        symbols: operators,
    },
    {
        id: 'relations',
        name: 'Relaciones',
        icon: '≤',
        symbols: relations,
    },
    {
        id: 'sets',
        name: 'Conjuntos',
        icon: '∈',
        symbols: sets,
    },
    {
        id: 'logic',
        name: 'Lógica',
        icon: '∀',
        symbols: logic,
    },
    {
        id: 'arrows',
        name: 'Flechas',
        icon: '→',
        symbols: arrows,
    },
    {
        id: 'geometry',
        name: 'Geometría',
        icon: '△',
        symbols: geometry,
    },
    {
        id: 'functions',
        name: 'Funciones',
        icon: 'f',
        symbols: functions,
    },
    {
        id: 'misc',
        name: 'Otros',
        icon: '∞',
        symbols: misc,
    },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all symbols as a flat array
 */
export function getAllSymbols(): LatexSymbol[] {
    return symbolCategories.flatMap(cat => cat.symbols);
}

/**
 * Search symbols by name, latex, or keywords
 */
export function searchSymbols(query: string): LatexSymbol[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    return getAllSymbols().filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.latex.toLowerCase().includes(q) ||
        s.keywords?.some(k => k.includes(q))
    );
}

/**
 * Get symbols by category ID
 */
export function getSymbolsByCategory(categoryId: string): LatexSymbol[] {
    const category = symbolCategories.find(c => c.id === categoryId);
    return category?.symbols ?? [];
}

/**
 * Total symbol count
 */
export const TOTAL_SYMBOL_COUNT = getAllSymbols().length;

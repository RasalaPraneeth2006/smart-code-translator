/**
 * Prompt Engineering Factory
 * Constructs highly structured, AST-enriched prompts for LLMs
 */

const IDIOMATIC_RULES = {
  'python->javascript': [
    'Convert `asyncio.gather()` / `asyncio.run()` to native `Promise.all()` or `async/await`.',
    'Map Python `dict.get(k, default)` to JavaScript optional chaining `obj?.[k] ?? default`.',
    'Map Python list comprehensions `[x for x in list if condition]` to JS `.filter().map()`.',
    'Translate `def __init__(self)` constructors into ES6 `constructor()` with class fields.',
    'Map Python `print()` to `console.log()`.',
    'Map Python `None`, `True`, `False` to JS `null`, `true`, `false`.',
  ],
  'python->typescript': [
    'Add strong TypeScript type annotations for function arguments, return types, and class fields.',
    'Translate Python Type Hints `List[int]`, `Dict[str, Any]` to `number[]`, `Record<string, any>`.',
    'Translate Python dataclasses to TypeScript interfaces or type aliases.',
    'Map Python `Optional[T]` to `T | null` or `T | undefined`.',
  ],
  'javascript->python': [
    'Convert JavaScript `Promise.all()` to `asyncio.gather()`.',
    'Map `console.log()` to Python `print()`.',
    'Map `null` and `undefined` to Python `None`.',
    'Convert camelCase variable and function names to Pythonic snake_case.',
    'Replace `.length` on arrays/strings with `len()`.',
  ],
  'typescript->python': [
    'Map TypeScript interfaces to Python `@dataclass` or TypedDict definitions.',
    'Convert TS type union `string | number` to Python `Union[str, int]` or `str | int` (Python 3.10+).',
    'Convert async functions to Python `async def` with `asyncio`.',
  ],
  'javascript->java': [
    'Wrap top-level functions inside a public class structure (e.g., `Main` or specific module class).',
    'Specify explicit types for all parameters and methods (`String`, `int`, `double`, `boolean`, `void`).',
    'Map JS arrays/objects to Java `List<T>`, `ArrayList<T>`, `Map<K,V>`, `HashMap<K,V>`.',
    'Translate Promises / Async to `CompletableFuture` or Java Threads/Executor Services.',
  ],
  'python->cpp': [
    'Define memory safe types, use `std::vector`, `std::unordered_map`, `std::string`.',
    'Convert Python functions to C++ functions with static return types.',
    'Include necessary header files (`<iostream>`, `<vector>`, `<string>`, `<memory>`, `<algorithm>`).',
    'Implement a runnable `int main()` function if executable code is provided.',
  ],
  'python->go': [
    'Convert Python functions to Go functions with static typed parameters and explicit return signatures.',
    'Map Python exceptions `try/except` to Go idiom: returning `(result, error)` and checking `if err != nil`.',
    'Convert Python dicts to Go maps `map[string]interface{}` or structs.',
    'Map Python list comprehensions to standard Go `for` loops.',
  ],
};

export function buildTranslationPrompt({ sourceLang, targetLang, code, astData, options = {} }) {
  const sLang = sourceLang.toLowerCase();
  const tLang = targetLang.toLowerCase();
  const ruleKey = `${sLang}->${tLang}`;
  const customIdioms = IDIOMATIC_RULES[ruleKey] || [
    `Convert ${sourceLang} structures, control flows, and types into idiomatic ${targetLang}.`,
    `Ensure language-specific error handling and type safety standards in ${targetLang}.`,
  ];

  const systemPrompt = `You are a Principal AI Software Architect and Expert Polyglot Compiler Engineer.
Your task is to translate source code written in ${sourceLang} into production-grade, idiomatic ${targetLang}.

CRITICAL OUTPUT RULES:
1. Output ONLY valid, executable ${targetLang} code inside a markdown code block (e.g. \`\`\`${tLang} ... \`\`\`).
2. Do NOT include any introductory greetings, conversational fluff, explanations, or concluding chatter outside the code block.
3. Preserve all underlying semantic business logic, calculations, data flows, and algorithmic intent.
${options.preserveComments ? '4. Retain and translate all inline comments and docstrings into target language code formatting.' : '4. Remove redundant comments if unnecessary, but keep critical notes.'}
`;

  let astContextSummary = '';
  if (astData && astData.parsedSuccessfully) {
    const fnNames = astData.functions.map(f => f.name).filter(n => n !== 'anonymous').join(', ');
    const classNames = astData.classes.map(c => c.name).join(', ');
    const importStmts = astData.imports.map(i => i.statement).join('; ');
    
    astContextSummary = `
AST STRUCTURAL METADATA CONTEXT:
- Total Functions Detected (${astData.functions.length}): ${fnNames || 'None'}
- Classes Detected (${astData.classes.length}): ${classNames || 'None'}
- Imports Detected (${astData.imports.length}): ${importStmts || 'None'}
- Contains Async Flow: ${astData.asyncFunctionsCount > 0 ? 'YES' : 'NO'}
`;
  }

  const userPrompt = `TRANSLATION TARGET: ${sourceLang} ➔ ${targetLang}

IDIOMATIC CONVERSION & BEST PRACTICE RULES TO APPLY:
${customIdioms.map((rule, idx) => `${idx + 1}. ${rule}`).join('\n')}
${astContextSummary}

SOURCE ${sourceLang.toUpperCase()} CODE TO TRANSLATE:
\`\`\`${sLang}
${code}
\`\`\`

Translate the above ${sourceLang} code to high-quality, highly idiomatic ${targetLang}. Output ONLY the code block.`;

  return { systemPrompt, userPrompt };
}

export function buildAnalysisPrompt({ code, language }) {
  return {
    systemPrompt: `You are an expert Code Performance & Algorithmic Complexity Analyst.
Analyze the provided ${language} source code and return a structured JSON response.

CRITICAL INSTRUCTION: Output ONLY valid JSON matching this exact schema:
{
  "timeComplexity": "O(N log N)",
  "spaceComplexity": "O(N)",
  "explanation": "Detailed step-by-step breakdown of time and space complexity analysis...",
  "issues": [
    {
      "severity": "high" | "medium" | "low",
      "title": "Short title",
      "description": "Issue description and mitigation"
    }
  ]
}
Do not wrap in extra commentary or text outside the JSON block.`,
    userPrompt: `ANALYZE CODE (${language}):
\`\`\`${language}
${code}
\`\`\`
Return JSON analysis.`
  };
}

export function buildOptimizationPrompt({ code, language }) {
  return {
    systemPrompt: `You are a Principal Software Optimization Architect.
Refactor and optimize the provided ${language} source code for maximum performance, readability, safety, and modern idioms.

CRITICAL INSTRUCTION: Output ONLY valid JSON matching this exact schema:
{
  "optimizedCode": "// Complete refactored and optimized source code here...",
  "timeComplexity": "O(N log N)",
  "spaceComplexity": "O(1)",
  "improvements": [
    "Improved memory efficiency by replacing copy with reference",
    "Optimized lookups from O(N) to O(1) using HashSet"
  ]
}
Do not wrap in extra commentary outside the JSON block.`,
    userPrompt: `OPTIMIZE CODE (${language}):
\`\`\`${language}
${code}
\`\`\`
Return optimized code JSON.`
  };
}

export function buildErrorExplanationPrompt({ code, language, errorOutput }) {
  return {
    systemPrompt: `You are an expert Polyglot Software Architect and Debugging Assistant.
Your task is to analyze code execution failures, syntax errors, or runtime stack traces and translate them into a clear, structured developer diagnosis.

CRITICAL INSTRUCTION: Output ONLY valid JSON matching this exact schema:
{
  "plainEnglishExplanation": "Clear, friendly plain-English diagnosis translating cryptic compiler or stack traces into easily understandable terms.",
  "rootCause": "Precise explanation of why this error occurred in the execution context.",
  "stepByStepFix": [
    "Step 1: Specific action to take",
    "Step 2: Specific action to take"
  ],
  "suggestedCodeFix": "// Complete, corrected, and runnable code snippet that resolves the error"
}
Ensure suggestedCodeFix contains the complete corrected source code ready to be pasted back into the editor.
Do not wrap in extra commentary outside the JSON block.`,
    userPrompt: `DEBUG AND EXPLAIN ERROR FOR ${language.toUpperCase()}:

SOURCE CODE:
\`\`\`${language}
${code}
\`\`\`

RAW ERROR / STACK TRACE:
\`\`\`
${errorOutput}
\`\`\`

Diagnose the error and provide structured fix guidance.`
  };
}

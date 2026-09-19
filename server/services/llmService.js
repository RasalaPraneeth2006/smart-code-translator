import { GoogleGenAI } from '@google/genai';

/**
 * AI Translation & Code Intelligence Engine
 * Integrates Google Gemini models with dynamic candidate cascade & resilient fallback.
 */
export async function executeLLMTranslation({ systemPrompt, userPrompt, targetLang, code, sourceLang, customApiKey, customModel }) {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY') {
    const candidateModels = [
      customModel,
      process.env.GEMINI_MODEL,
      'gemini-3.6-flash',
      'gemini-2.5-flash',
      'gemini-flash-latest',
      'gemini-3.5-flash',
      'gemini-3.7-flash',
    ].filter((m, idx, self) => m && self.indexOf(m) === idx);

    const ai = new GoogleGenAI({ apiKey });

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
          ],
          config: {
            temperature: 0.1,
            topP: 0.95,
          }
        });

        const text = response.text || '';
        const cleanedCode = extractCodeFromMarkdown(text, targetLang);
        return { translatedCode: cleanedCode, modelUsed: modelName, rawResponse: text, isFallback: false };
      } catch (err) {
        console.warn(`[LLM Service Warning] Candidate model '${modelName}' failed: ${err.message}. Trying next candidate model...`);
      }
    }
  }

  // Resilient Context-Aware Smart Fallback Engine (when API Key is missing/invalid or network fails)
  const fallbackCode = generateSmartFallbackTranslation(code, sourceLang, targetLang);
  return {
    translatedCode: fallbackCode,
    modelUsed: 'smart-code-translator-fallback-v2',
    isFallback: true,
  };
}

export async function executeLLMJSON({ systemPrompt, userPrompt, customApiKey, customModel }) {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY') {
    const candidateModels = [
      customModel,
      process.env.GEMINI_MODEL,
      'gemini-3.6-flash',
      'gemini-2.5-flash',
      'gemini-flash-latest',
      'gemini-3.5-flash',
      'gemini-3.7-flash',
    ].filter((m, idx, self) => m && self.indexOf(m) === idx);

    const ai = new GoogleGenAI({ apiKey });

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
          ],
          config: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          }
        });

        const text = response.text || '{}';
        return JSON.parse(text);
      } catch (err) {
        console.warn(`[LLM JSON Warning] Candidate model '${modelName}' failed: ${err.message}. Trying next candidate model...`);
      }
    }
  }

  return null;
}

function extractCodeFromMarkdown(text, targetLang) {
  const codeBlockRegex = /```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)\n```/;
  const match = text.match(codeBlockRegex);
  if (match && match[1]) {
    return match[1].trim();
  }
  return text.replace(/```[a-zA-Z]*\n?/g, '').replace(/```/g, '').trim();
}

/**
 * Intelligent Fallback Code Translator
 * Robust, indentation-aware AST/block translator across Python, TypeScript, JavaScript, Java, C++, Go.
 */
export function generateSmartFallbackTranslation(code, sourceLang, targetLang) {
  const sLang = (sourceLang || '').toLowerCase();
  const tLang = (targetLang || '').toLowerCase();

  if (sLang === 'python' && (tLang === 'typescript' || tLang === 'javascript')) {
    return translatePythonToJsTs(code, tLang === 'typescript');
  }

  if (sLang === 'python' && (tLang === 'java' || tLang === 'cpp' || tLang === 'c++')) {
    return translatePythonToCppJava(code, tLang);
  }

  if ((sLang === 'javascript' || sLang === 'typescript') && tLang === 'python') {
    return translateJsTsToPython(code);
  }

  if (sLang === 'java' && (tLang === 'typescript' || tLang === 'javascript')) {
    return translateJavaToJsTs(code, tLang === 'typescript');
  }

  return `// Offline Heuristic Translation (${sourceLang} -> ${targetLang})\n` + code;
}

/**
 * Indentation-aware Python to TypeScript / JavaScript translator
 */
function translatePythonToJsTs(code, isTs = true) {
  const lines = code.split('\n');
  const result = [];
  const indentStack = [0];

  const typeMap = {
    int: 'number',
    float: 'number',
    str: 'string',
    bool: 'boolean',
    list: 'any[]',
    dict: 'Record<string, any>',
    None: 'void',
    Any: 'any',
  };

  const mapType = (t) => {
    if (!t) return isTs ? 'any' : '';
    const clean = t.trim();
    return typeMap[clean] || clean;
  };

  const mapParams = (params) => {
    if (!params.trim()) return '';
    return params.split(',').map((p) => {
      const cleanParam = p.trim().replace(/\bself\b,?\s*/, '');
      if (!cleanParam) return '';
      if (cleanParam.includes(':')) {
        const [name, type] = cleanParam.split(':').map((s) => s.trim());
        return isTs ? `${name}: ${mapType(type)}` : name;
      }
      return isTs ? `${cleanParam}: any` : cleanParam;
    }).filter(Boolean).join(', ');
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      result.push('');
      continue;
    }

    // Docstring: """doc""" or '''doc'''
    if ((trimmed.startsWith('"""') && trimmed.endsWith('"""') && trimmed.length > 6) ||
        (trimmed.startsWith("'''") && trimmed.endsWith("'''") && trimmed.length > 6)) {
      const doc = trimmed.slice(3, -3).trim();
      const leading = rawLine.match(/^(\s*)/)[0];
      result.push(`${leading}/** ${doc} */`);
      continue;
    }

    const currentIndent = rawLine.match(/^(\s*)/)[0].length;

    // Pop indent stack and close braces
    while (indentStack.length > 1 && currentIndent < indentStack[indentStack.length - 1]) {
      indentStack.pop();
      const closeSpaces = ' '.repeat(indentStack[indentStack.length - 1]);
      result.push(`${closeSpaces}}`);
    }

    let line = trimmed;
    let isBlock = false;

    // Async def / def
    const fnMatch = line.match(/^(async\s+)?def\s+([a-zA-Z0-9_]+)\s*\((.*?)\)(?:\s*->\s*([a-zA-Z0-9_\[\], ]+))?:/);
    if (fnMatch) {
      const isAsync = !!fnMatch[1];
      const fnName = fnMatch[2];
      const params = mapParams(fnMatch[3]);
      const retType = fnMatch[4] ? mapType(fnMatch[4]) : (isAsync ? 'Promise<any>' : (isTs ? 'void' : ''));
      const asyncPrefix = isAsync ? 'async ' : '';
      const retSuffix = isTs ? (retType ? `: ${retType}` : '') : '';
      line = `${asyncPrefix}function ${fnName}(${params})${retSuffix} {`;
      isBlock = true;
    } else if (line.match(/^class\s+([a-zA-Z0-9_]+)(?:\((.*?)\))?:$/)) {
      const classMatch = line.match(/^class\s+([a-zA-Z0-9_]+)(?:\((.*?)\))?:$/);
      const ext = classMatch[2] && classMatch[2] !== 'object' ? ` extends ${classMatch[2]}` : '';
      line = `class ${classMatch[1]}${ext} {`;
      isBlock = true;
    } else if (line.match(/^if\s+(.*?):$/)) {
      line = line.replace(/^if\s+(.*?):$/, 'if ($1) {');
      isBlock = true;
    } else if (line.match(/^elif\s+(.*?):$/)) {
      line = line.replace(/^elif\s+(.*?):$/, '} else if ($1) {');
      isBlock = true;
    } else if (line === 'else:') {
      line = '} else {';
      isBlock = true;
    } else if (line.match(/^for\s+([a-zA-Z0-9_]+)\s+in\s+range\((.*?)\):$/)) {
      const match = line.match(/^for\s+([a-zA-Z0-9_]+)\s+in\s+range\((.*?)\):$/);
      const varName = match[1];
      const args = match[2].split(',').map((s) => s.trim());
      if (args.length === 1) {
        line = `for (let ${varName} = 0; ${varName} < ${args[0]}; ${varName}++) {`;
      } else if (args.length === 2) {
        line = `for (let ${varName} = ${args[0]}; ${varName} < ${args[1]}; ${varName}++) {`;
      } else if (args.length >= 3) {
        line = `for (let ${varName} = ${args[0]}; ${varName} < ${args[1]}; ${varName} += ${args[2]}) {`;
      }
      isBlock = true;
    } else if (line.match(/^for\s+([a-zA-Z0-9_]+)\s+in\s+(.*?):$/)) {
      line = line.replace(/^for\s+([a-zA-Z0-9_]+)\s+in\s+(.*?):$/, 'for (const $1 of $2) {');
      isBlock = true;
    } else if (line.match(/^while\s+(.*?):$/)) {
      line = line.replace(/^while\s+(.*?):$/, 'while ($1) {');
      isBlock = true;
    } else if (line === 'try:') {
      line = 'try {';
      isBlock = true;
    } else if (line.match(/^except(?:\s+([A-Za-z0-9_]+)(?:\s+as\s+([a-zA-Z0-9_]+))?)?:$/)) {
      const exMatch = line.match(/^except(?:\s+([A-Za-z0-9_]+)(?:\s+as\s+([a-zA-Z0-9_]+))?)?:$/);
      const errVar = exMatch[2] || 'err';
      line = `} catch (${errVar}) {`;
      isBlock = true;
    } else if (line.startsWith('import asyncio') || line.startsWith('from asyncio import')) {
      line = '// asyncio is handled natively via JavaScript/TypeScript async/await';
    } else if (line.match(/^raise\s+([A-Za-z0-9_]+)\((.*)\)$/)) {
      line = line.replace(/^raise\s+([A-Za-z0-9_]+)\((.*)\)$/, 'throw new Error($2);');
    } else {
      // General expression replacements
      line = line
        .replace(/\.append\((.*?)\)/g, '.push($1)')
        .replace(/\blen\((.*?)\)/g, '$1.length')
        .replace(/\bNone\b/g, 'null')
        .replace(/\bTrue\b/g, 'true')
        .replace(/\bFalse\b/g, 'false')
        .replace(/\bprint\((.*?)\)/g, 'console.log($1)');

      if (line.match(/^[a-zA-Z0-9_]+\s*=\s*\[\]/)) {
        line = isTs ? line.replace(/^([a-zA-Z0-9_]+)\s*=\s*\[\]/, 'const $1: any[] = [];') : 'const ' + line + ';';
      } else if (line.match(/^[a-zA-Z0-9_]+\s*=/)) {
        line = 'let ' + line + ';';
      } else if (line.startsWith('return ') && !line.endsWith(';')) {
        line = line + ';';
      } else if (!line.endsWith(';') && !line.endsWith('{') && !line.startsWith('//')) {
        line = line + ';';
      }
    }

    const prefixSpaces = ' '.repeat(currentIndent);
    result.push(prefixSpaces + line);

    if (isBlock) {
      const nextIndent = (i + 1 < lines.length && lines[i + 1].trim())
        ? lines[i + 1].match(/^(\s*)/)[0].length
        : currentIndent + 4;
      indentStack.push(nextIndent);
    }
  }

  while (indentStack.length > 1) {
    indentStack.pop();
    const closeSpaces = ' '.repeat(indentStack[indentStack.length - 1]);
    result.push(`${closeSpaces}}`);
  }

  return (isTs ? `// Auto-translated to TypeScript\n` : `// Auto-translated to JavaScript\n`) + result.join('\n');
}

/**
 * Indentation-aware Python to C++ / Java translator
 */
function translatePythonToCppJava(code, targetLang) {
  const isCpp = targetLang === 'cpp' || targetLang === 'c++';
  const lines = code.split('\n');
  const result = [];
  const indentStack = [0];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      result.push('');
      continue;
    }

    const currentIndent = rawLine.match(/^(\s*)/)[0].length;
    while (indentStack.length > 1 && currentIndent < indentStack[indentStack.length - 1]) {
      indentStack.pop();
      const closeSpaces = ' '.repeat(indentStack[indentStack.length - 1]);
      result.push(`${closeSpaces}}`);
    }

    let line = trimmed;
    let isBlock = false;

    const fnMatch = line.match(/^def\s+([a-zA-Z0-9_]+)\s*\((.*?)\)(?:\s*->\s*([a-zA-Z0-9_]+))?:/);
    if (fnMatch) {
      const fnName = fnMatch[1];
      const retType = fnMatch[3] === 'int' ? 'int' : (fnMatch[3] === 'str' ? (isCpp ? 'std::string' : 'String') : 'auto');
      line = isCpp ? `${retType} ${fnName}(${fnMatch[2]}) {` : `public static ${retType} ${fnName}(${fnMatch[2]}) {`;
      isBlock = true;
    } else if (line.match(/^if\s+(.*?):$/)) {
      line = line.replace(/^if\s+(.*?):$/, 'if ($1) {');
      isBlock = true;
    } else if (line === 'else:') {
      line = '} else {';
      isBlock = true;
    } else if (line.match(/^for\s+([a-zA-Z0-9_]+)\s+in\s+range\((.*?)\):$/)) {
      const match = line.match(/^for\s+([a-zA-Z0-9_]+)\s+in\s+range\((.*?)\):$/);
      const varName = match[1];
      const args = match[2].split(',').map((s) => s.trim());
      const start = args.length > 1 ? args[0] : '0';
      const stop = args.length > 1 ? args[1] : args[0];
      line = `for (int ${varName} = ${start}; ${varName} < ${stop}; ${varName}++) {`;
      isBlock = true;
    } else if (line.match(/^raise\s+([A-Za-z0-9_]+)\((.*)\)$/)) {
      line = isCpp ? line.replace(/^raise\s+([A-Za-z0-9_]+)\((.*)\)$/, 'throw std::runtime_error($2);') : line.replace(/^raise\s+([A-Za-z0-9_]+)\((.*)\)$/, 'throw new IllegalArgumentException($2);');
    } else {
      line = line
        .replace(/\bprint\((.*?)\)/g, isCpp ? 'std::cout << $1 << std::endl' : 'System.out.println($1)')
        .replace(/\.append\((.*?)\)/g, isCpp ? '.push_back($1)' : '.add($1)');

      if (line.match(/^[a-zA-Z0-9_]+\s*=/)) {
        line = (isCpp ? 'auto ' : 'int ') + line + ';';
      } else if (line.startsWith('return ') && !line.endsWith(';')) {
        line = line + ';';
      } else if (!line.endsWith(';') && !line.endsWith('{')) {
        line = line + ';';
      }
    }

    result.push(' '.repeat(currentIndent) + line);

    if (isBlock) {
      indentStack.push(currentIndent + 4);
    }
  }

  while (indentStack.length > 1) {
    indentStack.pop();
    result.push(' '.repeat(indentStack[indentStack.length - 1]) + '}');
  }

  return (isCpp ? `// Auto-translated to C++\n#include <iostream>\n#include <vector>\n#include <string>\n\n` : `// Auto-translated to Java\npublic class Solution {\n`) + result.join('\n') + (isCpp ? '' : '\n}');
}

/**
 * JS/TS to Python translator
 */
function translateJsTsToPython(code) {
  let translated = code
    .replace(/function\s+([a-zA-Z0-9_]+)\s*\((.*?)\)\s*(?::\s*([a-zA-Z0-9_<>\[\]]+))?\s*\{/g, 'def $1($2):')
    .replace(/const\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\((.*?)\)\s*=>\s*\{/g, 'def $1($2):')
    .replace(/console\.log\((.*?)\);?/g, 'print($1)')
    .replace(/\bnull\b/g, 'None')
    .replace(/\bundefined\b/g, 'None')
    .replace(/\btrue\b/g, 'True')
    .replace(/\bfalse\b/g, 'False')
    .replace(/\.push\((.*?)\)/g, '.append($1)')
    .replace(/\.length\b/g, '')
    .replace(/\} else if \((.*?)\) \{/g, 'elif $1:')
    .replace(/\} else \{/g, 'else:')
    .replace(/if \((.*?)\) \{/g, 'if $1:')
    .replace(/for \(let ([a-zA-Z0-9_]+) = 0; \1 < (.*?); \1\+\+\) \{/g, 'for $1 in range($2):')
    .replace(/for \(const ([a-zA-Z0-9_]+) of (.*?)\) \{/g, 'for $1 in $2:')
    .replace(/while \((.*?)\) \{/g, 'while $1:')
    .replace(/\} catch \((.*?)\) \{/g, 'except Exception as $1:')
    .replace(/throw new Error\((.*?)\);?/g, 'raise ValueError($1)')
    .replace(/;\s*$/gm, '')
    .replace(/\{/g, '')
    .replace(/\}/g, '');

  // Clean empty lines
  const cleanLines = translated.split('\n').filter((l, idx, arr) => l.trim() || (idx > 0 && arr[idx - 1].trim()));
  return `# Auto-translated from TypeScript/JavaScript to Python\n` + cleanLines.join('\n');
}

/**
 * Java to JS/TS translator
 */
function translateJavaToJsTs(code, isTs = true) {
  let translated = code
    .replace(/System\.out\.println\((.*?)\);?/g, 'console.log($1);')
    .replace(/System\.out\.print\((.*?)\);?/g, 'process.stdout.write($1);')
    .replace(/\bpublic\s+static\s+void\s+main\(String\[\]\s+args\)/g, 'function main()')
    .replace(/\bstatic\s+class\b/g, 'export class')
    .replace(/\bpublic\s+class\b/g, 'export class')
    .replace(/\bprivate\s+([A-Za-z0-9_<>\[\]]+)\s+([A-Za-z0-9_]+);/g, isTs ? 'private $2: $1;' : '$2;')
    .replace(/\bpublic\s+([A-Za-z0-9_<>\[\]]+)\s+([A-Za-z0-9_]+);/g, isTs ? 'public $2: $1;' : '$2;')
    .replace(/\b(int|double|float|long|short|byte)\b/g, isTs ? 'number' : '')
    .replace(/\bString\b/g, isTs ? 'string' : '')
    .replace(/\bboolean\b/g, isTs ? 'boolean' : '')
    .replace(/\bchar\b/g, isTs ? 'string' : '')
    .replace(/\bnew\s+ArrayList<.*?>\(\)/g, '[]')
    .replace(/\.add\((.*?)\)/g, '.push($1)');

  return (isTs ? `// Auto-translated from Java to TypeScript\n` : `// Auto-translated from Java to JavaScript\n`) + translated;
}

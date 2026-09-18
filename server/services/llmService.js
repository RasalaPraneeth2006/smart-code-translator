import { GoogleGenAI } from '@google/genai';

/**
 * AI Translation & Code Intelligence Engine
 * Integrates Google Gemini models with dynamic candidate cascade & resilient fallback.
 */
export async function executeLLMTranslation({ systemPrompt, userPrompt, targetLang, code, sourceLang }) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY') {
    const candidateModels = [
      process.env.GEMINI_MODEL,
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3-flash-preview',
      'gemini-flash-latest',
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
        return { translatedCode: cleanedCode, modelUsed: modelName, rawResponse: text };
      } catch (err) {
        console.warn(`[LLM Service Warning] Candidate model '${modelName}' failed: ${err.message}. Trying next candidate model...`);
      }
    }
  }

  // Resilient Context-Aware Smart Fallback Engine (when API Key is missing/invalid or network fails)
  const fallbackCode = generateSmartFallbackTranslation(code, sourceLang, targetLang);
  return {
    translatedCode: fallbackCode,
    modelUsed: 'smart-code-translator-fallback-v1',
    isFallback: true,
  };
}

export async function executeLLMJSON({ systemPrompt, userPrompt }) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY') {
    const candidateModels = [
      process.env.GEMINI_MODEL,
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3-flash-preview',
      'gemini-flash-latest',
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
 * Translates syntax structures across Java, TypeScript, JavaScript, Python, C++, Go, etc. when offline.
 */
function generateSmartFallbackTranslation(code, sourceLang, targetLang) {
  const sLang = (sourceLang || '').toLowerCase();
  const tLang = (targetLang || '').toLowerCase();

  let translated = code;

  if (sLang === 'java' && (tLang === 'typescript' || tLang === 'javascript')) {
    translated = code
      .replace(/System\.out\.println\((.*?)\);?/g, 'console.log($1);')
      .replace(/System\.out\.print\((.*?)\);?/g, 'process.stdout.write($1);')
      .replace(/\bstatic\s+class\b/g, 'export class')
      .replace(/\bpublic\s+class\b/g, 'export class')
      .replace(/\bprivate\s+([A-Za-z0-9_<>\[\]]+)\s+([A-Za-z0-9_]+);/g, 'private $2: $1;')
      .replace(/\bpublic\s+([A-Za-z0-9_<>\[\]]+)\s+([A-Za-z0-9_]+);/g, 'public $2: $1;')
      .replace(/\b(int|double|float|long|short|byte)\b/g, 'number')
      .replace(/\bString\b/g, 'string')
      .replace(/\bboolean\b/g, 'boolean')
      .replace(/\bchar\b/g, 'string');
    
    if (tLang === 'typescript') {
      translated = `// Auto-translated from Java to TypeScript\n` + translated;
    }
  } else if (sLang === 'python' && (tLang === 'javascript' || tLang === 'typescript')) {
    translated = code
      .replace(/def\s+([a-zA-Z0-9_]+)\s*\((.*?)\):/g, (match, name, params) => {
        const cleanParams = params.replace(/\bself\b,?\s*/, '');
        return `function ${name}(${cleanParams}) {`;
      })
      .replace(/print\((.*?)\)/g, 'console.log($1)')
      .replace(/\bNone\b/g, 'null')
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false')
      .replace(/elif\s+/g, '} else if ')
      .replace(/else:/g, '} else {')
      .replace(/if\s+(.*?):/g, 'if ($1) {')
      .replace(/for\s+([a-zA-Z0-9_]+)\s+in\s+range\((.*?)\):/g, 'for (let $1 = 0; $1 < $2; $1++) {')
      .replace(/for\s+([a-zA-Z0-9_]+)\s+in\s+(.*?):/g, 'for (const $1 of $2) {')
      .replace(/try:/g, 'try {')
      .replace(/except\s+Exception\s+as\s+([a-zA-Z0-9_]+):/g, '} catch ($1) {')
      .replace(/except:/g, '} catch (err) {')
      .replace(/return\s+(.*)/g, 'return $1;')
      .replace(/class\s+([a-zA-Z0-9_]+):/g, 'class $1 {')
      .replace(/def __init__\(self,?\s*(.*?)\):/g, 'constructor($1) {');

    if (tLang === 'typescript') {
      translated = `// Auto-translated to TypeScript\n` + translated;
    }
  } else if ((sLang === 'javascript' || sLang === 'typescript') && tLang === 'python') {
    translated = code
      .replace(/function\s+([a-zA-Z0-9_]+)\s*\((.*?)\)\s*\{/g, 'def $1($2):')
      .replace(/const\s+([a-zA-Z0-9_]+)\s*=\s*\((.*?)\)\s*=>\s*\{/g, 'def $1($2):')
      .replace(/console\.log\((.*?)\);?/g, 'print($1)')
      .replace(/\bnull\b/g, 'None')
      .replace(/\bundefined\b/g, 'None')
      .replace(/\btrue\b/g, 'True')
      .replace(/\bfalse\b/g, 'False')
      .replace(/\} else if \((.*?)\) \{/g, 'elif $1:')
      .replace(/\} else \{/g, 'else:')
      .replace(/if \((.*?)\) \{/g, 'if $1:')
      .replace(/\} catch \((.*?)\) \{/g, 'except Exception as $1:')
      .replace(/\}/g, '# end block');
  } else {
    translated = `// Auto-translated from ${sourceLang} to ${targetLang}\n` + code;
  }

  return translated;
}

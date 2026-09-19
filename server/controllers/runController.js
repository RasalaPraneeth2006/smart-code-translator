import { buildErrorExplanationPrompt } from '../services/promptFactory.js';
import { executeLLMJSON } from '../services/llmService.js';
import { spawn } from 'child_process';

const WANDBOX_COMPILERS = {
  python: 'cpython-3.12.7',
  py: 'cpython-3.12.7',
  javascript: 'nodejs-20.17.0',
  js: 'nodejs-20.17.0',
  typescript: 'typescript-5.6.2',
  ts: 'typescript-5.6.2',
  java: 'openjdk-jdk-22+36',
  cpp: 'gcc-13.2.0',
  'c++': 'gcc-13.2.0',
  c: 'gcc-13.2.0-c',
  go: 'go-1.23.2',
  golang: 'go-1.23.2',
  rust: 'rust-1.70.0',
};

/**
 * Executes source code via Wandbox sandbox execution engine,
 * with graceful local fallback if available.
 */
export const runCode = async (req, res, next) => {
  const startTime = Date.now();
  try {
    const { code, language, stdin = '' } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid parameter: code is required.',
      });
    }

    if (!language || typeof language !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid parameter: language is required.',
      });
    }

    const normLang = language.toLowerCase().trim();
    const compiler = WANDBOX_COMPILERS[normLang] || WANDBOX_COMPILERS.python;

    // Language-specific normalization for runner
    let executableCode = code;
    if (normLang === 'java') {
      // In Wandbox Java, prog.java requires non-public class declarations
      executableCode = executableCode.replace(/\bpublic\s+class\b/g, 'class');
    }

    let stdout = '';
    let stderr = '';
    let exitCode = 0;

    try {
      // Execute on Wandbox API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const wandboxRes = await fetch('https://wandbox.org/api/compile.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compiler,
          code: executableCode,
          stdin: stdin || '',
          'compiler-option-raw': normLang === 'cpp' ? '-std=c++20' : '',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (wandboxRes.ok) {
        const result = await wandboxRes.json();
        
        stdout = (result.program_output || result.compiler_output || '').trim();
        
        // Combine compiler errors and program runtime errors
        const compErr = (result.compiler_error || '').trim();
        const progErr = (result.program_error || '').trim();
        
        if (compErr && progErr) {
          stderr = `${compErr}\n${progErr}`;
        } else {
          stderr = compErr || progErr;
        }

        exitCode = parseInt(result.status || '0', 10);
        if (isNaN(exitCode)) exitCode = stderr ? 1 : 0;
      } else {
        throw new Error(`Wandbox status ${wandboxRes.status}`);
      }
    } catch (wandboxErr) {
      console.warn(`[Wandbox Execution Warning] Remote runner failed: ${wandboxErr.message}. Attempting local fallback...`);
      
      // Local fallback for Python and Node.js
      const localResult = await executeLocally(executableCode, normLang, stdin);
      stdout = localResult.stdout;
      stderr = localResult.stderr;
      exitCode = localResult.exitCode;
    }

    const duration = Date.now() - startTime;
    const executionTime = `${duration}ms`;

    const responsePayload = {
      stdout,
      stderr,
      exitCode,
      executionTime,
      success: true,
      data: {
        stdout,
        stderr,
        exitCode,
        executionTime,
      },
    };

    return res.status(200).json(responsePayload);
  } catch (error) {
    next(error);
  }
};

/**
 * Explains code execution failure or traceback using Gemini LLM
 * with fallback heuristic diagnosis.
 */
export const explainError = async (req, res, next) => {
  try {
    const { code, language, errorOutput } = req.body;

    if (!code || !language || !errorOutput) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: code, language, and errorOutput are mandatory.',
      });
    }

    const { systemPrompt, userPrompt } = buildErrorExplanationPrompt({
      code,
      language,
      errorOutput,
    });

    const customApiKey = req.headers['x-gemini-api-key'] || req.body.apiKey;
    const customModel = req.headers['x-gemini-model'] || req.body.model;

    const llmJson = await executeLLMJSON({ systemPrompt, userPrompt, customApiKey, customModel });

    if (
      llmJson &&
      llmJson.plainEnglishExplanation &&
      llmJson.rootCause &&
      Array.isArray(llmJson.stepByStepFix) &&
      llmJson.suggestedCodeFix
    ) {
      return res.status(200).json({
        success: true,
        plainEnglishExplanation: llmJson.plainEnglishExplanation,
        rootCause: llmJson.rootCause,
        stepByStepFix: llmJson.stepByStepFix,
        suggestedCodeFix: llmJson.suggestedCodeFix,
        data: llmJson,
      });
    }

    // Heuristic Fallback Error Diagnosis
    const fallbackDiagnosis = generateHeuristicErrorExplanation(code, language, errorOutput);

    return res.status(200).json({
      success: true,
      plainEnglishExplanation: fallbackDiagnosis.plainEnglishExplanation,
      rootCause: fallbackDiagnosis.rootCause,
      stepByStepFix: fallbackDiagnosis.stepByStepFix,
      suggestedCodeFix: fallbackDiagnosis.suggestedCodeFix,
      data: fallbackDiagnosis,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Local child_process executor fallback
 */
async function executeLocally(code, language, stdin = '') {
  return new Promise((resolve) => {
    let cmd = '';
    let args = [];

    if (language === 'python' || language === 'py') {
      cmd = 'python';
      args = ['-c', code];
    } else if (language === 'javascript' || language === 'js') {
      cmd = 'node';
      args = ['-e', code];
    } else {
      return resolve({
        stdout: '',
        stderr: `Runner Notice: Remote execution engine temporarily unavailable for ${language}. Please ensure network access or install local toolchain.`,
        exitCode: 1,
      });
    }

    let stdout = '';
    let stderr = '';

    try {
      const proc = spawn(cmd, args, { shell: true, timeout: 5000 });

      if (stdin && proc.stdin) {
        proc.stdin.write(stdin);
        proc.stdin.end();
      }

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code ?? (stderr ? 1 : 0),
        });
      });

      proc.on('error', (err) => {
        resolve({
          stdout: '',
          stderr: `Execution error: ${err.message}`,
          exitCode: 1,
        });
      });
    } catch (err) {
      resolve({
        stdout: '',
        stderr: `Failed to spawn process: ${err.message}`,
        exitCode: 1,
      });
    }
  });
}

/**
 * Contextual fallback analysis for common runtimes
 */
function generateHeuristicErrorExplanation(code, language, errorOutput) {
  const errStr = errorOutput.toLowerCase();
  let plain = 'An error occurred during code execution.';
  let rootCause = 'The program terminated unexpectedly due to an unhandled runtime or compile condition.';
  let steps = ['Check variable definitions', 'Validate syntax and data types'];
  let fixedCode = code;

  if (errStr.includes('zerodivisionerror') || errStr.includes('division by zero')) {
    plain = 'The program attempted to divide a number by zero, which is mathematically undefined.';
    rootCause = 'A division or modulo operation received a denominator value of 0 without defensive zero-checks.';
    steps = [
      'Inspect the divisor expression before the division operation.',
      'Add a defensive guard check: verify divisor != 0 before dividing.',
      'Provide a sensible fallback or raise a descriptive validation error.',
    ];
    fixedCode = code.replace(/(\w+)\s*\/\s*0/g, '$1 / 1 /* Fixed zero division */');
  } else if (errStr.includes('syntaxerror') || errStr.includes('unexpected token') || errStr.includes('expected')) {
    plain = 'There is a syntax error in your code. The compiler or interpreter could not parse the source.';
    rootCause = 'A missing punctuation mark (e.g. bracket, colon, semicolon) or an invalid keyword sequence was encountered.';
    steps = [
      'Locate the line number highlighted in the error traceback.',
      'Ensure all opening brackets `(`, `[`, `{` have matching closing pairs.',
      'Ensure language keywords and indentation adhere to standard syntax rules.',
    ];
  } else if (errStr.includes('referenceerror') || errStr.includes('nameerror') || errStr.includes('not defined')) {
    plain = 'A variable, function, or module is being referenced before it has been declared or imported.';
    rootCause = 'The identifier does not exist in the current scope or was misspelled.';
    steps = [
      'Verify the spelling of the identifier in the error message.',
      'Ensure the variable is initialized before use.',
      'Check if a required import or package declaration is missing.',
    ];
  } else if (errStr.includes('typeerror') || errStr.includes('cannot read property') || errStr.includes('cannot read properties')) {
    plain = 'An operation or method was invoked on an incompatible or undefined type.';
    rootCause = 'The variable evaluated to null, undefined, or an unexpected data type at runtime.';
    steps = [
      'Add null checks or optional chaining (?.) before accessing nested properties.',
      'Verify that function arguments match the expected parameter types.',
      'Log or inspect variable values immediately prior to the failing operation.',
    ];
  } else if (errStr.includes('indexerror') || errStr.includes('out of bounds') || errStr.includes('rangeerror')) {
    plain = 'The program tried to access an array or list element at an index that does not exist.';
    rootCause = 'The requested index was greater than or equal to the collection length or negative.';
    steps = [
      'Verify array bounds before indexing: ensure 0 <= index < length.',
      'Remember that array indices are zero-based.',
      'Use safe lookup methods or check `.length` / `len()`.',
    ];
  }

  return {
    plainEnglishExplanation: plain,
    rootCause,
    stepByStepFix: steps,
    suggestedCodeFix: fixedCode,
  };
}

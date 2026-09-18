import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import {
  Play,
  Sparkles,
  RotateCcw,
  Trash2,
  Terminal as TerminalIcon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Keyboard,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileCode,
  Zap
} from 'lucide-react';
import { codeService } from '../services/api';
import ErrorExplainerModal from './ErrorExplainerModal';
import OptimizeModal from './OptimizeModal';

export const COMPILER_LANGUAGES = [
  {
    id: 'python',
    name: 'Python',
    monaco: 'python',
    ext: 'py',
    template: `# Python 3.12 Playground
def calculate_primes(limit: int) -> list[int]:
    """Sieve of Eratosthenes algorithm to compute prime numbers."""
    if limit < 2:
        return []
    sieve = [True] * (limit + 1)
    sieve[0] = sieve[1] = False
    
    for i in range(2, int(limit**0.5) + 1):
        if sieve[i]:
            for j in range(i*i, limit + 1, i):
                sieve[j] = False
                
    return [num for num, is_prime in enumerate(sieve) if is_prime]

# Run benchmark
primes = calculate_primes(50)
print(f"Computed {len(primes)} primes up to 50:")
print(primes)
`,
  },
  {
    id: 'javascript',
    name: 'JavaScript (Node.js)',
    monaco: 'javascript',
    ext: 'js',
    template: `// JavaScript (ES6+ / Node.js 20) Playground
function fibonacciSequence(n) {
  const seq = [0, 1];
  for (let i = 2; i < n; i++) {
    seq.push(seq[i - 1] + seq[i - 2]);
  }
  return seq.slice(0, n);
}

const numbers = fibonacciSequence(12);
console.log("First 12 Fibonacci Numbers:");
console.log(numbers.join(" -> "));

const sum = numbers.reduce((acc, curr) => acc + curr, 0);
console.log(\`Total Sum: \${sum}\`);
`,
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    monaco: 'typescript',
    ext: 'ts',
    template: `// TypeScript 5.6 Playground
interface Task {
  id: number;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

class TaskManager {
  private tasks: Task[] = [];

  addTask(title: string, priority: Task['priority'] = 'medium'): Task {
    const task: Task = {
      id: this.tasks.length + 1,
      title,
      completed: false,
      priority,
    };
    this.tasks.push(task);
    return task;
  }

  getSummary(): void {
    console.log(\`Total Tasks Registered: \${this.tasks.length}\`);
    this.tasks.forEach(t => console.log(\`[\${t.priority.toUpperCase()}] \${t.title} - Pending\`));
  }
}

const manager = new TaskManager();
manager.addTask("Implement Online Compiler UI", "high");
manager.addTask("Add AI Error Explainer Drawer", "high");
manager.addTask("Deploy Production Bundle", "medium");
manager.getSummary();
`,
  },
  {
    id: 'java',
    name: 'Java (OpenJDK 22)',
    monaco: 'java',
    ext: 'java',
    template: `// Java OpenJDK 22 Playground
import java.util.*;

public class Main {
    public static void main(String[] args) {
        System.out.println("=== Quick Sort Benchmark in Java ===");
        int[] arr = { 64, 34, 25, 12, 22, 11, 90, 88, 45, 5 };
        
        System.out.println("Original: " + Arrays.toString(arr));
        Arrays.sort(arr);
        System.out.println("Sorted  : " + Arrays.toString(arr));
        
        int sum = Arrays.stream(arr).sum();
        System.out.println("Array Sum = " + sum);
    }
}
`,
  },
  {
    id: 'cpp',
    name: 'C++ (GCC 13)',
    monaco: 'cpp',
    ext: 'cpp',
    template: `// C++20 (GCC 13.2) Playground
#include <iostream>
#include <vector>
#include <numeric>
#include <algorithm>

int main() {
    std::cout << "--- C++ Modern Algorithms ---" << std::endl;
    std::vector<int> numbers = {10, 20, 5, 40, 15, 30};
    
    std::sort(numbers.begin(), numbers.end());
    std::cout << "Sorted Numbers: ";
    for (int n : numbers) {
        std::cout << n << " ";
    }
    std::cout << std::endl;
    
    int sum = std::accumulate(numbers.begin(), numbers.end(), 0);
    std::cout << "Sum: " << sum << std::endl;
    return 0;
}
`,
  },
  {
    id: 'go',
    name: 'Go (1.23)',
    monaco: 'go',
    ext: 'go',
    template: `// Go 1.23 Playground
package main

import (
	"fmt"
	"strings"
)

func main() {
	fmt.Println("=== Go Polyglot Runner ===")
	words := []string{"anti-gravity", "compiler", "polyglot", "debugger"}
	
	for i, w := range words {
		fmt.Printf("[%d] %s (length: %d)\\n", i+1, strings.ToUpper(w), len(w))
	}
}
`,
  },
];

export default function OnlineCompiler() {
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [code, setCode] = useState(COMPILER_LANGUAGES[0].template);
  const [stdin, setStdin] = useState('');
  const [showStdin, setShowStdin] = useState(false);

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [stdout, setStdout] = useState('');
  const [stderr, setStderr] = useState('');
  const [exitCode, setExitCode] = useState(null);
  const [executionTime, setExecutionTime] = useState('');
  const [hasExecuted, setHasExecuted] = useState(false);

  // Error Explainer state
  const [isExplaining, setIsExplaining] = useState(false);
  const [errorExplainerData, setErrorExplainerData] = useState(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  // Optimization state
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationData, setOptimizationData] = useState(null);
  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false);

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedConsole, setCopiedConsole] = useState(false);

  // Language change handler
  const handleLanguageChange = (langId) => {
    setSelectedLanguage(langId);
    const langObj = COMPILER_LANGUAGES.find((l) => l.id === langId);
    if (langObj) {
      setCode(langObj.template);
      setStdout('');
      setStderr('');
      setExitCode(null);
      setExecutionTime('');
      setHasExecuted(false);
    }
  };

  // Keyboard shortcut: Ctrl+Enter / Cmd+Enter to run
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunCode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, selectedLanguage, stdin]);

  // Execute Code
  const handleRunCode = async () => {
    if (!code.trim() || isRunning) return;
    setIsRunning(true);
    setStdout('');
    setStderr('');
    setExitCode(null);
    setExecutionTime('');
    setHasExecuted(true);

    try {
      const res = await codeService.runCode({
        code,
        language: selectedLanguage,
        stdin,
      });

      if (res.data) {
        const payload = res.data.data || res.data;
        setStdout(payload.stdout || '');
        setStderr(payload.stderr || '');
        setExitCode(payload.exitCode ?? (payload.stderr ? 1 : 0));
        setExecutionTime(payload.executionTime || '0ms');
      }
    } catch (err) {
      const errResponse = err.response?.data;
      setStderr(errResponse?.error || errResponse?.stderr || err.message || 'Execution failed.');
      setExitCode(1);
    } finally {
      setIsRunning(false);
    }
  };

  // Trigger AI Error Explainer
  const handleExplainError = async () => {
    const errorTrace = stderr || stdout;
    if (!errorTrace) return;

    setIsExplaining(true);
    setIsErrorModalOpen(true);
    setErrorExplainerData(null);

    try {
      const res = await codeService.explainError({
        code,
        language: selectedLanguage,
        errorOutput: errorTrace,
      });

      if (res.data) {
        const payload = res.data.data || res.data;
        setErrorExplainerData(payload);
      }
    } catch (err) {
      setErrorExplainerData({
        plainEnglishExplanation: 'Failed to communicate with AI explanation service.',
        rootCause: err.message,
        stepByStepFix: ['Review syntax manually', 'Check compiler configuration'],
        suggestedCodeFix: code,
      });
    } finally {
      setIsExplaining(false);
    }
  };

  // Trigger AI Code Optimizer
  const handleOptimizeCode = async () => {
    if (!code.trim() || isOptimizing) return;

    setIsOptimizing(true);
    setIsOptimizeModalOpen(true);
    setOptimizationData(null);

    try {
      const res = await codeService.optimize({
        code,
        language: selectedLanguage,
      });

      if (res.data) {
        const payload = res.data.data || res.data;
        setOptimizationData(payload);
      }
    } catch (err) {
      alert(`Optimization error: ${err.response?.data?.error || err.message}`);
      setIsOptimizeModalOpen(false);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Reset to default template
  const handleResetTemplate = () => {
    const langObj = COMPILER_LANGUAGES.find((l) => l.id === selectedLanguage);
    if (langObj) {
      setCode(langObj.template);
    }
  };

  // Clear console
  const handleClearConsole = () => {
    setStdout('');
    setStderr('');
    setExitCode(null);
    setExecutionTime('');
    setHasExecuted(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyConsoleOutput = () => {
    const combined = [stdout, stderr].filter(Boolean).join('\n');
    navigator.clipboard.writeText(combined);
    setCopiedConsole(true);
    setTimeout(() => setCopiedConsole(false), 2000);
  };

  const currentLangObj = COMPILER_LANGUAGES.find((l) => l.id === selectedLanguage);
  const monacoLang = currentLangObj?.monaco || 'python';
  const hasError = hasExecuted && (exitCode !== 0 || (stderr && stderr.trim().length > 0));

  return (
    <div className="flex flex-col h-[calc(100vh-4.2rem)] p-3 space-y-3">
      {/* Top Toolbar */}
      <div className="glass-panel rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-3 border border-gray-800">
        <div className="flex items-center space-x-3">
          {/* Language Selector */}
          <div className="flex items-center space-x-2 bg-dark-900/90 px-3 py-1.5 rounded-lg border border-gray-800">
            <span className="text-xs text-gray-400 font-mono">Language:</span>
            <select
              value={selectedLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-amber-400 focus:outline-none cursor-pointer"
            >
              {COMPILER_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id} className="bg-dark-800 text-white">
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleResetTemplate}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs text-gray-400 hover:text-white rounded-lg hover:bg-gray-800/60 transition"
            title="Reset code to default template"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Template</span>
          </button>

          <button
            onClick={() => setShowStdin(!showStdin)}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 text-xs rounded-lg transition ${
              showStdin
                ? 'bg-dark-700 text-amber-400 border border-amber-500/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
            }`}
            title="Toggle standard input (stdin)"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Stdin</span>
            {showStdin ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleOptimizeCode}
            disabled={isOptimizing || !code}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-gray-200 bg-dark-800 hover:bg-gray-800 border border-gray-700/80 rounded-lg transition disabled:opacity-50"
            title="Analyze and refactor with AI optimization"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
            <span>✨ Optimize Code</span>
          </button>

          <button
            onClick={handleRunCode}
            disabled={isRunning || !code}
            className="glow-button flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-bold text-white shadow-lg transition disabled:opacity-50 cursor-pointer"
            title="Run Code (Ctrl+Enter)"
          >
            {isRunning ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Compiling & Running...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white text-white" />
                <span>▶ Run Code</span>
                <span className="hidden md:inline text-[10px] opacity-70 font-mono ml-1">(Ctrl+↵)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Optional Stdin Drawer */}
      {showStdin && (
        <div className="glass-panel rounded-xl p-3 border border-gray-800 space-y-1.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-300 font-mono flex items-center space-x-1.5">
              <Keyboard className="w-3.5 h-3.5 text-amber-400" />
              <span>Standard Input (stdin)</span>
            </span>
            <span className="text-[11px] text-gray-500">Provide input lines for stdin prompts</span>
          </div>
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Type standard input passed to the program here..."
            rows={2}
            className="w-full bg-dark-900 text-xs font-mono text-gray-200 p-2.5 rounded-lg border border-gray-800 focus:border-amber-500/50 focus:outline-none placeholder-gray-600 resize-y"
          />
        </div>
      )}

      {/* Workbench Grid: Top Editor + Bottom Console */}
      <div className="grid grid-rows-[3fr_2fr] gap-3 flex-1 min-h-0">
        {/* Top Monaco Editor Pane */}
        <div className="glass-panel rounded-xl flex flex-col overflow-hidden border border-gray-800">
          <div className="px-4 py-2.5 bg-dark-800/80 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-gray-200 uppercase tracking-wider font-mono">
                Source Editor ({currentLangObj?.name})
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Executable Sandbox
              </span>
            </div>

            <button
              onClick={copyCode}
              className="flex items-center space-x-1 px-2 py-1 text-[11px] text-gray-400 hover:text-white rounded hover:bg-gray-700/50 transition"
            >
              {copiedCode ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="flex-1 relative">
            <Editor
              height="100%"
              language={monacoLang}
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val || '')}
              options={{
                fontSize: 13,
                fontFamily: 'JetBrains Mono',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 12 },
              }}
            />
          </div>
        </div>

        {/* Bottom Interactive Terminal / Console Pane */}
        <div className="glass-panel rounded-xl flex flex-col overflow-hidden border border-gray-800 shadow-2xl">
          {/* Console Header */}
          <div className="px-4 py-2 bg-dark-800/90 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5">
                <TerminalIcon className="w-4 h-4 text-green-400" />
                <span className="text-xs font-bold text-gray-200 font-mono">
                  Execution Terminal
                </span>
              </div>

              {/* Status Badges */}
              {hasExecuted && (
                <div className="flex items-center space-x-2">
                  {exitCode === 0 ? (
                    <span className="flex items-center space-x-1 px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-green-500/20 text-green-400 border border-green-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Exit Code: 0</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Exit Code: {exitCode}</span>
                    </span>
                  )}

                  {executionTime && (
                    <span className="flex items-center space-x-1 px-2 py-0.5 text-[10px] font-mono rounded bg-dark-700 text-gray-300 border border-gray-700">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span>{executionTime}</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={copyConsoleOutput}
                disabled={!stdout && !stderr}
                className="flex items-center space-x-1 px-2 py-1 text-[11px] text-gray-400 hover:text-white rounded hover:bg-gray-700/50 transition disabled:opacity-40"
              >
                {copiedConsole ? (
                  <Check className="w-3 h-3 text-green-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copiedConsole ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleClearConsole}
                className="flex items-center space-x-1 px-2 py-1 text-[11px] text-gray-400 hover:text-white rounded hover:bg-gray-700/50 transition"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Console Content Area */}
          <div className="flex-1 bg-[#070A12] p-3.5 font-mono text-xs overflow-y-auto space-y-2 select-text">
            {isRunning ? (
              <div className="flex items-center space-x-2 text-gray-400 py-2">
                <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <span>Executing code in isolated container runtime...</span>
              </div>
            ) : !hasExecuted ? (
              <div className="text-gray-500 py-3 italic flex items-center space-x-2">
                <span>$ Execution output will appear here. Click "▶ Run Code" or press Ctrl+Enter.</span>
              </div>
            ) : (
              <>
                {/* Standard Output Stream */}
                {stdout && (
                  <div className="text-emerald-300 whitespace-pre-wrap leading-relaxed font-mono">
                    {stdout}
                  </div>
                )}

                {/* Standard Error Stream */}
                {stderr && (
                  <div className="text-red-400 whitespace-pre-wrap leading-relaxed font-mono p-2.5 rounded-lg bg-red-950/20 border border-red-800/40">
                    {stderr}
                  </div>
                )}

                {/* Blank output state */}
                {!stdout && !stderr && (
                  <div className="text-gray-400 italic">
                    Program terminated with return code 0 (no output produced).
                  </div>
                )}
              </>
            )}
          </div>

          {/* Console Footer with AI Explain Error Trigger */}
          {hasError && (
            <div className="px-4 py-2.5 bg-gradient-to-r from-red-950/40 via-amber-950/30 to-dark-800 border-t border-red-900/40 flex items-center justify-between flex-wrap gap-2 animate-fade-in">
              <div className="flex items-center space-x-2 text-red-300 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Execution error detected. Cryptic traceback or non-zero status.</span>
              </div>

              <button
                onClick={handleExplainError}
                className="flex items-center space-x-2 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-lg shadow-lg shadow-amber-600/30 transition transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5 animate-bounce" />
                <span>💡 Explain & Fix Error</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI Error Explainer Modal */}
      <ErrorExplainerModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        data={errorExplainerData}
        isLoading={isExplaining}
        language={selectedLanguage}
        onApplyFix={(fixedCode) => {
          setCode(fixedCode);
          setIsErrorModalOpen(false);
        }}
      />

      {/* AI Optimizer Modal */}
      <OptimizeModal
        isOpen={isOptimizeModalOpen}
        onClose={() => setIsOptimizeModalOpen(false)}
        data={optimizationData}
        isLoading={isOptimizing}
        language={selectedLanguage}
        onApplyOptimization={(optimizedCode) => {
          setCode(optimizedCode);
          setIsOptimizeModalOpen(false);
        }}
      />
    </div>
  );
}

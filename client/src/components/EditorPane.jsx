import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import {
  ArrowRight,
  Zap,
  Cpu,
  Sparkles,
  Check,
  Copy,
  Download,
  Code,
  FileCode,
  FileCheck2,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Edit3,
  AlertTriangle,
} from 'lucide-react';

export const SUPPORTED_LANGUAGES = [
  { id: 'python', name: 'Python', monaco: 'python', ext: 'py', sample: `def calculate_factorial(n: int) -> int:\n    if n < 0:\n        raise ValueError("Factorial is not defined for negative numbers")\n    result = 1\n    for i in range(1, n + 1):\n        result *= i\n    return result` },
  { id: 'javascript', name: 'JavaScript (ES6+)', monaco: 'javascript', ext: 'js', sample: `async function fetchUserData(userId) {\n  try {\n    const response = await fetch(\`/api/users/\${userId}\`);\n    const data = await response.json();\n    return data?.profile?.name ?? "Anonymous";\n  } catch (err) {\n    console.error("Failed to fetch user:", err);\n    return null;\n  }\n}` },
  { id: 'typescript', name: 'TypeScript', monaco: 'typescript', ext: 'ts', sample: `interface UserProfile {\n  id: string;\n  name: string;\n  role: 'admin' | 'user';\n}\n\nexport async function getUserRole(user: UserProfile): Promise<string> {\n  return user.role === 'admin' ? 'Administrator' : 'Standard User';\n}` },
  { id: 'java', name: 'Java', monaco: 'java', ext: 'java', sample: `public class DataProcessor {\n    public static int findMax(int[] numbers) {\n        int max = numbers[0];\n        for (int i = 1; i < numbers.length; i++) {\n            if (numbers[i] > max) {\n                max = numbers[i];\n            }\n        }\n        return max;\n    }\n}` },
  { id: 'cpp', name: 'C++', monaco: 'cpp', ext: 'cpp', sample: `#include <iostream>\n#include <vector>\n#include <algorithm>\n\nint main() {\n    std::vector<int> numbers = {5, 2, 8, 1, 9};\n    std::sort(numbers.begin(), numbers.end());\n    for(int n : numbers) {\n        std::cout << n << " ";\n    }\n    return 0;\n}` },
  { id: 'csharp', name: 'C# (.NET)', monaco: 'csharp', ext: 'cs', sample: `using System;\nusing System.Collections.Generic;\n\npublic class Program {\n    public static int Add(int a, int b) {\n        return a + b;\n    }\n}` },
  { id: 'c', name: 'C', monaco: 'c', ext: 'c', sample: `#include <stdio.h>\n\nint add(int a, int b) {\n    return a + b;\n}\n\nint main() {\n    printf("%d\\n", add(3, 4));\n    return 0;\n}` },
  { id: 'go', name: 'Go', monaco: 'go', ext: 'go', sample: `package main\n\nimport (\n\t"errors"\n\t"fmt"\n)\n\nfunc Divide(a, b float64) (float64, error) {\n\tif b == 0 {\n\t\treturn 0, errors.New("cannot divide by zero")\n\t}\n\treturn a / b, nil\n}` },
  { id: 'rust', name: 'Rust', monaco: 'rust', ext: 'rs', sample: `pub fn find_max(numbers: &[i32]) -> Option<i32> {\n    numbers.iter().cloned().max()\n}` },
  { id: 'sql', name: 'SQL', monaco: 'sql', ext: 'sql', sample: `SELECT u.id, u.name, COUNT(o.id) as total_orders\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nWHERE u.active = true\nGROUP BY u.id, u.name;\n` },
  { id: 'php', name: 'PHP', monaco: 'php', ext: 'php', sample: `<?php\nfunction calculateTax(float $amount, float $rate = 0.15): float {\n    return $amount * $rate;\n}` },
  { id: 'swift', name: 'Swift', monaco: 'swift', ext: 'swift', sample: `import Foundation\n\nstruct User {\n    let id: Int\n    var name: String\n}\n\nfunc greetUser(user: User) -> String {\n    return "Hello, \\(user.name)!"\n}` },
  { id: 'kotlin', name: 'Kotlin', monaco: 'kotlin', ext: 'kt', sample: `fun main() {\n    val items = listOf("apple", "banana", "kiwi")\n    for (item in items) {\n        println(item)\n    }\n}` },
  { id: 'custom', name: 'Other / Custom Language...', monaco: 'plaintext', ext: 'txt', sample: `// Enter your custom language code here` }
];

export default function EditorPane({
  sourceLang,
  setSourceLang,
  targetLang,
  setTargetLang,
  sourceCode,
  setSourceCode,
  translatedCode,
  setTranslatedCode,
  astData,
  testStubs,
  onTranslate,
  onAnalyze,
  onOptimize,
  isLoading,
  preserveComments,
  setPreserveComments,
  includeTests,
  setIncludeTests,
  activeOutputTab,
  setActiveOutputTab,
  isFallback = false,
  modelUsed = '',
  latencyMs = 0,
  openAISettings,
}) {
  const [copiedSource, setCopiedSource] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState(false);
  const [customSource, setCustomSource] = useState('');
  const [customTarget, setCustomTarget] = useState('');

  const handleSourceLangChange = (langId) => {
    setSourceLang(langId);
    const langConfig = SUPPORTED_LANGUAGES.find((l) => l.id === langId);
    if (langConfig && (!sourceCode || sourceCode.trim() === '')) {
      setSourceCode(langConfig.sample);
    }
  };

  const copyToClipboard = (text, isSource) => {
    navigator.clipboard.writeText(text);
    if (isSource) {
      setCopiedSource(true);
      setTimeout(() => setCopiedSource(false), 2000);
    } else {
      setCopiedTarget(true);
      setTimeout(() => setCopiedTarget(false), 2000);
    }
  };

  const downloadFile = (code, lang) => {
    const extMap = {
      python: 'py', javascript: 'js', typescript: 'ts', java: 'java',
      cpp: 'cpp', csharp: 'cs', c: 'c', go: 'go', rust: 'rs',
      sql: 'sql', php: 'php', swift: 'swift', kotlin: 'kt'
    };
    const ext = extMap[lang] || 'txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translated_code.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const effectiveSourceLang = sourceLang === 'custom' ? (customSource.trim() || 'Custom') : sourceLang;
  const effectiveTargetLang = targetLang === 'custom' ? (customTarget.trim() || 'Custom') : targetLang;

  const sourceMonaco = SUPPORTED_LANGUAGES.find((l) => l.id === sourceLang)?.monaco || 'javascript';
  const targetMonaco = SUPPORTED_LANGUAGES.find((l) => l.id === targetLang)?.monaco || 'typescript';

  return (
    <div className="flex flex-col h-[calc(100vh-4.2rem)] p-3 space-y-3">
      {/* Top Action & Language Toolbar */}
      <div className="glass-panel rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-3 border border-gray-800">
        {/* Source & Target Language Selectors */}
        <div className="flex items-center flex-wrap gap-3">
          <div className="flex items-center space-x-2 bg-dark-900/90 px-3 py-1.5 rounded-lg border border-gray-800">
            <span className="text-xs text-gray-400 font-mono">Source:</span>
            <select
              value={sourceLang}
              onChange={(e) => handleSourceLangChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-brand-cyan focus:outline-none cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id} className="bg-dark-800 text-white">
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {sourceLang === 'custom' && (
            <div className="flex items-center space-x-1.5 bg-dark-900/90 px-2.5 py-1 rounded-lg border border-brand-cyan/40">
              <Edit3 className="w-3.5 h-3.5 text-brand-cyan" />
              <input
                type="text"
                placeholder="Type Source Lang (e.g. Ruby, Scala, R)"
                value={customSource}
                onChange={(e) => setCustomSource(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none placeholder-gray-500 w-48 font-mono"
              />
            </div>
          )}

          <div className="p-1 rounded-full bg-dark-800 border border-gray-700/50">
            <ArrowRight className="w-4 h-4 text-brand-accent" />
          </div>

          <div className="flex items-center space-x-2 bg-dark-900/90 px-3 py-1.5 rounded-lg border border-gray-800">
            <span className="text-xs text-gray-400 font-mono">Target:</span>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-transparent text-xs font-semibold text-brand-accent focus:outline-none cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id} className="bg-dark-800 text-white">
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {targetLang === 'custom' && (
            <div className="flex items-center space-x-1.5 bg-dark-900/90 px-2.5 py-1 rounded-lg border border-brand-accent/40">
              <Edit3 className="w-3.5 h-3.5 text-brand-accent" />
              <input
                type="text"
                placeholder="Type Target Lang (e.g. Kotlin, Elixir, Dart)"
                value={customTarget}
                onChange={(e) => setCustomTarget(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none placeholder-gray-500 w-48 font-mono"
              />
            </div>
          )}
        </div>

        {/* Translation Options Checkboxes */}
        <div className="flex items-center space-x-4 text-xs font-medium text-gray-300">
          <label className="flex items-center space-x-1.5 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={preserveComments}
              onChange={(e) => setPreserveComments(e.target.checked)}
              className="rounded bg-dark-900 border-gray-700 text-brand-600 focus:ring-0 cursor-pointer"
            />
            <span>Preserve Comments</span>
          </label>

          <label className="flex items-center space-x-1.5 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={includeTests}
              onChange={(e) => setIncludeTests(e.target.checked)}
              className="rounded bg-dark-900 border-gray-700 text-brand-600 focus:ring-0 cursor-pointer"
            />
            <span>Include Unit Tests</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onAnalyze}
            disabled={isLoading || !sourceCode}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-gray-200 bg-dark-800 hover:bg-gray-800 border border-gray-700/80 rounded-lg transition disabled:opacity-50"
          >
            <Cpu className="w-3.5 h-3.5 text-brand-cyan" />
            <span>Analyze Complexity</span>
          </button>

          <button
            onClick={onOptimize}
            disabled={isLoading || !sourceCode}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-gray-200 bg-dark-800 hover:bg-gray-800 border border-gray-700/80 rounded-lg transition disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span>Optimize</span>
          </button>

          <button
            onClick={onTranslate}
            disabled={isLoading || !sourceCode}
            className="glow-button flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-bold text-white shadow-lg transition disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Translating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Translate Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dual Pane Code Editors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0">
        {/* Left Pane: Source Code Editor */}
        <div className="glass-panel rounded-xl flex flex-col overflow-hidden border border-gray-800">
          <div className="px-4 py-2.5 bg-dark-800/80 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-brand-cyan" />
              <span className="text-xs font-semibold text-gray-200 uppercase tracking-wider font-mono">
                Source Code ({effectiveSourceLang})
              </span>
              {astData && astData.parsedSuccessfully && (
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30">
                  {astData.functions?.length || 0} Fn | {astData.classes?.length || 0} Class | {astData.astNodeCount || 0} AST Nodes
                </span>
              )}
            </div>
            <button
              onClick={() => copyToClipboard(sourceCode, true)}
              className="flex items-center space-x-1 px-2 py-1 text-[11px] text-gray-400 hover:text-white rounded hover:bg-gray-700/50 transition"
            >
              {copiedSource ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSource ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="flex-1 relative">
            <Editor
              height="100%"
              language={sourceMonaco}
              theme="vs-dark"
              value={sourceCode}
              loading={<div className="flex items-center justify-center h-full text-xs text-gray-400 font-mono">Loading Code Editor...</div>}
              onChange={(val) => setSourceCode(val || '')}
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

        {/* Right Pane: Translation Output / Test Stubs Editor */}
        <div className="glass-panel rounded-xl flex flex-col overflow-hidden border border-gray-800">
          <div className="px-4 py-2.5 bg-dark-800/80 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setActiveOutputTab('code')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold font-mono transition ${
                    activeOutputTab === 'code'
                      ? 'bg-brand-600 text-white shadow'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Output ({effectiveTargetLang})</span>
                </button>

                {testStubs && (
                  <button
                    onClick={() => setActiveOutputTab('tests')}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold font-mono transition ${
                      activeOutputTab === 'tests'
                        ? 'bg-brand-accent text-white shadow'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Unit Test Stubs</span>
                  </button>
                )}

                {modelUsed && (
                  <span
                    className={`hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-mono rounded border ${
                      isFallback
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>
                      {modelUsed} {latencyMs ? `(${latencyMs}ms)` : ''}
                    </span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() =>
                  copyToClipboard(activeOutputTab === 'code' ? translatedCode : testStubs, false)
                }
                disabled={!translatedCode}
                className="flex items-center space-x-1 px-2 py-1 text-[11px] text-gray-400 hover:text-white rounded hover:bg-gray-700/50 transition disabled:opacity-40"
              >
                {copiedTarget ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedTarget ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={() =>
                  downloadFile(activeOutputTab === 'code' ? translatedCode : testStubs, effectiveTargetLang)
                }
                disabled={!translatedCode}
                className="flex items-center space-x-1 px-2 py-1 text-[11px] text-gray-400 hover:text-white rounded hover:bg-gray-700/50 transition disabled:opacity-40"
              >
                <Download className="w-3 h-3" />
                <span>Download</span>
              </button>
            </div>
          </div>

          <div className="flex-1 relative flex flex-col">
            {isFallback && translatedCode && (
              <div className="px-3 py-1.5 bg-amber-950/40 border-b border-amber-500/30 flex items-center justify-between text-xs text-amber-200 z-10">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-[11px]">
                    Generated via <strong>Offline Fallback</strong>. For 100% full Gemini AI translation, configure an API key.
                  </span>
                </div>
                {openAISettings && (
                  <button
                    onClick={openAISettings}
                    className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded text-amber-300 transition shrink-0 ml-2"
                  >
                    Configure Key
                  </button>
                )}
              </div>
            )}

            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-900/80 backdrop-blur-sm z-10">
                <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm font-semibold text-gray-200">Executing AST Engine & LLM Pipeline...</p>
                <p className="text-xs text-gray-400 mt-1">Preserving business logic & structural definitions</p>
              </div>
            ) : null}

            <Editor
              height="100%"
              language={targetMonaco}
              theme="vs-dark"
              value={activeOutputTab === 'code' ? translatedCode : testStubs}
              loading={<div className="flex items-center justify-center h-full text-xs text-gray-400 font-mono">Loading Output Editor...</div>}
              options={{
                readOnly: true,
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
      </div>
    </div>
  );
}

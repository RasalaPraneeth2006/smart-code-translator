import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import {
  X,
  Zap,
  Cpu,
  CheckCircle2,
  Copy,
  Check,
  Wand2,
  ArrowRight,
  Sparkles,
  Gauge
} from 'lucide-react';

export default function OptimizeModal({
  isOpen,
  onClose,
  data,
  isLoading,
  language,
  onApplyOptimization,
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const monacoLang = (language || 'javascript').toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/85 backdrop-blur-md transition-all animate-fade-in">
      <div className="glass-panel w-full max-w-4xl rounded-2xl border border-gray-700/80 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-dark-800/95 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-brand-600/20 to-brand-accent/20 text-brand-accent border border-brand-accent/30 shadow-lg shadow-brand-500/10">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-gray-100">
                  AI Code Refactoring & Complexity Optimizer
                </h3>
                <span className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded bg-brand-500/20 text-brand-accent border border-brand-500/30 uppercase">
                  {language}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Algorithmic improvements, modern idioms, and asymptotic complexity analysis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="relative">
                <div className="w-14 h-14 border-4 border-brand-500/30 border-t-brand-accent rounded-full animate-spin" />
                <Zap className="w-6 h-6 text-brand-accent absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="text-center">
                <h4 className="text-sm font-semibold text-gray-200">
                  Synthesizing Optimized Code Architecture...
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  Analyzing memory bounds, asymptotic runtime, and language idioms
                </p>
              </div>
            </div>
          ) : data ? (
            <>
              {/* Complexity Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-dark-800/80 border border-gray-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">
                      Time Complexity
                    </span>
                    <h4 className="text-2xl font-extrabold text-brand-cyan font-mono mt-1">
                      {data.timeComplexity || 'O(N)'}
                    </h4>
                  </div>
                  <div className="p-3 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20">
                    <Cpu className="w-7 h-7 text-brand-cyan" />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-dark-800/80 border border-gray-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">
                      Space Complexity
                    </span>
                    <h4 className="text-2xl font-extrabold text-brand-accent font-mono mt-1">
                      {data.spaceComplexity || 'O(1)'}
                    </h4>
                  </div>
                  <div className="p-3 rounded-xl bg-brand-accent/10 border border-brand-accent/20">
                    <Gauge className="w-7 h-7 text-brand-accent" />
                  </div>
                </div>
              </div>

              {/* Improvements List */}
              {Array.isArray(data.improvements) && data.improvements.length > 0 && (
                <div className="rounded-xl p-4 bg-dark-800/70 border border-gray-800 space-y-3">
                  <div className="flex items-center space-x-2 text-brand-cyan">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider font-mono">
                      Refactoring & Optimization Summary ({data.improvements.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {data.improvements.map((imp, idx) => (
                      <div key={idx} className="flex items-start space-x-2.5 text-xs text-gray-300">
                        <CheckCircle2 className="w-4 h-4 text-brand-cyan mt-0.5 flex-shrink-0" />
                        <span className="leading-relaxed">{imp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Optimized Code Monaco Display */}
              {data.optimizedCode && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                      Refactored Source Code
                    </span>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCopy(data.optimizedCode)}
                        className="flex items-center space-x-1 px-2.5 py-1 text-xs text-gray-400 hover:text-white rounded bg-dark-800 hover:bg-gray-700/50 border border-gray-700/60 transition"
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>

                      {onApplyOptimization && (
                        <button
                          onClick={() => onApplyOptimization(data.optimizedCode)}
                          className="flex items-center space-x-1.5 px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-brand-accent hover:from-brand-500 hover:to-brand-accent/90 rounded-lg shadow-md shadow-brand-500/20 transition cursor-pointer"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          <span>Apply to Editor</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="h-64 rounded-xl overflow-hidden border border-gray-800 bg-dark-900 shadow-inner">
                    <Editor
                      height="100%"
                      language={monacoLang}
                      theme="vs-dark"
                      value={data.optimizedCode}
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
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-400 text-xs">
              No optimization data available.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-dark-800/90 border-t border-gray-800 flex items-center justify-between">
          <span className="text-[11px] text-gray-500 font-mono">
            Optimized via Gemini AI Asymptotic Reasoning
          </span>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition"
            >
              Close
            </button>

            {data?.optimizedCode && onApplyOptimization && (
              <button
                onClick={() => onApplyOptimization(data.optimizedCode)}
                className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-brand-accent hover:from-brand-500 hover:to-brand-accent/90 rounded-lg shadow-md shadow-brand-500/20 transition"
              >
                <span>Apply to Editor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

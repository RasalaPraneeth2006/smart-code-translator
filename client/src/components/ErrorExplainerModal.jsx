import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import {
  X,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Copy,
  Check,
  AlertOctagon,
  SearchCode,
  FileCode2,
  Wand2
} from 'lucide-react';

export default function ErrorExplainerModal({
  isOpen,
  onClose,
  data,
  isLoading,
  language,
  onApplyFix,
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
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10">
              <Lightbulb className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-gray-100">
                  AI Guided Error Explainer & Debugger
                </h3>
                <span className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  {language}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Context-aware root cause analysis and verified code fix
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
                <div className="w-14 h-14 border-4 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
                <Sparkles className="w-6 h-6 text-amber-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="text-center">
                <h4 className="text-sm font-semibold text-gray-200">
                  Analyzing Runtime Stack Trace...
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  Gemini LLM is decoding root causes and synthesizing an idiomatic fix
                </p>
              </div>
            </div>
          ) : data ? (
            <>
              {/* 1. Core Plain-English Diagnosis */}
              <div className="rounded-xl p-4 bg-gradient-to-r from-amber-950/30 via-dark-800/80 to-dark-800/80 border border-amber-500/30 space-y-2">
                <div className="flex items-center space-x-2 text-amber-400">
                  <AlertOctagon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider font-mono">
                    Core Diagnosis (Plain English)
                  </span>
                </div>
                <p className="text-sm text-gray-200 leading-relaxed font-sans">
                  {data.plainEnglishExplanation || 'Execution halted due to an unhandled condition.'}
                </p>
              </div>

              {/* 2. Root Cause Analysis */}
              <div className="rounded-xl p-4 bg-dark-800/70 border border-gray-800 space-y-2">
                <div className="flex items-center space-x-2 text-brand-cyan">
                  <SearchCode className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider font-mono">
                    Root Cause Analysis
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-sans">
                  {data.rootCause || 'Underlying runtime exception during code execution.'}
                </p>
              </div>

              {/* 3. Step-by-Step Fix */}
              {Array.isArray(data.stepByStepFix) && data.stepByStepFix.length > 0 && (
                <div className="rounded-xl p-4 bg-dark-800/70 border border-gray-800 space-y-3">
                  <div className="flex items-center space-x-2 text-green-400">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider font-mono">
                      Step-by-Step Resolution Guide
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {data.stepByStepFix.map((step, idx) => (
                      <div key={idx} className="flex items-start space-x-3 text-xs text-gray-300">
                        <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 flex items-center justify-center font-mono font-bold text-[10px] flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Corrected Code Snippet */}
              {data.suggestedCodeFix && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-brand-accent">
                      <FileCode2 className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wider font-mono">
                        Proposed Corrected Code
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCopy(data.suggestedCodeFix)}
                        className="flex items-center space-x-1 px-2.5 py-1 text-xs text-gray-400 hover:text-white rounded bg-dark-800 hover:bg-gray-700/50 border border-gray-700/60 transition"
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>

                      {onApplyFix && (
                        <button
                          onClick={() => onApplyFix(data.suggestedCodeFix)}
                          className="flex items-center space-x-1.5 px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg shadow-md shadow-green-600/30 transition cursor-pointer"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          <span>Apply Fix to Editor</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="h-64 rounded-xl overflow-hidden border border-gray-800 bg-dark-900 shadow-inner">
                    <Editor
                      height="100%"
                      language={monacoLang}
                      theme="vs-dark"
                      value={data.suggestedCodeFix}
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
              No diagnostic data available. Please rerun your code and trigger Explain Error again.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-dark-800/90 border-t border-gray-800 flex items-center justify-between">
          <span className="text-[11px] text-gray-500 font-mono">
            Powered by Gemini LLM & Dynamic AST Context
          </span>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition"
            >
              Close
            </button>

            {data?.suggestedCodeFix && onApplyFix && (
              <button
                onClick={() => onApplyFix(data.suggestedCodeFix)}
                className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-brand-accent hover:from-brand-500 hover:to-brand-accent/90 rounded-lg shadow-md shadow-brand-500/20 transition"
              >
                <span>Apply Fix to Editor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

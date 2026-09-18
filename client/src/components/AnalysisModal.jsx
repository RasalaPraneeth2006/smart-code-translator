import React from 'react';
import { X, Cpu, Zap, CheckCircle2, AlertTriangle, ShieldAlert, Code2 } from 'lucide-react';
import Editor from '@monaco-editor/react';

export default function AnalysisModal({ isOpen, onClose, data, type, language }) {
  if (!isOpen || !data) return null;

  const isAnalysis = type === 'analysis';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-3xl rounded-2xl border border-gray-700/80 overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-dark-800/90 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isAnalysis ? (
              <div className="p-2 rounded-lg bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30">
                <Cpu className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                <Zap className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-gray-100">
                {isAnalysis ? 'Algorithmic Complexity & Health Analysis' : 'Automated Code Optimization Engine'}
              </h3>
              <p className="text-xs text-gray-400 font-mono">Language Target: {language}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {isAnalysis ? (
            <>
              {/* Complexity Metrics Badges */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-dark-800/80 border border-gray-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400 font-mono uppercase">Time Complexity</span>
                    <h4 className="text-xl font-extrabold text-brand-cyan font-mono mt-1">
                      {data.timeComplexity || 'O(N)'}
                    </h4>
                  </div>
                  <Cpu className="w-8 h-8 text-brand-cyan/40" />
                </div>

                <div className="p-4 rounded-xl bg-dark-800/80 border border-gray-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400 font-mono uppercase">Space Complexity</span>
                    <h4 className="text-xl font-extrabold text-brand-accent font-mono mt-1">
                      {data.spaceComplexity || 'O(1)'}
                    </h4>
                  </div>
                  <Zap className="w-8 h-8 text-brand-accent/40" />
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                  Algorithmic Explanation
                </h4>
                <div className="p-4 rounded-xl bg-dark-800/50 border border-gray-800/80 text-sm text-gray-300 leading-relaxed">
                  {data.explanation}
                </div>
              </div>

              {/* Detected Health & Security Issues */}
              {data.issues && data.issues.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                    Detected Health & Optimization Insights ({data.issues.length})
                  </h4>
                  <div className="space-y-2">
                    {data.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-dark-800/70 border border-gray-800 flex items-start space-x-3"
                      >
                        {issue.severity === 'high' ? (
                          <ShieldAlert className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                        )}
                        <div>
                          <h5 className="text-xs font-bold text-gray-200">{issue.title}</h5>
                          <p className="text-xs text-gray-400 mt-1">{issue.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Improvements List */}
              {data.improvements && data.improvements.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                    Refactoring & Performance Improvements
                  </h4>
                  <ul className="space-y-2">
                    {data.improvements.map((imp, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-xs text-gray-300">
                        <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Optimized Code Monaco Display */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                  Optimized Source Code
                </h4>
                <div className="h-64 rounded-xl overflow-hidden border border-gray-800">
                  <Editor
                    height="100%"
                    language={language.toLowerCase()}
                    theme="vs-dark"
                    value={data.optimizedCode}
                    options={{
                      readOnly: true,
                      fontSize: 13,
                      fontFamily: 'JetBrains Mono',
                      minimap: { enabled: false },
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

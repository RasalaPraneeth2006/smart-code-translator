import React from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { GitCompare, Code2, ArrowRight } from 'lucide-react';

export default function DiffViewerPane({
  originalCode,
  modifiedCode,
  sourceLang,
  targetLang,
}) {
  return (
    <div className="flex flex-col h-[calc(100vh-4.2rem)] p-3 space-y-3">
      {/* Header bar */}
      <div className="glass-panel rounded-xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <GitCompare className="w-5 h-5 text-brand-accent animate-pulse" />
          <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider font-mono">
            Side-by-Side Code Diff Viewer
          </h2>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="px-2.5 py-1 rounded bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30">
            Original ({sourceLang})
          </span>
          <ArrowRight className="w-4 h-4 text-gray-500" />
          <span className="px-2.5 py-1 rounded bg-brand-accent/20 text-brand-accent border border-brand-accent/30">
            Translated ({targetLang})
          </span>
        </div>
      </div>

      {/* Diff Editor */}
      <div className="glass-panel rounded-xl flex-1 overflow-hidden border border-gray-800 p-1">
        {originalCode && modifiedCode ? (
          <DiffEditor
            height="100%"
            original={originalCode}
            modified={modifiedCode}
            language={targetLang.toLowerCase()}
            theme="vs-dark"
            options={{
              readOnly: true,
              renderSideBySide: true,
              fontSize: 13,
              fontFamily: 'JetBrains Mono',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400">
            <Code2 className="w-12 h-12 text-gray-600 mb-3" />
            <p className="text-sm font-semibold">No diff comparison available yet</p>
            <p className="text-xs text-gray-500 mt-1">
              Translate your code in the Dual-Pane IDE to view side-by-side diff comparison here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

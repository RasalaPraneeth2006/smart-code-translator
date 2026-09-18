import React from 'react';
import { X, History, ArrowRight, Clock, Cpu, Code2, RefreshCw } from 'lucide-react';

export default function HistoryDrawer({ isOpen, onClose, historyList, onSelectHistory, onRefresh }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-dark-900/60 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
        <div className="w-screen max-w-md glass-panel border-l border-gray-800 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-4 bg-dark-800/90 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-brand-accent" />
              <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider font-mono">
                Translation History
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onRefresh}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition"
                title="Refresh History"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* History Item List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {historyList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
                <Code2 className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-xs font-semibold">No translation history records found</p>
                <p className="text-[11px] text-gray-600 mt-1">Translations executed in the IDE will appear here.</p>
              </div>
            ) : (
              historyList.map((item, idx) => (
                <div
                  key={item._id || item.id || idx}
                  onClick={() => {
                    onSelectHistory(item);
                    onClose();
                  }}
                  className="p-3.5 rounded-xl bg-dark-800/60 hover:bg-dark-800 border border-gray-800/80 hover:border-brand-500/50 cursor-pointer transition group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 text-xs font-mono font-bold">
                      <span className="text-brand-cyan">{item.sourceLang}</span>
                      <ArrowRight className="w-3 h-3 text-gray-500 group-hover:text-brand-accent transition" />
                      <span className="text-brand-accent">{item.targetLang}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  </div>

                  <p className="text-xs font-mono text-gray-400 line-clamp-2 bg-dark-900/60 p-2 rounded border border-gray-800/60">
                    {item.sourceCode}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                    <span className="flex items-center space-x-1">
                      <Cpu className="w-3 h-3 text-brand-cyan" />
                      <span>{item.metrics?.latencyMs || 120}ms</span>
                    </span>
                    <span>{item.metrics?.astNodesParsed || 14} AST Nodes</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

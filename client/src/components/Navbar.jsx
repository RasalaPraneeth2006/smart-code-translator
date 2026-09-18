import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Code2, GitCompare, History, Terminal, User, LogOut, Sparkles, Layers, FolderTree, Zap } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, toggleHistory }) {
  const { user, logout, setIsAuthModalOpen } = useAuth();

  return (
    <nav className="glass-nav sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
      {/* Brand Header */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-accent to-brand-cyan p-0.5 flex items-center justify-center shadow-lg shadow-brand-500/20">
          <div className="w-full h-full bg-dark-900 rounded-[10px] flex items-center justify-center">
            <Code2 className="w-5 h-5 text-brand-accent animate-pulse" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-gray-200 to-brand-accent bg-clip-text text-transparent">
              Smart Code Translator
            </h1>
          </div>
          <p className="text-xs text-gray-400 font-mono hidden sm:block">
            Polyglot AST & AI Code Translation Engine
          </p>
        </div>
      </div>

      {/* Center Tab Navigation */}
      <div className="flex items-center bg-dark-800/80 p-1 rounded-xl border border-gray-800">
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'editor'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span className="hidden md:inline">Dual-Pane IDE</span>
        </button>

        <button
          onClick={() => setActiveTab('batch')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'batch'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span className="hidden md:inline">Folder Batch IDE</span>
        </button>

        <button
          onClick={() => setActiveTab('compiler')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'compiler'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="hidden md:inline">Online Compiler</span>
          <span className="px-1.5 py-0.2 text-[9px] font-bold font-mono uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">NEW</span>
        </button>

        <button
          onClick={() => setActiveTab('diff')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'diff'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          }`}
        >
          <GitCompare className="w-4 h-4" />
          <span className="hidden md:inline">Diff Viewer</span>
        </button>

        <button
          onClick={() => setActiveTab('cli')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'cli'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span className="hidden md:inline">CLI Guide</span>
        </button>
      </div>

      {/* Action Buttons & Auth */}
      <div className="flex items-center space-x-3">
        <button
          onClick={toggleHistory}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 bg-dark-800 hover:bg-gray-800 border border-gray-700/60 rounded-lg transition"
          title="View Translation History"
        >
          <History className="w-4 h-4 text-brand-accent" />
          <span className="hidden sm:inline">History</span>
        </button>

        {user ? (
          <div className="flex items-center space-x-2 bg-dark-800/90 pl-3 pr-2 py-1.5 rounded-xl border border-gray-700/60 text-xs">
            <span className="font-medium text-gray-200">{user.name}</span>
            <button
              onClick={logout}
              className="p-1 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-700/50 transition"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-accent hover:from-brand-500 hover:to-brand-accent/90 rounded-lg shadow-md shadow-brand-500/20 transition"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </nav>
  );
}

import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import {
  FolderTree,
  FolderUp,
  FileCode,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Download,
  Copy,
  Check,
  ArrowRight,
  RefreshCw,
  GitCompare,
  FileText,
  Layers,
  Zap,
  Pause,
  Play,
  Square,
  RotateCcw,
  Edit3
} from 'lucide-react';
import { codeService } from '../services/api';
import { SUPPORTED_LANGUAGES } from './EditorPane';

const SAMPLE_JAVA_PROJECT = [
  {
    path: 'model/UserNode.java',
    name: 'UserNode.java',
    lang: 'java',
    code: `package model;

public class UserNode {
    private int id;
    private String name;
    private double balance;

    public UserNode(int id, String name, double balance) {
        this.id = id;
        this.name = name;
        this.balance = balance;
    }

    public int getId() { return id; }
    public String getName() { return name; }
    public double getBalance() { return balance; }

    public void deposit(double amount) {
        if (amount > 0) {
            this.balance += amount;
        }
    }
}`
  },
  {
    path: 'service/AccountManager.java',
    name: 'AccountManager.java',
    lang: 'java',
    code: `package service;

import model.UserNode;
import java.util.ArrayList;
import java.util.List;

public class AccountManager {
    private List<UserNode> accounts = new ArrayList<>();

    public void addAccount(UserNode user) {
        accounts.add(user);
    }

    public UserNode findById(int id) {
        for (UserNode node : accounts) {
            if (node.getId() == id) {
                return node;
            }
        }
        return null;
    }

    public double getTotalCapital() {
        double total = 0;
        for (UserNode node : accounts) {
            total += node.getBalance();
        }
        return total;
    }
}`
  },
  {
    path: 'Main.java',
    name: 'Main.java',
    lang: 'java',
    code: `public class Main {
    public static void main(String[] args) {
        System.out.println("Initializing Enterprise Smart Account Engine...");
    }
}`
  }
];

const SAMPLE_PYTHON_PROJECT = [
  {
    path: 'utils/helpers.py',
    name: 'helpers.py',
    lang: 'python',
    code: `def format_currency(amount: float, symbol: str = "$") -> str:
    return f"{symbol}{amount:,.2f}"

def validate_email(email: str) -> bool:
    import re
    pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    return bool(re.match(pattern, email))`
  },
  {
    path: 'processor/data_pipeline.py',
    name: 'data_pipeline.py',
    lang: 'python',
    code: `class DataPipeline:
    def __init__(self, name: str):
        self.name = name
        self.items = []

    def ingest(self, item):
        self.items.append(item)

    def process_all():
        results = [x * 2 for x in self.items]
        return results`
  }
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function BatchFolderPane({ preserveComments, includeTests }) {
  const [files, setFiles] = useState(SAMPLE_JAVA_PROJECT);
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [sourceLang, setSourceLang] = useState('java');
  const [targetLang, setTargetLang] = useState('typescript');
  const [customSource, setCustomSource] = useState('');
  const [customTarget, setCustomTarget] = useState('');
  
  // Translation state map: { [filePath]: { translatedCode, status: 'idle'|'pending'|'success'|'error', error?: string } }
  const [translations, setTranslations] = useState({});
  const [isBatchTranslating, setIsBatchTranslating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  const isPausedRef = useRef(false);
  const isCancelledRef = useRef(false);

  const activeFile = files[selectedFileIdx] || null;
  const activeTranslation = activeFile ? translations[activeFile.path] : null;

  const completedCount = Object.values(translations).filter(t => t?.status === 'success').length;
  const totalCount = files.length;
  const remainingCount = totalCount - completedCount;

  const effectiveSourceLang = sourceLang === 'custom' ? (customSource.trim() || 'Custom') : sourceLang;
  const effectiveTargetLang = targetLang === 'custom' ? (customTarget.trim() || 'Custom') : targetLang;

  // Handle Folder Upload from Browser
  const handleFolderUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    const parsedList = [];
    let pendingReads = uploadedFiles.length;

    uploadedFiles.forEach((file) => {
      if (file.name.startsWith('.') || file.webkitRelativePath.includes('node_modules') || file.webkitRelativePath.includes('dist')) {
        pendingReads--;
        if (pendingReads === 0 && parsedList.length > 0) {
          setFiles(parsedList);
          setSelectedFileIdx(0);
          setTranslations({});
          resetExecutionState();
        }
        return;
      }

      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target.result;
        parsedList.push({
          path: file.webkitRelativePath || file.name,
          name: file.name,
          lang: detectLanguage(file.name),
          code: text,
        });
        pendingReads--;
        if (pendingReads === 0 && parsedList.length > 0) {
          setFiles(parsedList);
          setSelectedFileIdx(0);
          setTranslations({});
          resetExecutionState();
        }
      };
      reader.readAsText(file);
    });
  };

  const resetExecutionState = () => {
    isPausedRef.current = false;
    isCancelledRef.current = false;
    setIsPaused(false);
    setIsBatchTranslating(false);
    setBatchProgress(0);
  };

  const detectLanguage = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
      case 'py': return 'python';
      case 'js': case 'jsx': case 'mjs': case 'cjs': return 'javascript';
      case 'ts': case 'tsx': return 'typescript';
      case 'java': return 'java';
      case 'cpp': case 'cc': case 'cxx': case 'hpp': case 'h': return 'cpp';
      case 'cs': return 'csharp';
      case 'c': return 'c';
      case 'go': return 'go';
      case 'rs': return 'rust';
      case 'sql': return 'sql';
      case 'php': return 'php';
      case 'swift': return 'swift';
      case 'kt': case 'kts': return 'kotlin';
      default: return ext;
    }
  };

  const handleBatchTranslate = async () => {
    if (!files || files.length === 0) return;

    isPausedRef.current = false;
    isCancelledRef.current = false;
    setIsPaused(false);
    setIsBatchTranslating(true);

    const currentMap = { ...translations };

    for (let i = 0; i < files.length; i++) {
      const f = files[i];

      if (isCancelledRef.current) break;

      while (isPausedRef.current && !isCancelledRef.current) {
        await sleep(200);
      }

      if (isCancelledRef.current) break;

      if (currentMap[f.path]?.status === 'success') {
        continue;
      }

      currentMap[f.path] = { status: 'pending', translatedCode: '' };
      setTranslations({ ...currentMap });

      try {
        const res = await codeService.translate({
          code: f.code,
          sourceLang: effectiveSourceLang,
          targetLang: effectiveTargetLang,
          options: { preserveComments, includeTests }
        });

        if (res.data && res.data.success) {
          currentMap[f.path] = {
            status: 'success',
            translatedCode: res.data.data.translatedCode,
            testStubs: res.data.data.testStubs,
          };
        } else {
          currentMap[f.path] = {
            status: 'error',
            error: 'Translation failed',
            translatedCode: ''
          };
        }
      } catch (err) {
        currentMap[f.path] = {
          status: 'error',
          error: err.response?.data?.error || err.message,
          translatedCode: ''
        };
      }

      setTranslations({ ...currentMap });

      const done = Object.values(currentMap).filter(t => t?.status === 'success').length;
      setBatchProgress(Math.round((done / totalCount) * 100));
    }

    setIsBatchTranslating(false);
    setIsPaused(false);
    isPausedRef.current = false;
    isCancelledRef.current = false;
  };

  const handlePause = () => {
    isPausedRef.current = true;
    setIsPaused(true);
  };

  const handleUnpause = () => {
    isPausedRef.current = false;
    setIsPaused(false);
  };

  const handleStop = () => {
    isCancelledRef.current = true;
    isPausedRef.current = false;
    setIsPaused(false);
    setIsBatchTranslating(false);
  };

  const handleRestartAll = () => {
    handleStop();
    setTranslations({});
    setBatchProgress(0);
  };

  const downloadAllOutputs = () => {
    const extMap = {
      python: 'py', javascript: 'js', typescript: 'ts', java: 'java',
      cpp: 'cpp', csharp: 'cs', c: 'c', go: 'go', rust: 'rs',
      sql: 'sql', php: 'php', swift: 'swift', kotlin: 'kt'
    };
    const targetExt = extMap[effectiveTargetLang.toLowerCase()] || 'txt';

    files.forEach((f) => {
      const trans = translations[f.path];
      if (trans && trans.translatedCode) {
        const baseName = f.name.substring(0, f.name.lastIndexOf('.')) || f.name;
        const outName = `${baseName}_translated.${targetExt}`;
        const blob = new Blob([trans.translatedCode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = outName;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  const copyTranslatedCode = () => {
    if (!activeTranslation?.translatedCode) return;
    navigator.clipboard.writeText(activeTranslation.translatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.2rem)] p-3 space-y-3">
      {/* Top Action & Settings Toolbar */}
      <div className="glass-panel rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 border border-gray-800">
        <div className="flex items-center space-x-3">
          {/* Folder Import Button */}
          <label className="flex items-center space-x-2 px-3.5 py-1.5 bg-brand-600/20 hover:bg-brand-600/30 text-brand-cyan border border-brand-500/40 rounded-lg text-xs font-semibold cursor-pointer transition">
            <FolderUp className="w-4 h-4" />
            <span>Select Folder / Directory</span>
            <input
              type="file"
              webkitdirectory=""
              directory=""
              multiple
              onChange={handleFolderUpload}
              className="hidden"
            />
          </label>

          {/* Preset Sample Projects Dropdown */}
          <div className="flex items-center space-x-2 bg-dark-900/90 px-3 py-1.5 rounded-lg border border-gray-800">
            <span className="text-xs text-gray-400 font-mono">Sample Projects:</span>
            <button
              onClick={() => {
                setFiles(SAMPLE_JAVA_PROJECT);
                setSourceLang('java');
                setSelectedFileIdx(0);
                setTranslations({});
                resetExecutionState();
              }}
              className={`px-2 py-0.5 text-xs font-medium rounded ${
                sourceLang === 'java' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Java Package
            </button>
            <button
              onClick={() => {
                setFiles(SAMPLE_PYTHON_PROJECT);
                setSourceLang('python');
                setSelectedFileIdx(0);
                setTranslations({});
                resetExecutionState();
              }}
              className={`px-2 py-0.5 text-xs font-medium rounded ${
                sourceLang === 'python' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Python Package
            </button>
          </div>
        </div>

        {/* Language Conversion Selectors */}
        <div className="flex items-center space-x-3 flex-wrap">
          <div className="flex items-center space-x-2 bg-dark-900/90 px-3 py-1.5 rounded-lg border border-gray-800">
            <span className="text-xs text-gray-400 font-mono">Source:</span>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
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
            <input
              type="text"
              placeholder="Source (e.g. Ruby)"
              value={customSource}
              onChange={(e) => setCustomSource(e.target.value)}
              className="bg-dark-900 text-xs font-mono font-semibold text-white px-2.5 py-1.5 rounded-lg border border-brand-cyan/40 focus:outline-none w-36"
            />
          )}

          <ArrowRight className="w-4 h-4 text-brand-accent" />

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
            <input
              type="text"
              placeholder="Target (e.g. Kotlin)"
              value={customTarget}
              onChange={(e) => setCustomTarget(e.target.value)}
              className="bg-dark-900 text-xs font-mono font-semibold text-white px-2.5 py-1.5 rounded-lg border border-brand-accent/40 focus:outline-none w-36"
            />
          )}

          {/* Flexible Translation Controls: Start / Stop at any time / Resume at any time */}
          <div className="flex items-center space-x-2">
            {!isBatchTranslating ? (
              <>
                {completedCount === 0 ? (
                  <button
                    onClick={handleBatchTranslate}
                    disabled={!files || files.length === 0}
                    className="glow-button flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-bold text-white shadow-lg transition disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Batch Translate Folder ({files.length} Files)</span>
                  </button>
                ) : completedCount < totalCount ? (
                  <button
                    onClick={handleBatchTranslate}
                    className="flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Resume Translation ({remainingCount} Remaining)</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span>All {totalCount} Files Translated</span>
                    </span>
                    <button
                      onClick={handleRestartAll}
                      className="p-1.5 text-gray-400 hover:text-white bg-dark-800 border border-gray-700 rounded-lg transition"
                      title="Re-translate all files from scratch"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Active Batch Execution Controls */}
                {isPaused ? (
                  <button
                    onClick={handleUnpause}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow transition animate-pulse"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Resume ({completedCount}/{totalCount})</span>
                  </button>
                ) : (
                  <button
                    onClick={handlePause}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold text-gray-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow transition"
                  >
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause ({completedCount}/{totalCount})</span>
                  </button>
                )}

                <button
                  onClick={handleStop}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow transition"
                  title="Stop translation process at current file"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop</span>
                </button>
              </>
            )}

            {completedCount > 0 && !isBatchTranslating && (
              <button
                onClick={handleRestartAll}
                className="flex items-center space-x-1 px-2.5 py-1.5 text-xs text-gray-400 hover:text-white bg-dark-800 border border-gray-700/80 rounded-lg transition"
                title="Reset translation state"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

            <button
              onClick={downloadAllOutputs}
              disabled={completedCount === 0}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-gray-200 bg-dark-800 hover:bg-gray-800 border border-gray-700/80 rounded-lg transition disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5 text-green-400" />
              <span>Download All ({completedCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        {/* Left Sidebar: Interactive Folder File Tree (3 cols) */}
        <div className="lg:col-span-3 glass-panel rounded-xl flex flex-col border border-gray-800 overflow-hidden">
          <div className="px-3.5 py-2.5 bg-dark-800/80 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FolderTree className="w-4 h-4 text-brand-accent" />
              <span className="text-xs font-semibold text-gray-200 uppercase tracking-wider font-mono">
                Directory Tree ({completedCount}/{totalCount})
              </span>
            </div>
            {isPaused && (
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                Paused
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {files.map((file, idx) => {
              const trans = translations[file.path];
              const isSelected = idx === selectedFileIdx;

              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFileIdx(idx)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition ${
                    isSelected
                      ? 'bg-brand-600/30 text-white border border-brand-500/40 shadow-sm'
                      : 'text-gray-300 hover:bg-dark-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <FileCode className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-brand-cyan' : 'text-gray-400'}`} />
                    <span className="truncate font-mono">{file.path}</span>
                  </div>

                  <div className="flex items-center space-x-1.5 ml-2 flex-shrink-0">
                    {trans?.status === 'pending' && (
                      <div className="w-3 h-3 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
                    )}
                    {trans?.status === 'success' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    )}
                    {trans?.status === 'error' && (
                      <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Inspector: Dual-Pane Code View for Selected File (9 cols) */}
        <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-0">
          {/* Source File View */}
          <div className="glass-panel rounded-xl flex flex-col overflow-hidden border border-gray-800">
            <div className="px-4 py-2.5 bg-dark-800/80 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-brand-cyan" />
                <span className="text-xs font-semibold text-gray-200 uppercase tracking-wider font-mono truncate">
                  Original: {activeFile ? activeFile.path : 'No file selected'}
                </span>
              </div>
            </div>

            <div className="flex-1 relative">
              <Editor
                height="100%"
                language={sourceLang}
                theme="vs-dark"
                value={activeFile ? activeFile.code : ''}
                options={{
                  readOnly: true,
                  fontSize: 12,
                  fontFamily: 'JetBrains Mono',
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 10 },
                }}
              />
            </div>
          </div>

          {/* Translated File View */}
          <div className="glass-panel rounded-xl flex flex-col overflow-hidden border border-gray-800">
            <div className="px-4 py-2.5 bg-dark-800/80 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-brand-accent" />
                <span className="text-xs font-semibold text-gray-200 uppercase tracking-wider font-mono truncate">
                  Translated Output ({effectiveTargetLang})
                </span>
              </div>

              {activeTranslation?.translatedCode && (
                <button
                  onClick={copyTranslatedCode}
                  className="flex items-center space-x-1 px-2 py-1 text-[11px] text-gray-400 hover:text-white rounded hover:bg-gray-700/50 transition"
                >
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            <div className="flex-1 relative">
              {activeTranslation?.status === 'pending' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-900/80 backdrop-blur-sm z-10">
                  <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mb-2" />
                  <p className="text-xs font-medium text-gray-300">Translating {activeFile?.name}...</p>
                </div>
              )}

              <Editor
                height="100%"
                language={targetLang}
                theme="vs-dark"
                value={activeTranslation ? activeTranslation.translatedCode : '// Click "Batch Translate Folder" above to generate output.'}
                options={{
                  readOnly: true,
                  fontSize: 12,
                  fontFamily: 'JetBrains Mono',
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 10 },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

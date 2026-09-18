import React, { useState } from 'react';
import { Terminal, Copy, Check, Sparkles, FolderTree, FileCode, CheckCircle2 } from 'lucide-react';

export default function CliGuidePane() {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const copyCmd = (cmd, index) => {
    navigator.clipboard.writeText(cmd);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const commands = [
    {
      title: '1. Single File Code Translation',
      description: 'Translate a single Python file into TypeScript with automated test stub generation:',
      cmd: 'npx smart-translate --source python --target typescript --input ./src/app.py --output ./dist/app.ts --test',
    },
    {
      title: '2. Directory Structure Batch Translation',
      description: 'Convert an entire codebase directory from JavaScript into Go:',
      cmd: 'npx smart-translate --source javascript --target go --input ./src --output ./dist/go_pkg',
    },
    {
      title: '3. Connecting to Custom Server API Backend',
      description: 'Point the CLI tool to your enterprise backend server deployment:',
      cmd: 'npx smart-translate -s java -t cpp -i ./Main.java -o ./Main.cpp --api http://localhost:5000/api',
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4.2rem)] p-4 overflow-y-auto space-y-4 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-gray-800 bg-gradient-to-r from-dark-800/90 via-dark-800/50 to-brand-600/10">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 rounded-xl bg-brand-500/20 text-brand-accent border border-brand-500/30">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-100">Terminal CLI Batch Translator</h2>
            <p className="text-xs text-gray-400 font-mono">
              Execute cross-language compilation directly from your CLI terminal or CI/CD pipelines
            </p>
          </div>
        </div>
      </div>

      {/* Commands List */}
      <div className="space-y-4">
        {commands.map((c, idx) => (
          <div key={idx} className="glass-panel rounded-xl p-5 border border-gray-800 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-gray-200">{c.title}</h3>
              <p className="text-xs text-gray-400 mt-1">{c.description}</p>
            </div>

            <div className="bg-dark-900 rounded-xl p-3 border border-gray-800 font-mono text-xs text-brand-cyan flex items-center justify-between overflow-x-auto">
              <span>$ {c.cmd}</span>
              <button
                onClick={() => copyCmd(c.cmd, idx)}
                className="ml-3 p-1.5 text-gray-400 hover:text-white rounded hover:bg-gray-800 transition flex-shrink-0"
              >
                {copiedIndex === idx ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

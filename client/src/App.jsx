import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import EditorPane from './components/EditorPane';
import BatchFolderPane from './components/BatchFolderPane';
import DiffViewerPane from './components/DiffViewerPane';
import CliGuidePane from './components/CliGuidePane';
import OnlineCompiler from './components/OnlineCompiler';
import AnalysisModal from './components/AnalysisModal';
import HistoryDrawer from './components/HistoryDrawer';
import AuthModal from './components/AuthModal';
import { codeService } from './services/api';

const DEFAULT_PYTHON_SAMPLE = `def calculate_factorial(n: int) -> int:
    """Calculates the factorial of a given number non-recursively."""
    if n < 0:
        raise ValueError("Factorial is not defined for negative numbers")
    result = 1
    for i in range(1, n + 1):
        result *= i
    return result

async def process_batch(items):
    import asyncio
    results = []
    for item in items:
        results.append(item * 2)
    return results`;

function MainApp() {
  const [activeTab, setActiveTab] = useState('editor');
  const [sourceLang, setSourceLang] = useState('python');
  const [targetLang, setTargetLang] = useState('typescript');
  const [sourceCode, setSourceCode] = useState(DEFAULT_PYTHON_SAMPLE);
  const [translatedCode, setTranslatedCode] = useState('');
  const [astData, setAstData] = useState(null);
  const [testStubs, setTestStubs] = useState('');
  const [preserveComments, setPreserveComments] = useState(true);
  const [includeTests, setIncludeTests] = useState(true);
  const [activeOutputTab, setActiveOutputTab] = useState('code');

  const [isLoading, setIsLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [analysisType, setAnalysisType] = useState('analysis');
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

  const [historyList, setHistoryList] = useState([]);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await codeService.getHistory();
      if (res.data && res.data.success) {
        setHistoryList(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to fetch history:', err.message);
    }
  };

  const handleTranslate = async () => {
    if (!sourceCode.trim()) return;
    setIsLoading(true);

    try {
      const res = await codeService.translate({
        code: sourceCode,
        sourceLang,
        targetLang,
        options: {
          preserveComments,
          includeTests,
        },
      });

      if (res.data && res.data.success) {
        const data = res.data.data;
        setTranslatedCode(data.translatedCode);
        setAstData(data.astData);
        setTestStubs(data.testStubs || '');
        if (data.testStubs) setActiveOutputTab('code');
        fetchHistory();
      }
    } catch (err) {
      alert(`Translation Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!sourceCode.trim()) return;
    setIsLoading(true);

    try {
      const res = await codeService.analyze({
        code: sourceCode,
        language: sourceLang,
      });

      if (res.data && res.data.success) {
        setAnalysisData(res.data.data);
        setAnalysisType('analysis');
        setIsAnalysisModalOpen(true);
      }
    } catch (err) {
      alert(`Analysis Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (!sourceCode.trim()) return;
    setIsLoading(true);

    try {
      const res = await codeService.optimize({
        code: sourceCode,
        language: sourceLang,
      });

      if (res.data && res.data.success) {
        setAnalysisData(res.data.data);
        setAnalysisType('optimization');
        setIsAnalysisModalOpen(true);
      }
    } catch (err) {
      alert(`Optimization Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistoryItem = (item) => {
    setSourceLang(item.sourceLang);
    setTargetLang(item.targetLang);
    setSourceCode(item.sourceCode);
    setTranslatedCode(item.translatedCode);
    setAstData(item.astData);
    setTestStubs(item.testStubs || '');
    setActiveTab('editor');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19]">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        toggleHistory={() => setIsHistoryDrawerOpen(true)}
      />

      <main className="flex-1">
        {activeTab === 'editor' && (
          <EditorPane
            sourceLang={sourceLang}
            setSourceLang={setSourceLang}
            targetLang={targetLang}
            setTargetLang={setTargetLang}
            sourceCode={sourceCode}
            setSourceCode={setSourceCode}
            translatedCode={translatedCode}
            setTranslatedCode={setTranslatedCode}
            astData={astData}
            testStubs={testStubs}
            onTranslate={handleTranslate}
            onAnalyze={handleAnalyze}
            onOptimize={handleOptimize}
            isLoading={isLoading}
            preserveComments={preserveComments}
            setPreserveComments={setPreserveComments}
            includeTests={includeTests}
            setIncludeTests={setIncludeTests}
            activeOutputTab={activeOutputTab}
            setActiveOutputTab={setActiveOutputTab}
          />
        )}

        {activeTab === 'batch' && (
          <BatchFolderPane
            preserveComments={preserveComments}
            includeTests={includeTests}
          />
        )}

        {activeTab === 'compiler' && <OnlineCompiler />}

        {activeTab === 'diff' && (
          <DiffViewerPane
            originalCode={sourceCode}
            modifiedCode={translatedCode}
            sourceLang={sourceLang}
            targetLang={targetLang}
          />
        )}

        {activeTab === 'cli' && <CliGuidePane />}
      </main>

      {/* Analysis & Optimization Modal */}
      <AnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        data={analysisData}
        type={analysisType}
        language={sourceLang}
      />

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        historyList={historyList}
        onSelectHistory={handleSelectHistoryItem}
        onRefresh={fetchHistory}
      />

      {/* Auth Modal */}
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

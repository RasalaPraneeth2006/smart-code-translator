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
import AISettingsModal from './components/AISettingsModal';
import { codeService, directGeminiTranslate, DEFAULT_GEMINI_MODEL } from './services/api';

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
  const [isFallback, setIsFallback] = useState(false);
  const [modelUsed, setModelUsed] = useState('');
  const [latencyMs, setLatencyMs] = useState(0);

  const [analysisData, setAnalysisData] = useState(null);
  const [analysisType, setAnalysisType] = useState('analysis');
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

  const [historyList, setHistoryList] = useState([]);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isAISettingsOpen, setIsAISettingsOpen] = useState(false);
  const [aiEngineModel, setAiEngineModel] = useState(() => {
    let stored = localStorage.getItem('sct_gemini_model') || DEFAULT_GEMINI_MODEL;
    if (stored === 'gemini-3.6-flash' || stored === 'gemini-2.5-flash' || stored === 'gemini-3.5-flash') {
      stored = DEFAULT_GEMINI_MODEL;
      localStorage.setItem('sct_gemini_model', stored);
    }
    return stored;
  });

  // Client-side instant LRU cache for 0ms repeat translations
  const [translationCache] = useState(() => new Map());

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

    const cacheKey = `${sourceLang}->${targetLang}:${preserveComments}:${includeTests}:${aiEngineModel}:${sourceCode.trim()}`;
    if (translationCache.has(cacheKey)) {
      const cached = translationCache.get(cacheKey);
      setTranslatedCode(cached.translatedCode);
      setAstData(cached.astData || null);
      setTestStubs(cached.testStubs || '');
      setIsFallback(false);
      setModelUsed(`${cached.modelUsed} • Instant Cache`);
      setLatencyMs(cached.latencyMs || 0);
      if (cached.testStubs && includeTests) setActiveOutputTab('code');
      return;
    }

    setIsLoading(true);

    try {
      const directEnabled = localStorage.getItem('sct_direct_fallback') !== 'false';
      let translationResult = null;

      // Fast-Track Turbo Strategy:
      // In production or when direct cloud booster is enabled, trigger direct Gemini translation
      // immediately (~1.2s latency) so the user never has to wait for sleeping servers.
      if (directEnabled) {
        try {
          const directPromise = directGeminiTranslate({
            code: sourceCode,
            sourceLang,
            targetLang,
            options: { preserveComments, includeTests },
          });

          // Also invoke backend asynchronously to parse AST metadata and persist to history
          codeService.translate({
            code: sourceCode,
            sourceLang,
            targetLang,
            options: { preserveComments, includeTests },
          }).then(res => {
            if (res?.data?.data) {
              const bgData = res.data.data;
              if (bgData.astData) setAstData(bgData.astData);
              if (bgData.testStubs) setTestStubs(bgData.testStubs);
              fetchHistory();
            }
          }).catch(() => {});

          const directRes = await directPromise;
          translationResult = {
            translatedCode: directRes.translatedCode,
            modelUsed: directRes.modelUsed,
            latencyMs: directRes.latencyMs,
            isFallback: false,
          };
        } catch (directErr) {
          console.warn('[Translator] Fast direct cloud attempt failed, falling back to backend:', directErr.message);
        }
      }

      // If direct cloud wasn't used or had an error, execute backend translation
      if (!translationResult) {
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
          const bData = res.data.data;
          translationResult = {
            translatedCode: bData.translatedCode,
            astData: bData.astData,
            testStubs: bData.testStubs || '',
            modelUsed: bData.metrics?.modelUsed || (bData.isFallback ? 'Offline Fallback' : 'Gemini AI'),
            latencyMs: bData.metrics?.latencyMs || 0,
            isFallback: !!bData.isFallback,
          };
          fetchHistory();
        }
      }

      if (translationResult) {
        setTranslatedCode(translationResult.translatedCode);
        if (translationResult.astData) setAstData(translationResult.astData);
        if (translationResult.testStubs) setTestStubs(translationResult.testStubs);
        setIsFallback(translationResult.isFallback);
        setModelUsed(translationResult.modelUsed);
        setLatencyMs(translationResult.latencyMs);

        // Store into cache for instant future lookups
        translationCache.set(cacheKey, translationResult);
        if (translationResult.testStubs && includeTests) setActiveOutputTab('code');
      } else {
        throw new Error('Unable to translate code. Please check your network or Gemini API key.');
      }
    } catch (err) {
      alert(`Translation Error: ${err.message}`);
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
        openAISettings={() => setIsAISettingsOpen(true)}
        aiEngineModel={aiEngineModel}
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
            isFallback={isFallback}
            modelUsed={modelUsed}
            latencyMs={latencyMs}
            openAISettings={() => setIsAISettingsOpen(true)}
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

      {/* AI Settings Modal */}
      <AISettingsModal
        isOpen={isAISettingsOpen}
        onClose={() => setIsAISettingsOpen(false)}
        onSettingsUpdated={(settings) => {
          if (settings.model) setAiEngineModel(settings.model);
        }}
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

import React, { useState, useEffect } from 'react';
import { Sparkles, Key, CheckCircle2, AlertCircle, X, RefreshCw, Eye, EyeOff, Cpu, Zap, ShieldCheck } from 'lucide-react';
import { DEFAULT_GEMINI_API_KEY, DEFAULT_GEMINI_MODEL, codeService } from '../services/api';

export default function AISettingsModal({ isOpen, onClose, onSettingsUpdated }) {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(DEFAULT_GEMINI_MODEL);
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [directCloudFallback, setDirectCloudFallback] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const storedKey = localStorage.getItem('sct_gemini_api_key');
      setApiKey(storedKey !== null ? storedKey : DEFAULT_GEMINI_API_KEY);
      const storedModel = localStorage.getItem('sct_gemini_model') || DEFAULT_GEMINI_MODEL;
      setModel(storedModel);
      const storedDirect = localStorage.getItem('sct_direct_fallback');
      setDirectCloudFallback(storedDirect !== 'false');
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('sct_gemini_api_key', apiKey.trim());
    localStorage.setItem('sct_gemini_model', model);
    localStorage.setItem('sct_direct_fallback', directCloudFallback ? 'true' : 'false');
    if (onSettingsUpdated) {
      onSettingsUpdated({ apiKey: apiKey.trim(), model, directCloudFallback });
    }
    onClose();
  };

  const handleResetDefault = () => {
    setApiKey(DEFAULT_GEMINI_API_KEY);
    setModel(DEFAULT_GEMINI_MODEL);
    setDirectCloudFallback(true);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const keyToTest = apiKey.trim() || DEFAULT_GEMINI_API_KEY;
    const start = Date.now();

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keyToTest}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respond with OK.' }] }],
        }),
      });

      const latencyMs = Date.now() - start;

      if (res.ok) {
        setTestResult({
          success: true,
          latencyMs,
          message: `Connection successful to ${model} (${latencyMs}ms latency).`,
        });
      } else {
        const data = await res.json().catch(() => ({}));
        setTestResult({
          success: false,
          message: data?.error?.message || `HTTP ${res.status}: Failed to authenticate with Gemini API`,
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || 'Network error while attempting connection.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-gray-700/70 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden text-gray-200 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-dark-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-accent text-white shadow-md shadow-brand-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">AI Engine & Gemini API Settings</h2>
              <p className="text-xs text-gray-400">Configure Google Gemini models & high-availability translation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto max-h-[75vh]">
          {/* Status banner */}
          <div className="p-3 rounded-xl bg-brand-900/20 border border-brand-500/30 flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-brand-cyan shrink-0 mt-0.5" />
            <div className="text-xs text-gray-300 leading-relaxed">
              <p className="font-semibold text-brand-cyan">Active Polyglot AI Translation</p>
              <p className="text-gray-400 mt-0.5">
                The application connects to Google's Gemini models for deep contextual syntax and semantics translation across 15+ languages.
              </p>
            </div>
          </div>

          {/* API Key Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-300 flex items-center space-x-1.5 font-mono">
                <Key className="w-3.5 h-3.5 text-brand-accent" />
                <span>Google Gemini API Key</span>
              </label>
              <button
                type="button"
                onClick={handleResetDefault}
                className="text-[11px] text-brand-cyan hover:underline font-mono"
              >
                Use System Default
              </button>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AQ... or AIzaSy..."
                className="w-full bg-dark-900 border border-gray-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 font-mono pr-10 shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-gray-500">
              Saved locally in your browser storage. Your key is never shared or stored on public servers.
            </p>
          </div>

          {/* Model Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 flex items-center space-x-1.5 font-mono">
              <Cpu className="w-3.5 h-3.5 text-brand-cyan" />
              <span>Translation Model Engine</span>
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-dark-900 border border-gray-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-mono cursor-pointer"
            >
              <option value="gemini-3.6-flash">gemini-3.6-flash (Ultra-Fast & Smart, Recommended)</option>
              <option value="gemini-2.5-flash">gemini-2.5-flash (Balanced Production)</option>
              <option value="gemini-flash-latest">gemini-flash-latest (Auto-Updating)</option>
              <option value="gemini-3.5-flash">gemini-3.5-flash (Standard)</option>
              <option value="gemini-3.7-flash">gemini-3.7-flash (Advanced Reasoning)</option>
            </select>
          </div>

          {/* Direct Cloud Fallback Toggle */}
          <div className="p-3.5 rounded-xl bg-dark-800/60 border border-gray-800 flex items-center justify-between">
            <div className="space-y-0.5 pr-3">
              <div className="flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-gray-200">Direct Cloud AI Booster</span>
              </div>
              <p className="text-[11px] text-gray-400">
                If the backend server is sleeping or missing its API key, directly translate via Gemini Cloud to guarantee 100% accurate results.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={directCloudFallback}
                onChange={(e) => setDirectCloudFallback(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>

          {/* Test Connection Button & Result */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold text-brand-cyan bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing Gemini API Connection...' : 'Test Connection & Measure Latency'}</span>
            </button>

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start space-x-2 animate-in fade-in ${
                  testResult.success
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-red-950/40 border-red-500/40 text-red-300'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{testResult.success ? 'API Key Valid & Operational' : 'Connection Failed'}</p>
                  <p className="text-[11px] opacity-90 mt-0.5">{testResult.message}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-800 bg-dark-900/80 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-accent hover:from-brand-500 hover:to-brand-accent/90 rounded-xl shadow-lg shadow-brand-500/25 transition"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

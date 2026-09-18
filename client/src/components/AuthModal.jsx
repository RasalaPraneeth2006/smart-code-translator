import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, Sparkles, ShieldCheck } from 'lucide-react';

export default function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, login, register, googleAuth } = useAuth();
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLoginTab) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSSO = async () => {
    setLoading(true);
    try {
      await googleAuth({
        email: 'developer@example.com',
        name: 'Google Polyglot Dev',
        googleId: 'g_sso_12345678',
      });
    } catch (err) {
      setError('Google SSO authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-md rounded-2xl border border-gray-700/80 overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-dark-800/90 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-brand-accent" />
            <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider font-mono">
              Developer Account SSO
            </h3>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="p-6">
          <div className="flex bg-dark-900 p-1 rounded-xl border border-gray-800 mb-6">
            <button
              onClick={() => setIsLoginTab(true)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                isLoginTab ? 'bg-brand-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLoginTab(false)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                !isLoginTab ? 'bg-brand-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/40 text-xs text-red-300">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginTab && (
              <div>
                <label className="block text-xs text-gray-400 mb-1 font-mono">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full bg-dark-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-400 mb-1 font-mono">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@company.com"
                  className="w-full bg-dark-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1 font-mono">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-dark-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-brand-accent hover:from-brand-500 hover:to-brand-accent/90 text-xs font-bold text-white shadow-lg transition"
            >
              {loading ? 'Authenticating...' : isLoginTab ? 'Sign In to Workspace' : 'Create Developer Account'}
            </button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-800" />
            <span className="px-3 text-[11px] text-gray-500 font-mono">OR</span>
            <div className="flex-1 border-t border-gray-800" />
          </div>

          <button
            onClick={handleGoogleSSO}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-dark-900 hover:bg-dark-800 border border-gray-800 text-xs font-semibold text-gray-200 flex items-center justify-center space-x-2 transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.74-2.1-6.68-4.93H1.36v3.15C3.34 21.28 7.37 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.32 14.27c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.36C.49 8.31 0 10.1 0 12s.49 3.69 1.36 5.42l3.96-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.34 2.72 1.36 6.58l3.96 3.15c.94-2.83 3.57-4.98 6.68-4.98z"
              />
            </svg>
            <span>Continue with Google OAuth SSO</span>
          </button>
        </div>
      </div>
    </div>
  );
}

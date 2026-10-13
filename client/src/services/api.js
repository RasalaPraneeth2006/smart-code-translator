import axios from 'axios';

export const DEFAULT_GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
export const DEFAULT_GEMINI_MODEL = 'gemini-flash-lite-latest';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://smart-code-translator-api.onrender.com/api' : '/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token & Gemini AI Headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sct_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const geminiKey = localStorage.getItem('sct_gemini_api_key') || DEFAULT_GEMINI_API_KEY;
    if (geminiKey) {
      config.headers['x-gemini-api-key'] = geminiKey;
    }

    let geminiModel = localStorage.getItem('sct_gemini_model') || DEFAULT_GEMINI_MODEL;
    // Auto-migrate overloaded / deprecated models to the ultra-fast working model
    if (geminiModel === 'gemini-3.6-flash' || geminiModel === 'gemini-2.5-flash' || geminiModel === 'gemini-3.5-flash') {
      geminiModel = DEFAULT_GEMINI_MODEL;
      localStorage.setItem('sct_gemini_model', geminiModel);
    }
    if (geminiModel) {
      config.headers['x-gemini-model'] = geminiModel;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Global 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('sct_token');
      localStorage.removeItem('sct_user');
    }
    return Promise.reject(error);
  }
);

/**
 * Direct Gemini REST API client
 * Provides instantaneous high-fidelity translation (~1.2s latency) directly from client browser,
 * with multi-candidate automatic fallback if any model experiences temporary demand spikes.
 */
export async function directGeminiTranslate({ code, sourceLang, targetLang, apiKey, model, options = {} }) {
  const activeKey = apiKey || localStorage.getItem('sct_gemini_api_key') || DEFAULT_GEMINI_API_KEY;
  if (!activeKey) {
    throw new Error('Client Gemini API key is not configured.');
  }
  let preferredModel = model || localStorage.getItem('sct_gemini_model') || DEFAULT_GEMINI_MODEL;
  
  if (preferredModel === 'gemini-3.6-flash' || preferredModel === 'gemini-2.5-flash' || preferredModel === 'gemini-3.5-flash') {
    preferredModel = DEFAULT_GEMINI_MODEL;
    localStorage.setItem('sct_gemini_model', preferredModel);
  }

  const candidateModels = [
    preferredModel,
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.8-flash',
  ].filter((m, idx, self) => m && self.indexOf(m) === idx);

  const prompt = `You are a world-class polyglot compiler and software engineer.
Translate the following ${sourceLang} source code into clean, idiomatic, and modern ${targetLang}.
Guidelines:
1. Faithfully preserve algorithmic business logic, types, edge case handling, and control flows.
2. Adapt constructs, standard libraries, and idiomatically native APIs to ${targetLang}.
3. ${options.preserveComments !== false ? 'Preserve and adapt all comments and docstrings.' : 'Omit non-essential comments.'}
4. Provide ONLY the final translated ${targetLang} code enclosed inside a markdown code block (\`\`\`${targetLang} ... \`\`\`), with NO extraneous conversational chit-chat.

Source Code (${sourceLang}):
\`\`\`${sourceLang}
${code}
\`\`\``;

  let lastError = null;

  for (const modelToTry of candidateModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToTry}:generateContent?key=${activeKey}`;
    const start = Date.now();

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            topP: 0.95,
            maxOutputTokens: 4096,
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData?.error?.message || `HTTP ${res.status}`;
        console.warn(`[Direct Translate Warning] Model '${modelToTry}' failed (${errMsg}). Trying next candidate...`);
        lastError = new Error(errMsg);
        continue;
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const codeBlockRegex = /```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)\n```/;
      const match = rawText.match(codeBlockRegex);
      const cleanedCode = match && match[1] ? match[1].trim() : rawText.replace(/```[a-zA-Z]*\n?/g, '').replace(/```/g, '').trim();

      return {
        translatedCode: cleanedCode,
        modelUsed: `${modelToTry} (Turbo Cloud)`,
        latencyMs: Date.now() - start,
        isFallback: false,
        rawResponse: rawText,
      };
    } catch (err) {
      console.warn(`[Direct Translate Error] Network error with '${modelToTry}': ${err.message}`);
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini candidate models failed to respond.');
}

export const codeService = {
  translate: (payload) => api.post('/code/translate', payload),
  analyze: (payload) => api.post('/code/analyze', payload),
  optimize: (payload) => api.post('/code/optimize', payload),
  runCode: (payload) => api.post('/code/run', payload),
  explainError: (payload) => api.post('/code/explain-error', payload),
  getHistory: () => api.get('/history'),
  getGeminiStatus: (params) => api.get('/code/gemini-status', { params }),
};

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  googleAuth: (googlePayload) => api.post('/auth/google', googlePayload),
};

export default api;

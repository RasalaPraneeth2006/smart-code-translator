import axios from 'axios';

export const DEFAULT_GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
export const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';

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

    const geminiModel = localStorage.getItem('sct_gemini_model') || DEFAULT_GEMINI_MODEL;
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
 * Provides instantaneous high-fidelity translation when the backend is offline or unconfigured.
 */
export async function directGeminiTranslate({ code, sourceLang, targetLang, apiKey, model, options = {} }) {
  const activeKey = apiKey || localStorage.getItem('sct_gemini_api_key') || DEFAULT_GEMINI_API_KEY;
  const activeModel = model || localStorage.getItem('sct_gemini_model') || DEFAULT_GEMINI_MODEL;

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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${activeKey}`;
  const start = Date.now();

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        topP: 0.95,
      },
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Gemini API HTTP ${res.status}`);
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const codeBlockRegex = /```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)\n```/;
  const match = rawText.match(codeBlockRegex);
  const cleanedCode = match && match[1] ? match[1].trim() : rawText.replace(/```[a-zA-Z]*\n?/g, '').replace(/```/g, '').trim();

  return {
    translatedCode: cleanedCode,
    modelUsed: `${activeModel} (Gemini Cloud)`,
    latencyMs: Date.now() - start,
    isFallback: false,
    rawResponse: rawText,
  };
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

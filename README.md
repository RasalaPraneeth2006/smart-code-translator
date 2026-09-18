# Smart Code Translator

Enterprise-grade full-stack developer tool that converts source code across multiple programming languages (**Python, JavaScript, TypeScript, Java, C++, Go**) while preserving:
- Semantic intent & business logic
- Language-specific idioms & best practices
- Type safety and structural definitions
- Error handling & async paradigms

---

## 🛠️ Architecture & Core Components

```
├── client/                      # React Frontend (Vite + Monaco Editor + Tailwind CSS)
│   ├── src/
│   │   ├── components/          # MonacoEditor, DiffViewer, HistoryPanel, Navbar, AnalysisModal
│   │   ├── context/             # AuthContext.jsx
│   │   ├── services/            # api.js (Axios with JWT interceptors)
│   │   └── App.jsx
├── server/                      # Express Backend (Tree-sitter AST + Gemini SDK)
│   ├── config/                  # db.js (MongoDB Mongoose + In-Memory Fallback)
│   ├── controllers/             # codeController.js, authController.js
│   ├── middleware/              # authMiddleware.js, errorHandler.js
│   ├── services/                # treeSitterService.js, llmService.js, promptFactory.js, postProcessor.js
│   ├── models/                  # User.js, TranslationHistory.js
│   └── server.js
├── cli/                         # Terminal CLI Batch Tool
│   ├── bin/                     # smart-translate.js
│   └── index.js
├── .env.example                 # Root Environment Template
└── README.md
```

---

## ⚡ Quick Start & Installation

### 1. Backend Server Setup (`server/`)
```bash
cd server
npm install
npm start
```
> The server runs on `http://localhost:5000`. If `MONGODB_URI` or `GEMINI_API_KEY` are not set in `.env`, the server automatically degrades gracefully to an in-memory repository store & context-aware smart fallback translator engine.

### 2. Frontend Dual-Pane IDE (`client/`)
```bash
cd client
npm install
npm run dev
```
> Access the web IDE at `http://localhost:3000`.

### 3. Terminal CLI Batch Translator (`cli/`)
```bash
cd cli
npm install
node index.js --source python --target typescript --input ./sample.py --output ./sample.ts --test
```

---

## 📡 API Endpoints

### Auth Endpoints
- `POST /api/auth/register` - Signup with email/password
- `POST /api/auth/login` - Login returning JWT token
- `POST /api/auth/google` - Google OAuth SSO authentication

### Core Code Endpoints
- `POST /api/code/translate` - Translates source code with AST context & generates test stubs.
  - **Payload**: `{ code, sourceLang, targetLang, options: { preserveComments, includeTests } }`
- `POST /api/code/analyze` - Returns Time & Space complexity breakdown and health issues.
- `POST /api/code/optimize` - Refactors source code for modern performance idioms.
- `GET /api/history` - Fetches user translation & operation log records.

---

## 🛡️ Key Features
- **Tree-sitter AST Structural Extraction**: Parses syntax trees to capture functions, classes, scopes, imports, and docstrings.
- **Idiomatic Conversion Rules**: Maps Python `asyncio` $\rightarrow$ JS `Promise.all()`, Python `dict.get()` $\rightarrow$ JS optional chaining `?.`, Go `err != nil` patterns $\rightarrow$ JS `try/catch`.
- **Monaco Split Diff Viewer**: Visual side-by-side diff comparison between source and target code.
- **Automated Test Stub Generator**: Generates PyTest, Vitest, JUnit, and Go test stubs.

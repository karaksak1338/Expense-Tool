# Datacair Expense Tool (ChronoRide)

A premium, AI-powered expense management system designed for seamless receipt processing, automated bank statement extraction, and multi-user workflow management.

## 🚀 Key Features

### 🧠 Gemini AI Powered Extraction
- **Receipt Analysis**: Instantly extract vendor, amount, date, and category from images or PDFs.
- **Bank Statement Processing**: High-precision parsing of credit card and bank statements into structured transaction lists.
- **Smart Categorization**: Auto-mapping of expenses based on company-specific expense types.

### ⚡ Performance & Fluidity
- **Background Processing Queue**: Non-blocking AI tasks allow users to continue working while documents are processed in the background.
- **Optimistic UI**: Immediate feedback for uploads with real-time status updates (⏳ Processing -> ✨ AI Extracted).
- **Blob Object Previews**: High-performance image previews using `URL.createObjectURL` to avoid browser storage quotas.

### 🛡️ Administrative Control
- **Entity Management**: Support for multiple business entities with specific currency and duplicate-check rules.
- **SSO & RBAC**: Secure authentication with Role-Based Access Control (Admin, Accountant, Manager, Staff).
- **Audit Portal**: Centralized hub for finance teams to approve, accrue, and close claims.

---

## 🛠️ Tech Stack
- **Frontend**: React 19, Vite, Vanilla CSS
- **Backend (API)**: Node.js (Vercel Edge/Serverless Functions), Express (Local Dev)
- **AI Engine**: Google Gemini 2.5 Flash
- **Database & Storage**: Supabase (PostgreSQL, Auth, Storage)

---

## 🚦 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Supabase Account
- Google AI (Gemini) API Key

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
VITE_GEMINI_PROXY_URL=http://localhost:3002
```

### 3. Installation
```bash
npm install
```

### 4. Running the App
Start the local API server and the frontend concurrently:
```bash
# Terminal 1: API Server
npm run dev:api

# Terminal 2: Frontend
npm run dev
```

---

## 📖 API Documentation
Detailed endpoint specifications can be found in `C:\Users\SakirKarakayaNSKITCo\.gemini\antigravity\brain\58223b9e-d32a-4c24-857b-276cbed9f4c8\api_documentation.md` (local reference during development) or mapped to your production proxy.

## 📄 License
Internal Datacair Project - All Rights Reserved.

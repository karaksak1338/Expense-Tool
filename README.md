# DCBI Expense Tool 🚀

A modern, production-ready expense management platform built for speed, transparency, and compliance. Now enhanced with **V2 AI & Multi-Currency** features.

## 🏛️ Architecture

- **Frontend**: React 19 + Vite (Fast, responsive UI with Glassmorphism aesthetics).
- **Backend**: Supabase (PostgreSQL, Real-time data, and secure Auth).
- **AI Integration**: Google Gemini (Direct proxy for receipt extraction).
- **Compliance**: Full JSONB audit trails and D365FO ready synchronization.

## ✨ Key Features (V2)

- **🤖 AI Receipt Extraction**: Upload receipts and let Gemini automatically extract Vendor, Date, Currency, and Amount.
- **🌍 Multi-Currency Engine**: Support for Primary/Secondary entity currencies and monthly admin-defined exchange rates.
- **💳 Company Card Import**: Persistent bank statement (CSV/PDF) attachments with automated matching heuristics.
- **🛡️ Governance 2.0**: Advanced Admin Center for Entity-specific configurations, user deactivation, and AI prompt management.
- **📚 Smart Receipts Library**: Centralized backlog of unallocated receipts with duplicate detection and AI status tracking.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Supabase Account (with `receipts` storage bucket)
- Google Gemini API Key (for AI features)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/karaksak1338/Expense-Tool.git
   cd Expense-Tool
   ```

2. **Client Setup**:
   ```bash
   cd client
   npm install
   ```
   Create a `.env` file in the `client` directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Database Setup**:
   - Run `supabase_schema.sql` in your Supabase SQL Editor.
   - Run `supabase_v2_migration.sql` to apply AI and Multi-Currency schema updates.
   - Run `ai_prompts.sql` to initialize the default Gemini instruction set.
   - Run `migrate_data.sql` to populate initial test registry.

### Running Locally

```bash
# In the client directory
npm run dev
```

The app will be available at `http://localhost:5173`.

## 🛡️ Compliance & Tech Audit

The system is designed with a "Finance-First" approach, ensuring every claim has a full JSONB audit trail and is correctly mapped to legal entities before synchronization. All Company Card imports are linked to their source statements for 100% auditable records.

---
Developed with ❤️ for DCBI Global.

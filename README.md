# DCBI Expense Tool 🚀

A modern, production-ready expense management platform built for speed, transparency, and compliance.

## 🏛️ Architecture

- **Frontend**: React 19 + Vite (Fast, responsive UI with Glassmorphism aesthetics).
- **Backend**: Supabase (PostgreSQL, Real-time data, and secure Auth).
- **Database Schema**: Optimized for multi-entity auditing with full history tracking.

## ✨ Key Features

- **Dynamic Login**: Dev-friendly profile switcher with real-time registry sync.
- **Receipts Library**: Unallocated receipt backlog with AI/Simulation capabilities.
- **Interactive Multi-Step Claims**: Drag-and-drop receipt allocation and line-item auditing.
- **Governance Portal**: Admin center for managing Entities, Users, Projects, and Departments.
- **Finance Audit**: Specialized views for Accountants to accrued and sync claims to D365FO.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Supabase Account

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
   - Run `supabase_schema.sql` in your Supabase SQL Editor to create the tables.
   - Run `migrate_data.sql` to populate the initial system registry (Entities, Users).

### Running Locally

```bash
# In the client directory
npm run dev
```

The app will be available at `http://localhost:5173`.

## 🛡️ Compliance & Tech Audit

The system is designed with a "Finance-First" approach, ensuring every claim has a full JSONB audit trail and is correctly mapped to legal entities before synchronization.

---
Developed with ❤️ for DCBI Global.

# Vercel Deployment Guide: DCBI Expense Tool

Follow these steps to deploy the DCBI Expense Tool to Vercel with full AI and Database functionality.

## 1. Prepare for Deployment

Vercel works best with a single root directory. Ensure your repository is structured as:
```text
/
├── client/          # Vite Frontend
├── api/             # Vercel Serverless Functions
│   └── extract.js   # (Copy server/index.js logic here)
├── vercel.json      # Routing & Build Config
└── package.json     # Root dependencies (optional)
```

### Action Required: Move Proxy to `/api`
The current `server/index.js` is a standalone Express server. Vercel automatically exposes any file in the `/api` directory as a serverless function. 

1. Create a file named `api/extract.js`.
2. Adapt the code from `server/index.js` into this file (removing `app.listen` and manual Express startup).

---

## 2. Configuration (`vercel.json`)

Create this file in the root directory to tell Vercel how to build and route:

```json
{
  "rewrites": [
    {
      "source": "/api/extract",
      "destination": "/api/extract"
    },
    {
      "source": "/(.*)",
      "destination": "/client/$1"
    }
  ],
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ]
}
```

---

## 3. Environment Variables (Vercel Dashboard)

Go to **Settings > Environment Variables** in your Vercel Project and add:

### Frontend (Client)
- `VITE_SUPABASE_URL`: Your Supabase Project URL.
- `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key.

### AI Proxy (Backend)
- `GEMINI_API_KEY`: Required for receipt extraction.
- `SUPABASE_SERVICE_ROLE_KEY`: Required for fetching dynamic prompts if RLS is strict.

---

## 4. Supabase CORS Settings (Important)

In your Supabase Dashboard (**Settings > API**), ensure the Vercel deployment URL (e.g., `https://expense-tool.vercel.app`) is added to the **CORS Allowed Origins** list.

## 5. Deployment Step & Vercel Settings

When importing the project into Vercel, use these settings:

1.  **Framework Preset**: Select `Vite`.
2.  **Root Directory**: Set this to `client`.
3.  **Build Command**: `npm run build` (detected automatically).
4.  **Output Directory**: `dist` (detected automatically).
5.  **Environment Variables**: Ensure you add the variables from Step 3 before deploying.

### Deployment Process:
1. Push your changes to GitHub.
2. Connect your GitHub repository to Vercel.
3. Configure the settings above in the Vercel "Configure Project" screen.
4. Click **Deploy**.

---

**Note**: For production, ensure you use `SUPABASE_SERVICE_ROLE_KEY` sparingly and keep your `GEMINI_API_KEY` restricted in the Google Cloud Console.

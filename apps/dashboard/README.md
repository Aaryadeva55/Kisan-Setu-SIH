# Kisan Setu — Frontend Dashboard

The web dashboard application for **Kisan Setu**, providing role-based portals for **Buyers**, **FPOs (Farmer Producer Organizations)**, and **Government Evaluators / Admins**.

---

## 🚀 Tech Stack

* **Framework:** React + Vite
* **Styling:** Tailwind CSS + Radix UI primitives + Lucide Icons
* **Data Visualization:** Recharts
* **State & Networking:** React Query / Axios / Context API

---

## 🛠️ Local Development

### Prerequisites
Node.js 18+ and npm 9+

### Quick Start
```bash
# From repository root
npm run dev:dashboard

# OR from apps/dashboard directory
cd apps/dashboard
npm install
npm run dev
```
The dashboard will start at `http://localhost:5173`.

---

## 🌐 Environment Variables

Create `.env` inside `apps/dashboard` (or `.env.local`):

```env
# URL of the backend API server
VITE_API_BASE_URL="http://localhost:4000/api/v1"

# Enable MSW synthetic mock API if backend is not running
VITE_ENABLE_MOCKS=false
```

---

## 📦 Building & Production

```bash
# Build production bundle
npm run build

# Preview production build locally
npm run preview
```
Output bundle will be generated in `dist/`.

---

## 🚀 Deployment (Vercel / Netlify / Cloudflare Pages)

### Deploying to Vercel

1. **Option A: Monorepo Deployment**
   - Connect repository to Vercel.
   - Set **Root Directory** to `apps/dashboard`.
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Set Environment Variable: `VITE_API_BASE_URL` pointing to your deployed backend API URL.

2. **Option B: Standalone Deployment**
   - Push `apps/dashboard` as an independent repository or submodule.
   - Deploy as standard Vite SPA with `vercel.json` rewrite routing.

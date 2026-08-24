# 🚀 Kisan Setu — Complete Deployment & Run Guide
### Agricultural Market-Linkage Platform · SIH 2026

This guide provides step-by-step instructions for **running locally**, **provisioning cloud databases**, and **deploying the Frontend, Backend API, and Worker independently**.

---

## 📑 Table of Contents

1. [Local Development (Quick Start)](#1-local-development-quick-start)
   - [Mode A: Standalone Mock Mode (No DB required)](#mode-a-standalone-mock-mode-no-database-required)
   - [Mode B: Full Stack Local Mode](#mode-b-full-stack-local-mode)
2. [Free Cloud Database Setup (PostgreSQL & Redis)](#2-free-cloud-database-setup-postgresql--redis)
3. [Deploying Backend API (`apps/api`)](#3-deploying-backend-api-appsapi)
4. [Deploying Background Worker (`apps/worker`)](#4-deploying-background-worker-appsworker)
5. [Deploying Frontend Dashboard (`apps/dashboard`)](#5-deploying-frontend-dashboard-appsdashboard)
6. [WhatsApp Cloud API Webhook Setup](#6-whatsapp-cloud-api-webhook-setup)
7. [Demo Accounts & Live Hackathon Demo Script](#7-demo-accounts--live-hackathon-demo-script)
8. [Troubleshooting & FAQs](#8-troubleshooting--faqs)

---

## 1. Local Development (Quick Start)

### Prerequisites
* **Node.js**: v20.x or later
* **npm**: v9.x or later

```bash
# Clone the repository and install dependencies
git clone https://github.com/Arshal-16/Kisan-Setu-SIH.git
cd Kisan-Setu-SIH
npm install
```

---

### Mode A: Standalone Mock Mode (No Database Required)
Ideal for testing UI flows, presentations, or offline development without installing Docker or PostgreSQL.

1. Ensure `apps/dashboard/.env` contains:
   ```env
   VITE_API_BASE_URL=https://api.kisansetu.app/api/v1
   VITE_APP_NAME=Kisan Setu
   VITE_ENABLE_MOCKS=true
   ```
2. Start the dashboard:
   ```bash
   npm run dev:dashboard
   ```
3. Open [`http://localhost:3000`](http://localhost:3000) in your browser. All buyer, FPO, and admin features work with built-in Mock Service Worker data.

---

### Mode B: Full Stack Local Mode
Runs the live Express API alongside the React Dashboard.

1. Create a root `.env` from `.env.example`:
   ```bash
   cp .env.example .env
   ```
2. Start local PostgreSQL & Redis (or point `DATABASE_URL` in `.env` to your cloud PostgreSQL).
3. Apply database schema and seed fixtures:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```
4. Set `VITE_ENABLE_MOCKS=false` and `VITE_API_BASE_URL=http://localhost:4000/api/v1` in `apps/dashboard/.env`.
5. Launch both servers in one command:
   ```bash
   npm run dev
   ```
   * **API Health Check:** [`http://localhost:4000/health`](http://localhost:4000/health)
   * **Frontend Dashboard:** [`http://localhost:3000`](http://localhost:3000)

---

## 2. Free Cloud Database Setup (PostgreSQL & Redis)

For cloud deployment, you can use generous free-tier managed databases:

### A. PostgreSQL (Neon or Supabase)
1. Go to [Neon.tech](https://neon.tech) or [Supabase.com](https://supabase.com) and create a free project.
2. Copy the PostgreSQL connection URI (e.g. `postgresql://user:password@ep-xyz.neon.tech/kisan_setu?sslmode=require`).
3. Push schema and populate seed data directly from your local terminal:
   ```bash
   DATABASE_URL="your-neon-connection-string" npx prisma db push
   DATABASE_URL="your-neon-connection-string" npx prisma db seed
   ```

### B. Redis (Upstash)
1. Go to [Upstash.com](https://upstash.com) and create a free Redis database.
2. Copy the `rediss://...` connection string for `REDIS_URL`.

---

## 3. Deploying Backend API (`apps/api`)

The API can be deployed to **Render, Railway, Fly.io, or AWS ECS** using the provided production Dockerfile.

### Deployment on Render.com (Recommended)
1. Create a **New Web Service** on Render connected to your GitHub repository.
2. Configure the service:
   * **Environment:** `Docker`
   * **Dockerfile Path:** `apps/api/Dockerfile`
   * **Docker Context:** `.` (Repository root)
   * **Instance Type:** Free or Starter
3. Add Environment Variables:
   ```env
   NODE_ENV=production
   PORT=4000
   DATABASE_URL=postgresql://user:pass@ep-xyz.neon.tech/kisan_setu?sslmode=require
   REDIS_URL=rediss://default:pass@xyz.upstash.io:6379
   JWT_ACCESS_SECRET=kisan_setu_jwt_super_secret_access_key_2026
   JWT_REFRESH_SECRET=kisan_setu_jwt_super_secret_refresh_key_2026
   JWT_ACCESS_EXPIRY=15m
   JWT_REFRESH_EXPIRY=7d
   CORS_ALLOWED_ORIGIN=https://your-frontend-domain.vercel.app,http://localhost:3000
   DEMO_MODE=true
   WHATSAPP_PHONE_NUMBER_ID=your_meta_phone_number_id
   WHATSAPP_ACCESS_TOKEN=your_meta_access_token
   WHATSAPP_APP_SECRET=your_meta_app_secret
   WHATSAPP_VERIFY_TOKEN=kisan_setu_webhook_verify_token_2026
   ```
4. Click **Deploy**. Once finished, verify by visiting:
   `https://<your-render-app>.onrender.com/health` $\rightarrow$ `{"status":"ok"}`.

---

## 4. Deploying Background Worker (`apps/worker`)

### Deployment on Render.com
1. Create a **New Background Worker** on Render connected to the same repository.
2. Configure:
   * **Environment:** `Docker`
   * **Dockerfile Path:** `apps/worker/Dockerfile`
   * **Docker Context:** `.` (Repository root)
3. Add Environment Variables:
   ```env
   NODE_ENV=production
   DATABASE_URL=postgresql://user:pass@ep-xyz.neon.tech/kisan_setu?sslmode=require
   REDIS_URL=rediss://default:pass@xyz.upstash.io:6379
   ```
4. Deploy. The worker will automatically connect to Redis and process price ingestion, weather forecasts, and matching queues.

---

## 5. Deploying Frontend Dashboard (`apps/dashboard`)

### Deployment on Vercel (Recommended)
1. Go to [Vercel.com](https://vercel.com) $\rightarrow$ **Add New Project** $\rightarrow$ Import your GitHub repo.
2. In the configuration settings:
   * **Framework Preset:** `Vite`
   * **Root Directory:** `apps/dashboard` *(Click Edit and select `apps/dashboard`)*
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
3. Add Environment Variables:
   ```env
   VITE_API_BASE_URL=https://<your-backend-api-domain>/api/v1
   VITE_APP_NAME=Kisan Setu
   VITE_ENABLE_MOCKS=false
   ```
4. Click **Deploy**. Vercel will build and host your dashboard on a fast global CDN with automatic HTTPS.

---

## 6. WhatsApp Cloud API Webhook Setup

To connect the live WhatsApp chatbot to your deployed backend API:

1. Log into the [Meta Developer Portal](https://developers.facebook.com/) and open your WhatsApp app.
2. Under **WhatsApp $\rightarrow$ Configuration $\rightarrow$ Webhook**:
   * **Callback URL:** `https://<your-api-domain>/api/v1/whatsapp/webhook`
   * **Verify Token:** `kisan_setu_webhook_verify_token_2026` *(Must match `WHATSAPP_VERIFY_TOKEN` in your backend `.env`)*
3. Click **Verify and Save**. Meta will perform a handshake verification and show a green checkmark.
4. Under **Webhook fields**, subscribe to `messages`.

> **Testing without Meta account:**
> You can simulate WhatsApp messages directly via HTTP:
> ```bash
> curl -X POST https://<your-api-domain>/api/v1/whatsapp/simulate \
>   -H "Content-Type: application/json" \
>   -d '{"phone": "9890001002", "message": "1"}'
> ```

---

## 7. Demo Accounts & Live Hackathon Demo Script

The database seed script initializes ready-to-use demo accounts (`password123` for all users):

### Pre-Seeded Dashboard Personas

| Role | Email / Phone | Password | Key Dashboard Features |
|---|---|---|---|
| **Admin / Evaluator** | `admin@kisansetu.in` | `password123` | KPI summary, GMV closed, district adoption rankings, system health |
| **Government Evaluator** | `evaluator@maharashtra.gov.in` | `password123` | Regional analytics, district-wise crop adoption, transaction funnel |
| **Buyer** | `procurement@mahaagro.com` | `password123` | Post requirements, review incoming farmer matches, accept transactions |
| **FPO Admin** | `9830011111@fpo.in` | `password123` | Member farmer aggregation, demand matching, multi-farmer bundling |

---

### The Winning Live Hackathon Demo Script (Climax Flow)

1. **Step 1 — Show the Problem & Admin Overview:**
   * Log into the Admin Dashboard (`admin@kisansetu.in`).
   * Show the KPI strip (Farmers Reached, Advisories Delivered, GMV Closed) and explain: *"Most agri-apps stop at advisory. We track transaction closure."*

2. **Step 2 — Buyer Posts Demand:**
   * Switch to the Buyer Portal (`procurement@mahaagro.com`).
   * Show active demand for **Soybean (25,000 kg)** at **₹4,800/quintal** in Nashik.

3. **Step 3 — Farmer Conversational Journey (Hero Farmer: Sunita Tai - `9890001002`):**
   * Simulate or send WhatsApp message: *"Hi"*
   * Farmer selects **Marathi (1)** $\rightarrow$ **Nashik (1)** $\rightarrow$ **Crop Advisory (1)**.
   * Bot returns explainable recommendation with reasons.
   * Farmer enters Sell Intent: **Soybean, 500 kg**.
   * Matching engine matches with *MahaAgro Procurement Ltd* (92% compatibility) and asks farmer to confirm.
   * Farmer replies **1 (Yes)** $\rightarrow$ Transaction created in `REQUESTED` state.

4. **Step 4 — Buyer Accepts & Closes Transaction:**
   * Return to the Buyer Dashboard.
   * A new request from *Sunita Tai* appears in **"Incoming Requests"**.
   * Buyer clicks **Accept**.
   * The status transitions to `ACCEPTED`, deducting capacity and sending an instant Marathi WhatsApp confirmation to Sunita Tai.

---

## 8. Troubleshooting & FAQs

### Q: Port 4000 or 3000 is already in use (`EADDRINUSE`)
```bash
# Find and terminate processes on ports 4000 & 3000
lsof -ti :4000 -ti :3000 | xargs kill -9 2>/dev/null || true
```

### Q: CORS error on frontend API calls
Ensure `CORS_ALLOWED_ORIGIN` in your backend `.env` includes your deployed frontend domain (e.g. `https://kisan-setu.vercel.app`), separated by comma.

### Q: How do I run the full test suite?
```bash
npm run test
```
All 17 unit and integration tests (Recommendation Rules, Matching Calculator, Localization, and API routes) will execute and report passing status.

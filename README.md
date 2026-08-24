# 🌾 Kisan Setu (किसान सेतू)

> **Closing the Loop:** An end-to-end Agricultural Market-Linkage Platform connecting Farmers with Buyers & FPOs via WhatsApp and Web Portals, powered by explainable agronomic recommendations and weighted multi-factor matching.

[![CI](https://github.com/Arshal-16/Kisan-Setu/actions/workflows/ci.yml/badge.svg)](https://github.com/Arshal-16/Kisan-Setu/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![Prisma](https://img.shields.io/badge/Prisma-6.4+-2D3748.svg)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D.svg)](https://redis.io)

---

## 🏛️ System Architecture & Monorepo Structure

```
.
├── apps/
│   ├── api/             # Express + TypeScript Modular Monolith REST API
│   ├── dashboard/       # React + Vite Web Dashboard (Buyer / FPO / Admin)
│   └── worker/          # BullMQ + Redis Background Job Processing Engine
│
├── packages/
│   ├── config/          # Zod-validated environment configuration
│   ├── shared/          # Clamps, Haversine geo distance, INR formatting
│   └── types/           # Shared TypeScript interfaces, DTOs, and Enums
│
├── prisma/
│   ├── schema.prisma    # 21-model PostgreSQL relational data schema
│   └── seed.ts          # Seed dataset with 3 districts, 8 crops, 15 farmers
│
├── docs/                # Architecture blueprints and technical specifications
│   ├── master.md        # Master technical blueprint
│   ├── backend.md       # Detailed backend specification
│   └── frontend.md      # Detailed frontend specification
│
├── docker-compose.yml   # Local development PostgreSQL 16 & Redis 7
├── package.json         # Workspace root scripts & dependencies
└── .gitignore           # Root git exclusions
```

---

## ⚡ Quick Start (Local Development)

### 1. Prerequisites
* **Node.js**: v20.x or later
* **npm**: v9.x or later
* **Docker & Docker Compose** (for local PostgreSQL & Redis)

### 2. Setup Environment
```bash
# Clone the repository
git clone https://github.com/Arshal-16/Kisan-Setu.git
cd Kisan-Setu

# Install all workspace dependencies
npm install

# Start local PostgreSQL & Redis containers
docker compose up -d

# Generate Prisma Client and apply migrations & seed data
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 3. Launch Development Servers

You can launch all services or run them individually:

| Service | Command | URL / Port |
|---|---|---|
| **All Services** | `npm run dev` | — |
| **API Server** | `npm run dev:api` | `http://localhost:4000` |
| **Dashboard** | `npm run dev:dashboard` | `http://localhost:5173` |
| **Background Worker** | `npm run dev:worker` | Background Process |
| **Prisma Studio** | `npx prisma studio` | `http://localhost:5555` |

---

## 🧪 Testing & Quality Assurance

```bash
# Run unit & integration test suites (17 test cases across modules)
npm run test

# Run TypeScript typechecks across all workspaces
npm run typecheck

# Build production bundles across all packages and apps
npm run build
```

---

## 🚀 Independent Deployment Guide

Frontend and Backend services are completely decoupled and can be deployed independently.

### A. Deploying Frontend (`apps/dashboard`)
* **Target Platforms:** Vercel, Netlify, Cloudflare Pages
* **Root Directory:** `apps/dashboard`
* **Build Command:** `npm run build`
* **Output Directory:** `dist`
* **Environment Variables:**
  * `VITE_API_BASE_URL`: Deployed URL of your backend API (e.g. `https://api.kisansetu.in/api/v1`)
  * `VITE_ENABLE_MOCKS`: `false`

### B. Deploying Backend API (`apps/api`)
* **Target Platforms:** Render, Railway, Fly.io, AWS ECS
* **Containerized Deployment:** Dockerfile provided at [`apps/api/Dockerfile`](file:///home/batman/Documents/CODING/Kisan-Setu/apps/api/Dockerfile)
* **Environment Variables:**
  * `DATABASE_URL`: Hosted PostgreSQL connection string (e.g. Neon, Supabase, AWS RDS)
  * `REDIS_URL`: Hosted Redis connection string (e.g. Upstash, AWS ElastiCache)
  * `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`: Secure random secrets
  * `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_ACCESS_TOKEN` / `WHATSAPP_VERIFY_TOKEN`
  * `CORS_ALLOWED_ORIGIN`: Your deployed frontend origin

### C. Deploying Background Worker (`apps/worker`)
* **Target Platforms:** Render Background Worker, Railway Service, Fly.io Worker
* **Containerized Deployment:** Dockerfile provided at [`apps/worker/Dockerfile`](file:///home/batman/Documents/CODING/Kisan-Setu/apps/worker/Dockerfile)
* **Environment Variables:**
  * `DATABASE_URL` & `REDIS_URL`

---

## 📖 Documentation & References

* [Master Technical Blueprint](docs/master.md)
* [Backend Specification & Architecture](docs/backend.md)
* [Frontend Specification & UI Flow](docs/frontend.md)
* [API Service Guide](apps/api/README.md)
* [Dashboard Frontend Guide](apps/dashboard/README.md)
* [Worker Service Guide](apps/worker/README.md)

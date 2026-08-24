# Kisan Setu — API Server

The core backend API service for **Kisan Setu**, built with **Node.js, Express, TypeScript, and Prisma ORM**.

---

## 🚀 Key Modules & Capabilities

1. **Authentication (`/api/v1/auth`)**: JWT Access + Refresh token rotation, bcrypt password hashing.
2. **Crop & Advisory Recommendations (`/api/v1/crops`, `/api/v1/recommendations`)**: Explainable 4-rule engine logging detailed rule traces (`ruleTrace`).
3. **Mandi Prices & Trends (`/api/v1/market`)**: Real-time modal prices and 30-day percentage momentum calculations with Redis caching.
4. **Weather Forecasts (`/api/v1/weather`)**: IMD weather observation and 5-day forecasts.
5. **Buyer & FPO Matching (`/api/v1/matching`, `/api/v1/fpo`)**: 6-factor weighted composite scoring algorithm.
6. **Transaction State Machine (`/api/v1/transactions`)**: Concurrency-safe atomic transaction creation, status transitions (`REQUESTED` $\rightarrow$ `ACCEPTED` $\rightarrow$ `COMPLETED`), audit history (`TransactionStatusHistory`), and automated WhatsApp alerts.
7. **WhatsApp Conversational Subsystem (`/api/v1/whatsapp`)**: Meta Cloud API webhook ingress, deduplication by `externalMsgId`, and Marathi state machine.
8. **Admin & Analytics (`/api/v1/admin`)**: Aggregated GMV, conversion funnel, adoption rankings, and system health status.

---

## 🛠️ Local Development

### Prerequisites
* Node.js 20+
* PostgreSQL 16
* Redis 7

```bash
# From repository root
npm run dev:api

# OR from apps/api directory
cd apps/api
npm run dev
```
The API server will start at `http://localhost:4000`.

---

## 🧪 Testing

```bash
# Run unit & integration tests
npm run test --workspace @kisan-setu/api
```

---

## 🐳 Docker Deployment

Build and run container:
```bash
docker build -f Dockerfile -t kisan-setu-api ../..
docker run -p 4000:4000 --env-file .env kisan-setu-api
```

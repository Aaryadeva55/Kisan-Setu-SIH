# Kisan Setu — Master Technical Blueprint
### Government of Maharashtra · Smart India Hackathon

> "Kisan Setu is not fundamentally a prediction system. It is a market-linkage system that uses agricultural intelligence to close the loop between farmer decisions and actual buyer transactions."

---

## 0. How to Use This Document

This is the single source of truth for building Kisan Setu end-to-end: problem → architecture → schema → APIs → jobs → dashboard → testing → deployment → demo. It assumes a 4-person student team building for SIH in ~6 weeks. Every section is written to be directly actionable — copy the folder structure, copy the schema, copy the pseudocode, adapt and ship.

---

## 1. Executive Overview

### 1.1 The Problem

A farmer in rural Maharashtra today faces four disconnected problems, not one:

1. **What to grow** — advisory is generic, not location/season/weather-specific, and rarely reaches the farmer in a channel or language they actually use.
2. **What it's worth** — mandi price data exists (data.gov.in) but is fragmented, delayed, and not personalized to the farmer's crop, location, and harvest timing.
3. **Who will buy it** — even when a farmer has produce ready, there is no structured channel to reach FPOs or buyers who actually want that crop, in that quantity, at that time.
4. **How to actually transact** — even where a buyer is interested, there is no lightweight system to formally request, confirm, and track a transaction end-to-end.

Existing government and private tools solve **at most one** of these (an advisory chatbot, a price-checking app, an FPO directory) and stop there. None of them close the loop into an actual transaction.

### 1.2 Target Users

| User | Need |
|---|---|
| **Farmer** | Low-literacy-friendly, regional-language, low-bandwidth advisory + a real buyer at the end |
| **Buyer / Trader / Processor** | Structured, verified pipeline of farmer supply instead of unstructured word-of-mouth |
| **FPO (Farmer Producer Organization)** | Aggregation visibility across its member farmers, demand-side visibility, transaction oversight |
| **Government / Evaluator** | Macro visibility into advisory reach, market activity, and — critically — transactions actually closed (an outcome metric, not just usage) |

### 1.3 Proposed Solution

A WhatsApp-first (voice-fallback) conversational platform, backed by a modular monolith API, a rules-first explainable recommendation engine, a weighted buyer-matching engine, and a transaction system with full state tracking — surfaced to farmers over WhatsApp and to buyers/FPOs/admins over a web dashboard.

### 1.4 Core Differentiator

The judged differentiator is **transaction closure**, not advisory quality. Any team can show a chatbot that says "grow soybean." The system that wins should show:

> Farmer gets an advisory → sees a live mandi price → is matched to a real buyer profile → sends a transaction request → buyer accepts on a dashboard → both sides see status update in real time.

This is the story that separates Kisan Setu from "yet another agri-chatbot," and every architectural decision below is made to protect this narrative.

### 1.5 Why WhatsApp

- Near-universal penetration in rural India already; zero app-install friction.
- Native support for text, voice notes, buttons/lists (WhatsApp interactive messages), and images.
- Meta's Cloud API is free-tier friendly for a hackathon and government-pilot scale.
- Twilio is kept only as a **voice IVR fallback** for feature-phone users or poor-literacy users — not the primary channel, to avoid overengineering the MVP.

### 1.6 Why Regional Language

Advisory in English or even Hindi alone excludes a large share of Maharashtra's actual farming population using Marathi (and regional dialectal agricultural terms). Language is treated as a first-class dimension of the conversation state machine, not a translation afterthought.

### 1.7 Why Transaction Closure Matters

Government evaluators and SIH judges alike are increasingly skeptical of "advisory-only" agri-tech because it has weak, unmeasurable outcomes. A logged `Transaction` row with a `REQUESTED → ACCEPTED → COMPLETED` lifecycle is a **hard, auditable outcome metric** — farmer income impact — that a chatbot demo alone cannot claim.

### 1.8 MVP Scope (What Must Work Without Fail)

- WhatsApp conversational flow (language → location → crop → advisory → price → buyer match → transaction request)
- Rules-based recommendation (no ML dependency)
- Real or realistically-seeded mandi price + weather data
- Deterministic buyer-matching algorithm
- Transaction lifecycle with dashboard visibility
- One working regional language end-to-end (Marathi), extensible design for more

### 1.9 Future Scope (Explicitly Out of MVP)

- ML-based price/demand forecasting layer (additive, never blocking)
- Multi-state / multi-language expansion
- Payment gateway integration for actual settlement
- Logistics/transport matching
- Credit-scoring / KCC (Kisan Credit Card) integration
- Satellite/remote-sensing crop health inputs

---

## 2. Complete User Journeys

### 2.1 Farmer Journey (WhatsApp)

```
Farmer sends "Hi" on WhatsApp
  → Webhook receives message → identify by phone number
  → New user? → LANGUAGE_SELECTION (interactive list: Marathi/Hindi/English)
  → LOCATION (share location pin OR type village/taluka/district)
  → Farmer profile created/updated (FarmerProfile: location, preferred language)
  → Main menu (interactive buttons):
      1) Crop Advisory   2) Market Price   3) My Transactions
  → [Crop Advisory] → CROP_SELECTION (list of crops relevant to season+location)
      → Recommendation Engine invoked (rules) → Advisory + score + reason sent back
  → [Market Price] → nearest Mandi resolved from FarmerProfile.location
      → latest MandiPrice (from Redis cache, fallback Postgres) returned
  → After advisory, bot asks: "Do you have produce ready to sell?"
      → Yes → quantity + expected price + harvest date collected (QUERY state)
      → Matching Engine invoked → top 3 Buyer/FPO candidates shown
      → Farmer selects one → TRANSACTION_CONFIRMATION
      → Transaction created (REQUESTED) → Buyer notified (WhatsApp/dashboard/email)
  → Farmer can ask "status" anytime → current Transaction state returned
```

**Frontend/channel:** WhatsApp Cloud API interactive messages (buttons/lists), voice fallback via Twilio IVR + speech-to-text for feature phones.
**API calls:** `POST /whatsapp/webhook` (single ingress), which internally dispatches to `AdvisoryService`, `MarketService`, `MatchingService`, `TransactionService`.
**Business logic:** conversation state machine (Section 10), recommendation engine (Section 12), matching engine (Section 16).
**DB operations:** upsert `User`/`FarmerProfile`, insert `Conversation`/`Message`, insert `Advisory`, insert `Match`, insert `Transaction` + `TransactionStatusHistory`.
**Background jobs:** none synchronous on this path except notification dispatch (queued), to keep webhook response time low (WhatsApp expects a fast 200 OK).
**Notifications:** buyer notified via dashboard push/email/WhatsApp (if buyer opted in) through `notifications` queue.
**Failure cases:** unrecognized input → re-prompt with same state (never dead-end); webhook timeout → WhatsApp retries, idempotency key prevents duplicate processing; no buyers matched → farmer gets an honest "no match yet, we'll notify you" message and an `Advisory`-only outcome is still logged.

### 2.2 Buyer Journey (Dashboard)

```
Buyer → Login (email/password) → Dashboard
  → Post/Update Buyer Requirement (crop, quantity, price range, quality, location radius)
  → Sees Matched Transaction Requests (from farmers) in "Incoming Requests" tab
  → Opens a request → sees farmer profile (crop, quantity, expected price, location, distance)
  → Accept → Transaction moves ACCEPTED → farmer notified via WhatsApp
  → Reject → Transaction moves REJECTED with optional reason → farmer notified, re-matched automatically
  → Tracks all transactions in "My Transactions" with status timeline
```

**API calls:** `POST /buyers/requirements`, `GET /transactions?role=buyer`, `PATCH /transactions/:id/accept`, `PATCH /transactions/:id/reject`.
**Business logic:** on requirement creation, `MatchingService` proactively scans open farmer `Advisory`/sell-intent records for fit and creates candidate `Match` rows.
**DB operations:** insert/update `BuyerRequirement`, update `Transaction` + append `TransactionStatusHistory`.
**Background jobs:** matching re-scan queued on new requirement; notification queued on accept/reject.
**Failure cases:** concurrent accept by two buyers on the same farmer request → handled with a DB-level row lock + transaction (Section 38); stale requirement (expired) auto-excluded from matching.

### 2.3 FPO Journey (Dashboard)

```
FPO Admin → Login → Dashboard
  → Farmers tab: list of member farmers, their recent advisories & sell-intents
  → Demand tab: aggregated buyer requirements relevant to member crops
  → Matching tab: FPO can act as an aggregator — bundle multiple farmers' small quantities
     into one larger Transaction offered to a buyer
  → Transaction Monitoring: tracks all transactions involving its member farmers
```

**API calls:** `GET /fpo/:id/farmers`, `GET /fpo/:id/demand`, `POST /fpo/:id/bundle-transaction`.
**Business logic:** an FPO-bundled transaction is modeled as one `Transaction` with multiple `TransactionLineItem`-style farmer contributions (kept optional/simple for MVP — see Section 6 notes).
**Failure cases:** if one farmer in a bundle withdraws, the bundle transaction quantity is recalculated and buyer is notified of the change.

### 2.4 Government / Admin Journey (Dashboard)

```
Admin → Login → Dashboard
  → Overview: total farmers reached, advisories given, active transactions, GMV-equivalent closed
  → Drill into any district/taluka for adoption heatmap
  → Data pipeline health (price ingestion, weather ingestion status)
  → Export reports (CSV/PDF) for review meetings
```

**API calls:** `GET /admin/overview`, `GET /admin/analytics`, `GET /admin/system-health`.
**Business logic:** all read-only aggregation queries, heavily cached (Redis, 5–15 min TTL) since this is a dashboard, not a real-time trading terminal.
**Failure cases:** analytics queries never touch hot transactional tables directly in a way that could lock them — read from indexed aggregate views.

---

## 3. System Architecture

```
                                   ┌─────────────────────────┐
                                   │        Farmer            │
                                   └────────────┬─────────────┘
                                                │
                          ┌─────────────────────┼─────────────────────┐
                          │                     │                     │
                    WhatsApp Cloud API    Twilio Voice (fallback)     │
                          │                     │                     │
                          └─────────┬───────────┘                     │
                                    ▼                                 │
                     ┌───────────────────────────┐                    │
                     │   Webhook Ingress (API)    │                    │
                     │  verify + dedupe + parse   │                    │
                     └─────────────┬─────────────┘                    │
                                   ▼                                   │
                     ┌───────────────────────────┐         ┌──────────▼─────────┐
                     │   API Layer (Express)      │◄────────┤   Admin/FPO/Buyer   │
                     │  Auth, Controllers, Routes │         │   React Dashboard   │
                     └─────────────┬─────────────┘         └────────────────────┘
                                   ▼
                     ┌───────────────────────────┐
                     │     Business Services      │
                     │  Advisory / Market / Auth  │
                     └─────────────┬─────────────┘
                          ┌────────┴─────────┐
                          ▼                  ▼
             ┌─────────────────────┐  ┌──────────────────────┐
             │ Recommendation Eng.  │  │   Matching Engine      │
             │  (rules + optional   │  │ (weighted scoring)     │
             │      ML layer)       │  └───────────┬───────────┘
             └──────────┬──────────┘               ▼
                        │                 ┌──────────────────────┐
                        │                 │   Transaction System   │
                        │                 │ state machine + audit  │
                        │                 └───────────┬───────────┘
                        └────────────┬──────────────────┘
                                     ▼
                        ┌─────────────────────────┐
                        │       PostgreSQL          │   ◄── source of truth
                        └─────────────┬─────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              ▼                       ▼                       ▼
    ┌──────────────────┐   ┌──────────────────┐   ┌───────────────────────┐
    │       Redis        │   │      BullMQ        │   │   Workers (Node)       │
    │ cache/rate-limit/   │◄──┤  queues:            │──►│ price-ingest, weather-  │
    │ conversation state  │   │  price, weather,    │   │ ingest, matching,       │
    └──────────────────┘   │  matching, notify   │   │ notifications, whatsapp │
                            └──────────────────┘   └───────────┬───────────┘
                                                                 ▼
                                                    ┌───────────────────────┐
                                                    │   External Data APIs    │
                                                    │ data.gov.in mandi, IMD   │
                                                    │ weather, WhatsApp Cloud  │
                                                    └───────────────────────┘
```

**Component rationale:**
- **Webhook Ingress** is deliberately thin — verify signature, dedupe by message ID, enqueue heavy work, return 200 fast (WhatsApp times out and retries otherwise).
- **Business Services** hold all domain logic so both the WhatsApp channel and the future web/app channel reuse identical logic — no duplicated business rules per channel.
- **Recommendation** and **Matching** are separate engines because they answer different questions ("what should you grow" vs "who should you sell to") and can be tested/tuned independently.
- **PostgreSQL is the single source of truth.** Redis never holds anything that isn't reconstructable from Postgres.
- **Workers** are a separate Node process from the API so a slow ingestion job never blocks farmer-facing request latency.

---

## 4. Architecture Decisions

| Decision | Reasoning |
|---|---|
| **PostgreSQL over MongoDB** | The domain is inherently relational — farmers, buyers, transactions, matches all have strong foreign-key relationships and need multi-table transactional integrity (e.g., accepting a transaction must atomically update `Transaction` + insert `TransactionStatusHistory` + decrement buyer capacity). MongoDB's document model adds no benefit here and loses ACID guarantees across these writes. |
| **Prisma over raw SQL/TypeORM** | Type-safe query building matches the TypeScript-first stack, excellent migration tooling for a fast-moving 6-week build, and its generated types eliminate an entire class of bugs when the schema changes mid-hackathon. |
| **Redis** | Used strictly for cache (mandi price latest-lookup, weather latest-lookup), BullMQ's backing store, and rate limiting. Never the source of truth. |
| **BullMQ** | Node-native, Redis-backed, battle-tested for exactly the ingestion + notification workloads here; avoids introducing Kafka/RabbitMQ, which would be overkill at this scale. |
| **Node.js/Express** | Team's existing skill set (per proposed stack), mature ecosystem for WhatsApp SDKs, Prisma, BullMQ. |
| **TypeScript strict mode** | Non-negotiable at this domain complexity — transaction states, role-based access, and multi-table joins are exactly where `any`-typed JS produces production bugs. |
| **React + Vite + Tailwind** | Fast dev server, minimal config overhead, matches team's proposed stack, no need for Next.js SSR since this is an authenticated internal dashboard, not a public SEO surface. |
| **Rules-first recommendation** | Explainability is a **hard SIH judging requirement** for a government agri-tech pitch — "the model said so" is not acceptable to a farmer or a judge. Rules also work with zero training data on day one. |
| **Where ML belongs** | Strictly additive: price-trend forecasting and crop demand ranking, exposed as an optional signal that *adjusts* rule-based scores, never replaces them (Section 13). |
| **Why not microservices** | At this scope (6 weeks, 4 developers, single hackathon deployment target), microservices add deployment/ops overhead with zero benefit — no independent scaling need yet, no independently-owned team boundaries. |
| **Why modular monolith** | Gives clean internal boundaries (`modules/farmers`, `modules/transactions`, etc.) that *could* later be extracted into services, while keeping one deployable unit, one database connection pool, one CI pipeline — dramatically faster to build and demo correctly. |

**MVP architecture vs future-scale architecture**

| Concern | MVP (SIH) | Future Scale |
|---|---|---|
| Deployment | Single API instance + single worker instance | Horizontally scaled API behind load balancer, dedicated worker pools per queue |
| Database | Single PostgreSQL instance (managed) | Read replicas, partitioned `MandiPrice`/`WeatherData` tables by date |
| Matching | Synchronous-ish scoring on small candidate sets | Precomputed candidate indexes, geo-spatial indexing (PostGIS) |
| ML | None or a single lightweight regression | Dedicated model-serving layer, feature store |
| Languages | Marathi + English | Full multi-state regional language matrix |
| Messaging | WhatsApp Cloud API direct | Dedicated messaging gateway abstraction supporting SMS/IVR/App push uniformly |

---

## 5. Repository / Monorepo Structure

```
kisan-setu/
├── apps/
│   ├── api/                     # Express + TypeScript backend
│   ├── worker/                  # BullMQ worker processes (separate deploy target)
│   └── dashboard/                # React + Vite + Tailwind frontend
├── packages/
│   ├── shared/                   # cross-cutting utils (date/number formatting, constants)
│   ├── types/                    # shared TS types/DTOs between api/worker/dashboard
│   └── config/                   # shared env schema (zod), shared eslint/tsconfig base
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── docker-compose.yml
├── .github/workflows/ci.yml
├── package.json                  # workspaces root (npm/pnpm workspaces)
└── README.md
```

### `apps/api/src/` (detailed)

```
src/
├── config/            # env loading + validation (zod), constants, feature flags
├── modules/
│   ├── auth/          # controllers, services, routes, validators — one module per domain
│   ├── farmers/
│   ├── buyers/
│   ├── fpo/
│   ├── crops/
│   ├── weather/
│   ├── market/
│   ├── recommendation/
│   ├── matching/
│   ├── transactions/
│   ├── whatsapp/
│   ├── notifications/
│   └── admin/
│       └── each module contains:
│           ├── *.controller.ts   # HTTP layer only — parses req, calls service, returns res
│           ├── *.service.ts      # business logic
│           ├── *.repository.ts   # Prisma queries isolated here
│           ├── *.routes.ts
│           ├── *.validator.ts    # zod schemas for this module's inputs
│           └── *.types.ts
├── shared/
│   ├── middleware/    # auth, error handler, rate limiter, request-id, role-guard
│   ├── errors/        # AppError + subclasses
│   ├── logger/        # pino instance + child logger factory
│   └── utils/
├── infra/
│   ├── prisma.ts       # single PrismaClient instance
│   ├── redis.ts        # single Redis connection
│   └── queues/         # BullMQ queue definitions (producers only; workers live in apps/worker)
├── integrations/
│   ├── whatsapp/       # Cloud API client wrapper
│   ├── twilio/
│   ├── mandi/          # data.gov.in client
│   └── weather/        # IMD/weather client
├── app.ts              # express app assembly (middleware, routes) — NO app.listen()
└── index.ts            # imports app, calls app.listen(), handles graceful shutdown
```

**Why this split:** `app.ts`/`index.ts` separation makes the app importable in integration tests without binding a port (a pattern the team has already used per prior Supertest work). `repository.ts` isolating Prisma calls means services can be unit-tested with a mocked repository instead of a real DB.

### `apps/worker/src/`

```
src/
├── queues/            # queue *definitions* mirrored/shared from api via packages/types
├── jobs/
│   ├── price-ingestion.job.ts
│   ├── weather-ingestion.job.ts
│   ├── matching.job.ts
│   ├── notification.job.ts
│   └── cleanup.job.ts
├── processors/         # the actual `async (job) => {...}` functions, unit-testable in isolation
└── index.ts             # boots all BullMQ Workers
```

### `apps/dashboard/src/`

```
src/
├── pages/              # route-level components (Overview, Farmers, Transactions, ...)
├── components/          # reusable UI
├── features/            # feature-sliced: auth/, transactions/, matching/, analytics/
├── api/                 # typed API client (fetch wrapper + React Query hooks)
├── routes/               # route config + ProtectedRoute
├── store/                 # auth/session state (lightweight, e.g. Zustand)
└── main.tsx
```

---

## 6. Database Architecture

### 6.1 Reasoning Before Tables

- **User vs Profile split**: `User` holds only auth-relevant fields (phone/email, password hash, role). Role-specific data (`FarmerProfile`, `Buyer`, `FPO`) lives in separate tables 1:1 with `User`, avoiding a wide, mostly-null "god table."
- **Every transactional entity gets `createdAt`/`updatedAt`.** `Transaction` additionally gets full history via `TransactionStatusHistory` rather than mutating a single status column silently — auditability is a government-project requirement, not a nice-to-have.
- **Soft deletion** (`deletedAt`) is used only where accidental hard-deletes would be costly and where "undo" matters: `User`, `BuyerRequirement`, `Transaction`. Reference/lookup tables (`Crop`, `Mandi`) are hard-delete-safe since they're admin-managed and rarely removed.
- **Mandi price and weather data are append-only time series** — never updated in place, always inserted with a timestamp, so historical trend queries (and future ML training) stay correct.
- **Composite uniqueness**: e.g. `MandiPrice` unique on `(mandiId, cropId, priceDate)` prevents duplicate ingestion; `Match` unique on `(farmerRequestId, buyerId)` prevents duplicate match rows on re-scans.
- **Indexes** are added on every foreign key plus every column used in hot lookup paths (`FarmerProfile.districtId`, `MandiPrice.priceDate`, `Transaction.status`).

### 6.2 Entity-Relationship Diagram (Mermaid)

```mermaid
erDiagram
    USER ||--o| FARMER_PROFILE : has
    USER ||--o| BUYER : has
    USER ||--o| FPO : has
    FPO ||--o{ FPO_MEMBERSHIP : has
    FARMER_PROFILE ||--o{ FPO_MEMBERSHIP : joins
    FARMER_PROFILE }o--|| DISTRICT : located_in
    FARMER_PROFILE ||--o{ ADVISORY : receives
    FARMER_PROFILE ||--o{ SELL_INTENT : creates
    CROP ||--o{ CROP_SEASON : has
    CROP ||--o{ ADVISORY : subject_of
    CROP ||--o{ MANDI_PRICE : priced_in
    CROP ||--o{ SELL_INTENT : concerns
    MANDI ||--o{ MANDI_PRICE : reports
    MANDI }o--|| DISTRICT : located_in
    DISTRICT ||--o{ WEATHER_DATA : has
    BUYER ||--o{ BUYER_REQUIREMENT : posts
    SELL_INTENT ||--o{ MATCH : generates
    BUYER_REQUIREMENT ||--o{ MATCH : generates
    MATCH ||--o| TRANSACTION : becomes
    TRANSACTION ||--o{ TRANSACTION_STATUS_HISTORY : logs
    USER ||--o{ CONVERSATION : participates
    CONVERSATION ||--o{ MESSAGE : contains
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ AUDIT_LOG : triggers
```

*(Note: `SELL_INTENT` is introduced as the clean name for "farmer wants to sell X quantity of crop Y" — the brief calls this a general "buyer requirement"-symmetric concept on the farmer side; naming it explicitly avoids overloading `Advisory`.)*

---

## 7. Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  FARMER
  BUYER
  FPO
  ADMIN
  GOVERNMENT_EVALUATOR
}

enum Language {
  MARATHI
  HINDI
  ENGLISH
}

enum TransactionStatus {
  REQUESTED
  MATCHED
  PENDING_BUYER
  ACCEPTED
  REJECTED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model User {
  id            String    @id @default(cuid())
  phone         String    @unique
  email         String?   @unique
  passwordHash  String?
  role          Role
  preferredLang Language  @default(MARATHI)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?

  farmerProfile FarmerProfile?
  buyer         Buyer?
  fpo           FPO?
  conversations Conversation[]
  notifications Notification[]
  auditLogs     AuditLog[]

  @@index([role])
}

model District {
  id        String  @id @default(cuid())
  name      String
  state     String  @default("Maharashtra")
  farmers   FarmerProfile[]
  mandis    Mandi[]
  weather   WeatherData[]

  @@unique([name, state])
}

model FarmerProfile {
  id            String    @id @default(cuid())
  userId        String    @unique
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  fullName      String?
  districtId    String
  district      District  @relation(fields: [districtId], references: [id])
  taluka        String?
  village       String?
  latitude      Float?
  longitude     Float?
  landSizeAcres Float?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  fpoMemberships FPOMembership[]
  advisories     Advisory[]
  sellIntents    SellIntent[]

  @@index([districtId])
}

model FPO {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  regNumber String?  @unique
  createdAt DateTime @default(now())

  memberships FPOMembership[]
}

model FPOMembership {
  id          String        @id @default(cuid())
  fpoId       String
  fpo         FPO           @relation(fields: [fpoId], references: [id], onDelete: Cascade)
  farmerId    String
  farmer      FarmerProfile @relation(fields: [farmerId], references: [id], onDelete: Cascade)
  joinedAt    DateTime      @default(now())

  @@unique([fpoId, farmerId])
}

model Buyer {
  id           String   @id @default(cuid())
  userId       String   @unique
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  companyName  String
  buyerType    String   // e.g. "TRADER", "PROCESSOR", "RETAILER"
  createdAt    DateTime @default(now())

  requirements BuyerRequirement[]
}

model Crop {
  id        String   @id @default(cuid())
  name      String   @unique
  category  String?  // cereal, pulse, vegetable, cash-crop
  waterReq  String?  // LOW / MEDIUM / HIGH — used by recommendation rules
  seasons   CropSeason[]
  advisories Advisory[]
  prices    MandiPrice[]
  sellIntents SellIntent[]
  requirements BuyerRequirement[]
}

model CropSeason {
  id        String  @id @default(cuid())
  cropId    String
  crop      Crop    @relation(fields: [cropId], references: [id], onDelete: Cascade)
  season    String  // KHARIF / RABI / ZAID
  sowStart  Int     // month number
  sowEnd    Int
  harvestStart Int
  harvestEnd   Int

  @@unique([cropId, season])
}

model Mandi {
  id         String   @id @default(cuid())
  name       String
  districtId String
  district   District @relation(fields: [districtId], references: [id])
  latitude   Float?
  longitude  Float?

  prices MandiPrice[]

  @@index([districtId])
}

model MandiPrice {
  id         String   @id @default(cuid())
  mandiId    String
  mandi      Mandi    @relation(fields: [mandiId], references: [id])
  cropId     String
  crop       Crop     @relation(fields: [cropId], references: [id])
  minPrice   Float
  maxPrice   Float
  modalPrice Float
  priceDate  DateTime
  sourceRef  String?  // raw record id from data.gov.in, for traceability
  createdAt  DateTime @default(now())

  @@unique([mandiId, cropId, priceDate])
  @@index([cropId, priceDate])
}

model WeatherData {
  id          String   @id @default(cuid())
  districtId  String
  district    District @relation(fields: [districtId], references: [id])
  date        DateTime
  tempMinC    Float?
  tempMaxC    Float?
  rainfallMm  Float?
  humidity    Float?
  forecast    Boolean  @default(false) // true = forecast, false = observed
  createdAt   DateTime @default(now())

  @@unique([districtId, date, forecast])
  @@index([districtId, date])
}

model Advisory {
  id             String   @id @default(cuid())
  farmerId       String
  farmer         FarmerProfile @relation(fields: [farmerId], references: [id])
  cropId         String
  crop           Crop     @relation(fields: [cropId], references: [id])
  suitabilityScore Float
  reason         String   @db.Text   // human-readable explanation
  ruleTrace      Json     // structured list of rules fired, for debugging/demo transparency
  createdAt      DateTime @default(now())

  @@index([farmerId, createdAt])
}

model SellIntent {
  id             String   @id @default(cuid())
  farmerId       String
  farmer         FarmerProfile @relation(fields: [farmerId], references: [id])
  cropId         String
  crop           Crop     @relation(fields: [cropId], references: [id])
  quantityKg     Float
  expectedPrice  Float?
  harvestDate    DateTime?
  status         String   @default("OPEN") // OPEN / MATCHED / CLOSED / EXPIRED
  createdAt      DateTime @default(now())

  matches Match[]

  @@index([status, cropId])
}

model BuyerRequirement {
  id            String   @id @default(cuid())
  buyerId       String
  buyer         Buyer    @relation(fields: [buyerId], references: [id])
  cropId        String
  crop          Crop     @relation(fields: [cropId], references: [id])
  quantityKg    Float
  maxPrice      Float?
  minQuality    String?
  districtId    String?
  radiusKm      Float?
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  deletedAt     DateTime?

  matches Match[]

  @@index([cropId, isActive])
}

model Match {
  id                 String   @id @default(cuid())
  sellIntentId       String
  sellIntent         SellIntent @relation(fields: [sellIntentId], references: [id])
  buyerRequirementId String
  buyerRequirement   BuyerRequirement @relation(fields: [buyerRequirementId], references: [id])
  score              Float
  scoreBreakdown     Json     // per-factor contribution, for explainability
  createdAt          DateTime @default(now())

  transaction Transaction?

  @@unique([sellIntentId, buyerRequirementId])
  @@index([score])
}

model Transaction {
  id             String            @id @default(cuid())
  matchId        String            @unique
  match          Match             @relation(fields: [matchId], references: [id])
  status         TransactionStatus @default(REQUESTED)
  quantityKg     Float
  agreedPrice    Float?
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt
  deletedAt      DateTime?

  history TransactionStatusHistory[]

  @@index([status])
}

model TransactionStatusHistory {
  id            String            @id @default(cuid())
  transactionId String
  transaction   Transaction       @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  fromStatus    TransactionStatus?
  toStatus      TransactionStatus
  changedBy     String?           // userId
  note          String?
  createdAt     DateTime          @default(now())

  @@index([transactionId, createdAt])
}

model Conversation {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  channel   String   // WHATSAPP / VOICE
  state     String   // current conversation state machine node
  context   Json     // partial data collected so far (crop, location draft, etc.)
  updatedAt DateTime @updatedAt
  createdAt DateTime @default(now())

  messages Message[]

  @@index([userId])
}

model Message {
  id              String   @id @default(cuid())
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  direction       String   // INBOUND / OUTBOUND
  externalMsgId   String?  @unique  // WhatsApp message id — idempotency key
  content         String   @db.Text
  createdAt       DateTime @default(now())

  @@index([conversationId, createdAt])
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  channel   String   // WHATSAPP / EMAIL / DASHBOARD
  title     String
  body      String
  status    String   @default("PENDING") // PENDING / SENT / FAILED
  createdAt DateTime @default(now())

  @@index([userId, status])
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  action    String
  entity    String
  entityId  String
  metadata  Json?
  createdAt DateTime @default(now())

  @@index([entity, entityId])
}

model DataIngestionJob {
  id         String   @id @default(cuid())
  jobType    String   // PRICE / WEATHER
  status     String   // SUCCESS / FAILED / PARTIAL
  recordsIn  Int      @default(0)
  recordsOk  Int      @default(0)
  error      String?
  startedAt  DateTime @default(now())
  finishedAt DateTime?
}
```

**Key schema decisions to call out to teammates:**
- `onDelete: Cascade` is used only for strictly-owned child rows (a `User`'s `FarmerProfile`, a `Transaction`'s history). Everything referencing shared lookup data (`Crop`, `Mandi`, `District`) uses default `Restrict` so you can never accidentally delete a crop that has 10,000 historical prices attached.
- `ruleTrace`/`scoreBreakdown` as `Json` columns are what make Sections 12 and 16's "explainability" promise real and queryable, not just a runtime log line.
- `Match` unique on `(sellIntentId, buyerRequirementId)` — re-running the matching job is always idempotent.

---

## 8. API Architecture

Base path: `/api/v1`. All authenticated routes require `Authorization: Bearer <accessToken>`.

### Auth
| Method | URL | Purpose | Auth | Role |
|---|---|---|---|---|
| POST | `/auth/register` | Create Buyer/FPO/Admin account | No | — |
| POST | `/auth/login` | Login, returns access+refresh token | No | — |
| POST | `/auth/refresh` | Rotate refresh token | Refresh cookie | — |
| POST | `/auth/logout` | Revoke refresh token | Yes | Any |

### Farmers *(mostly internal, driven by WhatsApp module; dashboard-visible read-only for FPO/Admin)*
| Method | URL | Purpose | Auth | Role |
|---|---|---|---|---|
| GET | `/farmers/:id` | Get farmer profile | Yes | FPO, ADMIN |
| GET | `/farmers/:id/advisories` | Advisory history | Yes | FPO, ADMIN, self |
| GET | `/farmers/:id/sell-intents` | Sell intent history | Yes | FPO, ADMIN, self |

### Buyers
| Method | URL | Purpose | Auth | Role |
|---|---|---|---|---|
| POST | `/buyers/requirements` | Post a new requirement | Yes | BUYER |
| GET | `/buyers/requirements` | List own requirements | Yes | BUYER |
| PATCH | `/buyers/requirements/:id` | Update/deactivate | Yes | BUYER (owner) |

### FPO
| Method | URL | Purpose | Auth | Role |
|---|---|---|---|---|
| GET | `/fpo/:id/farmers` | Member farmers | Yes | FPO (owner), ADMIN |
| GET | `/fpo/:id/demand` | Relevant buyer demand | Yes | FPO (owner) |
| POST | `/fpo/:id/bundle-transaction` | Create bundled transaction | Yes | FPO (owner) |

### Crops
| Method | URL | Purpose | Auth | Role |
|---|---|---|---|---|
| GET | `/crops` | List crops (+season filter) | No | — |
| GET | `/crops/:id/seasons` | Season windows for crop | No | — |

### Weather
| Method | URL | Purpose | Auth | Role |
|---|---|---|---|---|
| GET | `/weather/:districtId/latest` | Latest observed+forecast | No | — |
| GET | `/weather/:districtId/history` | Historical series | Yes | ADMIN |

### Market Prices
| Method | URL | Purpose | Auth | Role |
|---|---|---|---|---|
| GET | `/market/prices/latest?cropId&districtId` | Latest modal price | No | — |
| GET | `/market/prices/history?cropId&mandiId` | Trend series | Yes | ADMIN |

### Recommendations
| Method | URL | Purpose | Auth | Role |
|---|---|---|---|---|
| POST | `/recommendations` | Generate advisory for farmer+crop context | Yes (internal/service) | FARMER (via WhatsApp module) |
| GET | `/recommendations/:farmerId/latest` | Latest advisory | Yes | self, FPO, ADMIN |

### Matching
| Method | URL | Purpose | Auth | Role |
|---|---|---|---|---|
| POST | `/matching/run` | Trigger match scan for a sell-intent | Internal | system |
| GET | `/matching/:sellIntentId/candidates` | View match candidates | Yes | FARMER (self), ADMIN |

### Transactions
| Method | URL | Purpose | Auth | Role |
|---|---|---|---|---|
| POST | `/transactions` | Create from a chosen match | Yes | FARMER |
| GET | `/transactions?role=buyer\|farmer\|fpo` | List relevant transactions | Yes | Any owner |
| GET | `/transactions/:id` | Detail + history | Yes | participant, ADMIN |
| PATCH | `/transactions/:id/accept` | Buyer accepts | Yes | BUYER (owner) |
| PATCH | `/transactions/:id/reject` | Buyer rejects | Yes | BUYER (owner) |
| PATCH | `/transactions/:id/complete` | Mark completed | Yes | BUYER or FARMER |
| PATCH | `/transactions/:id/cancel` | Cancel | Yes | FARMER (owner), ADMIN |

### WhatsApp
| Method | URL | Purpose | Auth | Role |
|---|---|---|---|---|
| GET | `/whatsapp/webhook` | Meta verification handshake | Meta secret token | — |
| POST | `/whatsapp/webhook` | Inbound message ingress | Meta signature | — |

### Notifications
| Method | URL | Purpose | Auth | Role |
|---|---|---|---|---|
| GET | `/notifications` | List own notifications | Yes | Any |
| PATCH | `/notifications/:id/read` | Mark read | Yes | Any (owner) |

### Admin
| Method | URL | Purpose | Auth | Role |
|---|---|---|---|---|
| GET | `/admin/overview` | KPIs | Yes | ADMIN, GOVERNMENT_EVALUATOR |
| GET | `/admin/analytics?district&dateRange` | Drilldown analytics | Yes | ADMIN, GOVERNMENT_EVALUATOR |
| GET | `/admin/system-health` | Ingestion job status, queue depth | Yes | ADMIN |

**Example — Create Transaction**

`POST /transactions`
```json
// Request
{ "matchId": "clx1234match", "quantityKg": 500, "agreedPrice": 2100 }
```
```json
// Response 201
{
  "id": "clxTxn001",
  "status": "REQUESTED",
  "quantityKg": 500,
  "agreedPrice": 2100,
  "match": { "id": "clx1234match", "score": 0.82 },
  "createdAt": "2026-08-24T10:00:00.000Z"
}
```
```json
// Error 409 — match already has a transaction
{ "error": { "code": "MATCH_ALREADY_CONVERTED", "message": "This match already has a transaction." } }
```

---

## 9. Authentication + Authorization

**Flow:**
```
Register → bcrypt hash password (cost 12) → User row created (role fixed at registration)
Login → verify bcrypt hash → issue:
   accessToken  (JWT, 15 min, HS256, payload: {userId, role})
   refreshToken (JWT, 7 days, stored hashed in DB or Redis, httpOnly secure cookie)
Every protected request → authMiddleware verifies accessToken → attaches req.user
Access token expired → client calls /auth/refresh with refresh cookie
   → verify refresh token against stored hash → rotate: issue new pair, invalidate old refresh token
Logout → delete/blacklist refresh token record
```

**Roles:** `FARMER, BUYER, FPO, ADMIN, GOVERNMENT_EVALUATOR`. Farmers never log in with a password — their identity is their verified WhatsApp phone number; a `FARMER`-role `User` row is created transparently on first WhatsApp contact with no password set (`passwordHash = null`), and farmer-facing dashboard access (if ever added) would use OTP-over-WhatsApp, not passwords.

**Middleware:**
```ts
// shared/middleware/auth.ts
export function requireAuth(req, res, next) {
  const token = extractBearer(req);
  if (!token) throw new UnauthorizedError();
  req.user = verifyAccessToken(token); // throws on invalid/expired
  next();
}

export function requireRole(...roles: Role[]) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) throw new ForbiddenError();
    next();
  };
}
```

**Refresh token rotation** prevents replay: every refresh issues a brand-new refresh token and invalidates the previous one; reuse of an already-rotated token revokes the entire session family (standard rotation-detection pattern).

---

## 10. WhatsApp System

**Message flow:**
```
Inbound WhatsApp message
  → POST /whatsapp/webhook
  → verify X-Hub-Signature-256 against app secret
  → check externalMsgId against Message table (idempotency) — if seen, return 200 immediately, no reprocessing
  → resolve/create User by phone number
  → load or create Conversation (state machine)
  → detect language (from Conversation.context, defaulting on new users to a language-picker state)
  → lightweight intent detection (keyword/button-payload based, not NLP for MVP)
  → dispatch to BusinessService based on (state, intent)
  → service returns a response payload (text/buttons/list)
  → enqueue outbound message job (whatsapp queue) — decouples send latency from webhook response
  → persist inbound+outbound Message rows
  → return 200 OK to Meta immediately after enqueue (never wait on the outbound send)
```

**Conversation states:**
```
START → LANGUAGE_SELECTION → LOCATION → MAIN_MENU
MAIN_MENU → CROP_SELECTION → ADVISORY → (offer) → QUERY (sell intent capture)
QUERY → BUYER_MATCH → TRANSACTION_CONFIRMATION → TRANSACTION_CREATED → MAIN_MENU
MAIN_MENU → PRICE (market price lookup) → MAIN_MENU
Any state → "status"/"help" keyword → short-circuits to a status/help handler without losing context
```

State is persisted in `Conversation.state` + `Conversation.context` (Postgres), **not** only in Redis — so a server restart or worker crash never loses a farmer's mid-conversation progress. Redis is used only as a short-TTL read cache for the *current* conversation object to avoid a DB round-trip on every single incoming message.

**Reliability concerns:**
- **Duplicate webhooks:** Meta may redeliver; `Message.externalMsgId` is unique — a duplicate insert is caught and short-circuited.
- **Idempotency:** every state transition is derived purely from `(currentState, inboundPayload)` — replaying the same inbound message with the same current state produces the same next state, so even a partial-failure retry is safe.
- **Retries:** outbound sends use BullMQ's built-in retry with exponential backoff (3 attempts) before marking `Notification.status = FAILED`.
- **Message ordering:** WhatsApp does not guarantee ordering under retry; the webhook handler processes strictly one message per `Conversation` at a time using a short Redis lock keyed by `conversationId` to prevent race conditions from rapid double-taps.
- **Rate limits:** outbound send queue respects Meta's per-number rate limit via BullMQ rate limiter config (`limiter: { max, duration }`).
- **Webhook security:** signature verification is mandatory before any parsing; verification failures are logged to `AuditLog` and rejected with 401.

---

## 11. Regional Language Architecture

Kept intentionally simple for MVP, extensible by design:

- **Language selection** is the very first conversation state; stored on `User.preferredLang`.
- **Static translations**: all bot-authored copy (menus, prompts, confirmations) lives in JSON translation files (`locales/mr.json`, `locales/hi.json`, `locales/en.json`) keyed by message ID — a simple `t(key, lang)` lookup, no external translation service dependency for MVP (zero runtime cost, zero external API risk during a live demo).
- **Dynamic content** (crop names, mandi names, advisory reasons) is translated via a small curated dictionary table for the ~30–50 agricultural terms actually needed (crop names, units, common phrases) rather than a general-purpose MT API — this keeps agricultural terminology *correct* (a general translator often mistranslates crop/agri jargon) and keeps the demo offline-safe.
- **Intent recognition** works on the *button/list payload values* WhatsApp returns (language-independent IDs), not on free-text NLP — sidesteps needing a language-aware NLU model entirely for the structured parts of the flow. Free-text fallback (e.g., typed crop name) does simple fuzzy-matching against the `Crop` table's known names/aliases per language.
- **Voice**: Twilio IVR converts speech→text (Twilio's built-in STT, language param set to `mr-IN`), reuses the exact same state machine and intent handling as text, and converts the response text→speech (Twilio `<Say>` with `mr-IN` voice) — no separate business logic path for voice.
- **Fallback language**: if detection/selection ever fails, default to Marathi (primary target audience), never silently fall back to English, which would defeat the purpose.
- **Numbers/dates/currency**: formatted with `Intl.NumberFormat('mr-IN', { style: 'currency', currency: 'INR' })` equivalents so ₹ amounts and Devanagari numerals (if desired) render correctly.

---

## 12. Recommendation Engine

**Architecture:**
```
Input (farmerId, districtId, season, optional cropId filter)
  → Validation (zod: districtId exists, season is one of enum)
  → Feature extraction:
      - latest WeatherData (rainfall, temp) for district
      - CropSeason windows matching current month
      - latest MandiPrice trend (last 30 days) per candidate crop
      - FarmerProfile.landSizeAcres (for scale-appropriateness, optional)
  → Rules engine: each candidate crop scored 0–100 by summing weighted rule contributions
  → Scoring: normalize, rank top N
  → Recommendation: top crop(s) + suitabilityScore
  → Explanation: human-readable string built directly from the same rules that fired (no
    separate "explain" model — the explanation IS the audit trail of which rules matched)
```

**Example rules (illustrative, tunable via a config table/JSON, not hardcoded magic numbers scattered in code):**

```
RULE: low_rainfall_high_water_crop
  IF district.rainfall_last_30d < 50mm
  AND crop.waterReq == HIGH
  THEN score -= 25
  REASON: "Recent rainfall in your area is low, and {crop} typically needs a lot of water."

RULE: season_match
  IF current_month BETWEEN crop.sowStart AND crop.sowEnd
  THEN score += 20
  REASON: "This is the right sowing window for {crop} in your region."

RULE: rising_price_trend
  IF crop's mandi modal price trend over last 30 days is upward (>5%)
  THEN score += 15
  REASON: "{crop} prices in your nearest mandi have been trending upward."

RULE: oversupply_signal
  IF number of open SellIntent rows for this crop in district > threshold
  THEN score -= 10
  REASON: "Several farmers nearby are already growing {crop}, which may affect prices."
```

**Pseudocode:**
```ts
function generateAdvisory(farmer: FarmerProfile, candidateCrops: Crop[]): Advisory[] {
  const weather = getLatestWeather(farmer.districtId);
  return candidateCrops.map(crop => {
    let score = 50; // neutral baseline
    const fired: RuleResult[] = [];

    for (const rule of RULES) {
      const result = rule.evaluate({ farmer, crop, weather });
      if (result.applies) {
        score += result.delta;
        fired.push(result);
      }
    }

    score = clamp(score, 0, 100);
    const reason = fired.map(r => r.reasonText).join(' ');
    return { cropId: crop.id, suitabilityScore: score, reason, ruleTrace: fired };
  }).sort((a, b) => b.suitabilityScore - a.suitabilityScore);
}
```

This is deliberately **not a black box**: `ruleTrace` is stored verbatim in the `Advisory.ruleTrace` JSON column, so both the farmer's WhatsApp message *and* the admin dashboard can show "why" — a direct answer to the most common judge question at SIH: "how do you know this recommendation is trustworthy?"

---

## 13. ML Layer

**Where ML helps (strictly additive, never load-bearing):**

| Use case | Features | Approach |
|---|---|---|
| Price trend prediction | Historical `MandiPrice.modalPrice` time series (30–90 days), seasonality | Simple linear regression or moving-average/ARIMA per crop-mandi pair |
| Demand prediction | Count of `BuyerRequirement` postings per crop over time | Rolling-window trend, same simplicity as above |
| Crop ranking refinement | Rule-engine score + predicted price trend as an extra weighted input | A small weighted blend: `finalScore = 0.8 * ruleScore + 0.2 * mlSignal` |

**Pipeline:**
```
Training data: MandiPrice history (exported/queried from Postgres)
  → Feature engineering: rolling averages, day-of-season, district
  → Train (offline, e.g. a scheduled monthly script, not real-time training)
  → Model artifact saved with a version tag (e.g. price_model_v1_2026-08.pkl or a JSON of
    regression coefficients if kept simple enough to avoid a Python microservice entirely)
  → Inference: worker loads latest versioned model at startup, exposes a pure function
    predictTrend(cropId, mandiId) -> { direction, confidencePct }
  → Evaluation: back-tested against held-out recent weeks before being marked "active"
  → Fallback: if no model is loaded, or confidence is below threshold, the ML signal
    contributes 0 to the blended score — the rules engine result is used unmodified
```

**Critical constraint restated:** the recommendation and matching engines must produce a complete, correct, explainable result with the ML layer entirely disabled. This is enforced by making `mlSignal` default to `null`/0 and never throwing if the ML module fails to load — a `try/catch` around ML inference that logs and degrades gracefully, never blocks.

---

## 14. Mandi Price Data Pipeline

```
data.gov.in Mandi Price API
  → Scheduled job (BullMQ repeatable job, e.g. every 6 hours via cron pattern)
  → 'price-ingestion' queue → Worker picks up job
  → Validation (zod: required fields present, prices are positive numbers)
  → Normalization (mandi/crop name → internal Mandi/Crop IDs via a maintained alias map,
    since government source data.gov.in naming is inconsistent across records)
  → Deduplication (upsert on unique (mandiId, cropId, priceDate) — re-ingesting the same
    day's data is always safe)
  → PostgreSQL insert (MandiPrice)
  → Redis cache update (SET latest:price:{cropId}:{mandiId} with TTL matching next
    scheduled refresh window)
  → DataIngestionJob row recorded (recordsIn, recordsOk, status)
```

**Worker pseudocode:**
```ts
export async function priceIngestionProcessor(job: Job) {
  const jobLog = await createIngestionJobRecord('PRICE');
  try {
    const raw = await mandiApiClient.fetchLatest(); // handles its own retry/backoff internally
    let ok = 0;
    for (const record of raw) {
      try {
        const { mandiId, cropId } = await resolveAliases(record.mandiName, record.cropName);
        await prisma.mandiPrice.upsert({
          where: { mandiId_cropId_priceDate: { mandiId, cropId, priceDate: record.date } },
          update: { minPrice: record.min, maxPrice: record.max, modalPrice: record.modal },
          create: { mandiId, cropId, priceDate: record.date, minPrice: record.min,
                     maxPrice: record.max, modalPrice: record.modal, sourceRef: record.id },
        });
        await redis.set(`latest:price:${cropId}:${mandiId}`, JSON.stringify(record), 'EX', 21600);
        ok++;
      } catch (e) {
        logger.warn({ record, err: e }, 'Skipping invalid price record');
      }
    }
    await completeIngestionJob(jobLog.id, { recordsIn: raw.length, recordsOk: ok, status: 'SUCCESS' });
  } catch (err) {
    await completeIngestionJob(jobLog.id, { status: 'FAILED', error: String(err) });
    throw err; // BullMQ will retry per queue's backoff config
  }
}
```

**Failure handling:** BullMQ job options: `{ attempts: 5, backoff: { type: 'exponential', delay: 5000 } }`. On repeated failure the job's error is logged and the **last successfully cached price is served** from Redis (never a hard failure surfaced to the farmer) — this doubles as the demo-failure-proofing mechanism (Section 32).

---

## 15. Weather Data Pipeline

```
IMD / chosen weather API
  → Scheduled ingestion (twice daily: early morning forecast pull + evening observed-data pull)
  → Location mapping: district centroid lat/long (seeded once, static reference data)
  → 'weather-ingestion' queue → Worker
  → Store both forecast=true (next 3–5 days) and forecast=false (observed) rows
  → Redis cache: latest:weather:{districtId} with a TTL of ~6 hours
  → On API failure: keep serving last cached/observed value; log DataIngestionJob FAILED
```

Weather reaches the recommendation engine purely via `getLatestWeather(districtId)`, which checks Redis first, falls back to the most recent Postgres row if cache misses — the recommendation engine never talks to the external API directly, keeping that dependency fully isolated to the ingestion worker.

---

## 16. Buyer/FPO Matching Engine

**Inputs & weights (configurable, not hardcoded in logic):**

| Factor | Weight |
|---|---|
| Crop compatibility (exact match required — filters, not scored) | gate |
| Location proximity (district match / distance decay) | 20% |
| Quantity fit (how well sell-intent qty fits requirement qty) | 15% |
| Price compatibility (expected vs max acceptable) | 15% |
| Quality match | 10% |
| Harvest timing fit (harvest date within buyer's need window) | 10% |
| *(remaining 30% reserved for crop-compatibility strength when partial substitutes are allowed, e.g. grade variants)* | 30% |

**Why weights must be configurable:** different SIH problem statements / pilot districts may prioritize proximity over price (e.g., perishables) versus the reverse (e.g., storable grains) — hardcoding weights in code forces a redeploy for every tuning; storing them in a `MatchConfig` table or config JSON lets an admin tune this without a code change, and lets the team A/B the weighting live during development without touching TypeScript.

**Flow:**
```
New SellIntent OR new BuyerRequirement created
  → enqueue 'buyer-matching' job with the triggering entity's id
  → Worker loads candidate opposite-side entities filtered by: same cropId, isActive/OPEN,
    same district or within radiusKm
  → For each candidate pair, compute weighted score (0–1)
  → Persist Match rows (upsert on unique pair) with scoreBreakdown JSON
  → Top candidates (score above threshold, e.g. 0.5) surfaced to farmer via WhatsApp /
    to buyer via dashboard
```

**Scoring pseudocode:**
```ts
function scoreMatch(intent: SellIntent, req: BuyerRequirement): MatchScoreResult {
  if (intent.cropId !== req.cropId) return { score: 0, breakdown: {} };

  const locationScore = computeLocationScore(intent.farmer.districtId, req.districtId, req.radiusKm);
  const quantityScore = 1 - Math.min(Math.abs(intent.quantityKg - req.quantityKg) / req.quantityKg, 1);
  const priceScore = req.maxPrice ? clamp(1 - (intent.expectedPrice - req.maxPrice) / req.maxPrice, 0, 1) : 0.5;
  const qualityScore = intent.quality === req.minQuality ? 1 : 0.5; // simple MVP heuristic
  const timingScore = computeTimingFit(intent.harvestDate, req.neededByDate);

  const score =
    0.20 * locationScore +
    0.15 * quantityScore +
    0.15 * priceScore +
    0.10 * qualityScore +
    0.10 * timingScore +
    0.30 * 1.0; // crop compatibility gate already passed = full weight

  return { score, breakdown: { locationScore, quantityScore, priceScore, qualityScore, timingScore } };
}
```

---

## 17. Transaction System

**Flow:**
```
Farmer selects a Match candidate
  → POST /transactions { matchId, quantityKg, agreedPrice? }
  → Validate: Match exists, has no existing Transaction (unique matchId), SellIntent still OPEN
  → DB transaction (Postgres): create Transaction(REQUESTED) + insert
    TransactionStatusHistory(null → REQUESTED) + mark SellIntent.status = MATCHED
  → Enqueue notification to buyer
  → Buyer dashboard: Accept/Reject
      Accept → PATCH /transactions/:id/accept
        → DB transaction: update status ACCEPTED + history row + decrement/close
          BuyerRequirement if fully filled
        → notify farmer
      Reject → status REJECTED + history row → notify farmer → SellIntent reopened (status OPEN)
        → optionally auto re-trigger matching job for next-best candidate
  → IN_PROGRESS / COMPLETED are advanced manually by either party as a simple confirmation
    step (MVP does not need logistics tracking, just a closure signal for reporting)
  → CANCELLED available to farmer or admin at any pre-COMPLETED state
```

**States:** `REQUESTED → MATCHED → PENDING_BUYER → ACCEPTED → IN_PROGRESS → COMPLETED`, with `REJECTED`/`CANCELLED` as terminal off-ramps from any non-completed state.

**Concurrency & idempotency:** Every status transition is executed inside a single `prisma.$transaction([...])` call that both updates `Transaction.status` and inserts the corresponding `TransactionStatusHistory` row atomically, guarded by a `WHERE status = <expectedCurrentStatus>` clause on the update (optimistic concurrency) — if two requests race (e.g., double-tap Accept), the second update affects zero rows and returns a `409 Conflict` instead of corrupting state.

---

## 18. Background Jobs

| Queue | Producer | Trigger | Purpose |
|---|---|---|---|
| `price-ingestion` | scheduler (repeatable job) | every 6h | Pull + store mandi prices |
| `weather-ingestion` | scheduler | 2x/day | Pull + store weather |
| `recommendations` | API (on-demand) | farmer requests advisory | Async-safe path for heavier rule evaluation if needed (can also be sync for MVP simplicity — see note below) |
| `buyer-matching` | API | new SellIntent/BuyerRequirement | Recompute match candidates |
| `notifications` | any service | any user-facing event | Send WhatsApp/email/dashboard notification |
| `whatsapp` | webhook handler | every inbound message needing a reply | Outbound send, decoupled from webhook response time |
| `cleanup` | scheduler | daily | Expire stale SellIntent/BuyerRequirement, purge old Conversation context |

*Note: recommendation generation is fast enough (in-memory rule evaluation over a small candidate crop list) to run synchronously within the webhook request path for MVP; the queue exists for future-proofing when candidate sets or ML inference grow heavier.*

**Reliability pattern (applies to all queues):**
```ts
new Worker('price-ingestion', priceIngestionProcessor, {
  connection: redisConnection,
  concurrency: 2,
});
queue.add('ingest', {}, {
  attempts: 5,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: 100,
  removeOnFail: false, // keep failed jobs visible for the admin system-health page
});
```
Dead-letter handling: jobs that exhaust `attempts` remain in the failed set (not auto-removed) and are surfaced on `/admin/system-health` for manual re-trigger — no separate DLQ infra needed at this scale.

---

## 19. Redis Architecture

| Use | Key pattern | TTL |
|---|---|---|
| BullMQ backing store | managed internally by BullMQ | n/a |
| Latest mandi price cache | `latest:price:{cropId}:{mandiId}` | 6h |
| Latest weather cache | `latest:weather:{districtId}` | 6h |
| Rate limiting | `ratelimit:{ip or userId}:{route}` | rolling window |
| Conversation read-cache (optional perf layer) | `conv:{userId}` | 5 min |
| Per-conversation processing lock | `lock:conv:{conversationId}` | few seconds |

**PostgreSQL = source of truth. Redis = cache/queue/temporary infrastructure.** Nothing is ever written to Redis that cannot be regenerated from Postgres — a full Redis flush should degrade performance, never correctness.

---

## 20. Admin/FPO Dashboard

**Pages:** Overview · Farmers · Buyers · FPOs · Crops · Market Prices · Weather · Recommendations · Transactions · Advisory Activity · Analytics · System Health.

**KPIs (Overview page):**
- Total farmers reached (unique `FarmerProfile` count)
- Advisories delivered (count, last 7/30 days)
- Active `SellIntent`s (open, awaiting match)
- Transactions by status (funnel: Requested → Accepted → Completed)
- Estimated GMV closed (`sum(Transaction.agreedPrice * quantityKg)` for COMPLETED)
- District-wise adoption heatmap
- Data pipeline health (last successful ingestion timestamp per job type)

---

## 21. Frontend Architecture

- **Routing:** React Router; role-aware route tree (`/admin/*`, `/buyer/*`, `/fpo/*`) each wrapped in a `ProtectedRoute` that checks `store.auth.role`.
- **Auth state:** Zustand store holding `{ user, accessToken }`; access token kept in memory (not localStorage) to reduce XSS token-theft surface, refresh token lives in an httpOnly cookie.
- **API client:** thin `fetch` wrapper (`apiClient.ts`) that auto-attaches the bearer token and transparently retries once through `/auth/refresh` on a 401.
- **Data fetching:** React Query for all server state — caching, retries, and background refetch of dashboard KPIs come for free.
- **Forms:** React Hook Form + Zod resolver, same validation schemas mirrored (not duplicated logic, but same *shape*) as backend validators.
- **Error/loading states:** every data-fetching component has an explicit skeleton/loading and error boundary — critical for a live demo where a judge might see a slow network.
- **Responsive UI:** Tailwind breakpoints; dashboard optimized for laptop/tablet since buyers/FPOs/admins are the users, not farmers.

**Folder structure:** see Section 5's `apps/dashboard/src/` tree.

---

## 22. Error Handling

```ts
// shared/errors/AppError.ts
export class AppError extends Error {
  constructor(public statusCode: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}
export class ValidationError extends AppError { constructor(details: unknown) { super(400, 'VALIDATION_ERROR', 'Invalid input', details); } }
export class UnauthorizedError extends AppError { constructor() { super(401, 'UNAUTHORIZED', 'Authentication required'); } }
export class ForbiddenError extends AppError { constructor() { super(403, 'FORBIDDEN', 'Insufficient permissions'); } }
export class NotFoundError extends AppError { constructor(entity: string) { super(404, 'NOT_FOUND', `${entity} not found`); } }
export class ConflictError extends AppError { constructor(msg: string) { super(409, 'CONFLICT', msg); } }
```

**Standardized response shape:**
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid input", "details": { "field": "quantityKg", "issue": "must be positive" } } }
```

**Central handler** (last Express middleware) catches `AppError` subclasses and maps to their status code; anything unrecognized is logged with full stack + `requestId` and returned as a generic `500 INTERNAL_ERROR` (never leaking internals to the client). Database errors (Prisma known-error codes like `P2002` unique violation) are translated into `ConflictError` at the repository boundary, not left as raw Prisma exceptions.

---

## 23. Validation

Zod schemas colocated per module (`*.validator.ts`), applied via a generic middleware:

```ts
export const createTransactionSchema = z.object({
  body: z.object({
    matchId: z.string().cuid(),
    quantityKg: z.number().positive(),
    agreedPrice: z.number().positive().optional(),
  }),
});

export function validate(schema: ZodSchema) {
  return (req, res, next) => {
    const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });
    if (!result.success) throw new ValidationError(result.error.flatten());
    next();
  };
}
```

**Environment variables** are validated once at boot via a `packages/config` zod schema (`envSchema.parse(process.env)`) — the app refuses to start with a misconfigured environment rather than failing confusingly at runtime. **External API responses** (mandi/weather) are also passed through a zod schema before being trusted, since government open-data APIs are known to occasionally return malformed or partial records.

---

## 24. Logging + Observability

- **Structured logging:** Pino (already used in prior inSync work), JSON output, one child logger per request carrying a `requestId` (generated via `crypto.randomUUID()` at the top of the request middleware chain).
- **Log levels:** `error` (failures needing attention), `warn` (degraded/fallback paths, e.g. ML unavailable), `info` (business events: transaction created, match found), `debug` (verbose, dev only).
- **Request IDs** flow through to every log line for that request, and are returned in an `X-Request-Id` response header for support/debugging.
- **Error IDs:** unexpected 500s get a unique `errorId` logged server-side and shown to the user ("Something went wrong. Reference: {errorId}") so an admin can grep it instantly during a demo debrief.
- **Metrics realistic for SIH scope:** API latency and queue failure counts logged as structured `info`/`warn` events queryable in the hosting platform's log viewer (Render/Railway) rather than standing up a full Prometheus/Grafana stack — appropriately scoped, not over-engineered.
- **Audit logs:** every state-changing action on `Transaction`, auth events, and admin actions insert an `AuditLog` row.

---

## 25. Security

Priority-ordered for MVP:

1. **Password hashing:** bcrypt, cost factor 12, never store plaintext.
2. **JWT security:** short-lived access tokens (15 min), signed with a strong `JWT_SECRET`, `alg` explicitly pinned to `HS256` (never accept `alg: none`).
3. **Refresh token security:** httpOnly, secure, `SameSite=Strict` cookie; rotated on every use; hashed at rest in DB.
4. **CORS:** explicit allow-list of the dashboard's deployed origin only, not `*`.
5. **Helmet:** standard secure headers on every response.
6. **Rate limiting:** per-IP and per-user limits on auth endpoints and the WhatsApp webhook.
7. **Input validation:** zod on every input boundary (Section 23) — first line of defense against injection.
8. **SQL injection prevention:** Prisma's parameterized queries by default; raw SQL is avoided entirely in MVP scope.
9. **Webhook verification:** Meta's `X-Hub-Signature-256` HMAC check is mandatory, not optional.
10. **RBAC:** enforced at the middleware layer on every route, never left to the frontend to hide a button.
11. **Secrets:** never committed; `.env` gitignored; production secrets injected via the hosting platform's secret manager.
12. **HTTPS:** enforced end-to-end by the hosting platforms (Render/Railway/Vercel all terminate TLS by default).
13. **Audit logs:** as above — a security *and* government-accountability feature.
14. **Dependency security:** `npm audit` / GitHub Dependabot alerts checked before each deploy.

---

## 26. Environment Variables

```env
# ---- Server ----
NODE_ENV=development
PORT=4000

# ---- PostgreSQL ----
DATABASE_URL=postgresql://user:password@localhost:5432/kisan_setu

# ---- Redis ----
REDIS_URL=redis://localhost:6379

# ---- JWT ----
JWT_ACCESS_SECRET=replace_me
JWT_REFRESH_SECRET=replace_me
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# ---- WhatsApp Cloud API ----
WHATSAPP_PHONE_NUMBER_ID=replace_me
WHATSAPP_ACCESS_TOKEN=replace_me
WHATSAPP_APP_SECRET=replace_me
WHATSAPP_VERIFY_TOKEN=replace_me

# ---- Twilio (voice fallback) ----
TWILIO_ACCOUNT_SID=replace_me
TWILIO_AUTH_TOKEN=replace_me
TWILIO_PHONE_NUMBER=replace_me

# ---- Weather API ----
WEATHER_API_KEY=replace_me
WEATHER_API_BASE_URL=https://api.example-imd.gov.in

# ---- Mandi / data.gov.in ----
MANDI_API_KEY=replace_me
MANDI_API_BASE_URL=https://api.data.gov.in/resource/xxxx

# ---- CORS ----
CORS_ALLOWED_ORIGIN=http://localhost:5173
```

---

## 27. Local Development

```bash
# 1. Clone
git clone https://github.com/<org>/kisan-setu.git && cd kisan-setu

# 2. Install (npm/pnpm workspaces)
npm install

# 3 & 4. Start Postgres + Redis (via Docker Compose — see Section 28)
docker compose up -d postgres redis

# 5. Configure environment
cp apps/api/.env.example apps/api/.env   # fill in local values

# 6. Run migrations
npm run --workspace apps/api prisma:migrate:dev

# 7. Seed data
npm run --workspace apps/api prisma:seed

# 8. Start API
npm run --workspace apps/api dev

# 9. Start worker (separate terminal)
npm run --workspace apps/worker dev

# 10. Start dashboard (separate terminal)
npm run --workspace apps/dashboard dev
```

---

## 28. Docker

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: kisan_setu
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]

  redis:
    image: redis:7
    ports: ["6379:6379"]

volumes:
  pgdata:
```

**Development:** only `postgres` + `redis` run in Docker; `api`/`worker`/`dashboard` run natively via `npm run dev` for fast hot-reload.
**Production:** `api` and `worker` each get a slim multi-stage Dockerfile (`node:20-alpine`, `npm ci --omit=dev`, `npx prisma generate`, `npm run build`, `CMD node dist/index.js`) — two separate images from the same monorepo using different build targets, deployed as two separate Render/Railway services so a worker crash never takes down the API.

---

## 29. Testing

| Layer | Tool | What's tested |
|---|---|---|
| Unit | `node:test` + built-in assertions (matches existing team experience) | Recommendation rule functions, matching score calculator, utility formatters — pure functions, no DB |
| Integration | Supertest + a dedicated test Postgres DB | Full API request → controller → service → repository → real DB round-trip: auth flow, transaction state transitions, RBAC enforcement |
| E2E | Manual/scripted scenario walkthrough (Playwright optional if time allows) | Farmer (simulated WhatsApp payloads) → recommendation → sell intent → match → buyer accepts on dashboard → transaction COMPLETED |
| Frontend | React Testing Library (critical flows only, given the timeline) | Login, protected route redirect, accept/reject transaction action |

**What must actually be tested for SIH** (given limited time, prioritize ruthlessly):
1. Transaction state machine transitions (this is the judged differentiator — it must never be seen to break live).
2. Matching score correctness on a known fixture set.
3. Auth/RBAC boundaries (a buyer must never see another buyer's requirements).
4. WhatsApp webhook idempotency (duplicate message doesn't double-create a transaction).

---

## 30. Seed/Demo Data

Seed script (`prisma/seed.ts`) creates a small but **realistic and internally consistent** dataset:

- 3 districts (e.g., Nashik, Pune, Ahmednagar) with static lat/long
- 8–10 crops with realistic `waterReq` and `CropSeason` windows for Maharashtra
- 3–4 mandis per district
- 60 days of `MandiPrice` history per crop-mandi pair (synthetic but trend-realistic — gentle upward/downward drift, not flat lines, so the demo's "price trend" story is visible)
- 14 days of `WeatherData` (observed) + 5 days forecast per district
- ~15 farmer `User`+`FarmerProfile` rows across the districts
- 5 buyers with varied `BuyerRequirement`s covering the seeded crops
- 2 FPOs with member farmers
- A handful of pre-existing `Transaction`s in different states (some COMPLETED, some ACCEPTED, one REJECTED) so the dashboard doesn't look empty on first load
- **One specific, named "hero" farmer** reserved and left with *no* pre-existing sell intent — this is the one used live in the demo (Section 31), so the judges see the flow happen from a clean state.

---

## 31. SIH Killer Demo

**Persona:** *Sunita Tai, a farmer from Sinnar taluka, Nashik district.*

**Script (5–7 minutes):**

1. **(0:00–1:00) Problem framing** — one slide: "A farmer today can find advisory OR prices OR buyers — never a closed loop to an actual sale." Show the four-stage funnel diagram from Section 1.4.
2. **(1:00–2:30) WhatsApp advisory** — live device sends "Hi" to the bot number. Language → Marathi. Location → Sinnar. Bot returns a crop recommendation ("Soybean — suitability 82%") **with the reason shown on screen** ("recent rainfall supports this, and this is the sowing window").
3. **(2:30–3:30) Market intelligence** — Sunita Tai asks for the price. Bot returns the live/cached modal price for soybean at the nearest mandi, and a one-line trend note ("prices have risen ~6% over the last month").
4. **(3:30–4:30) Buyer matching** — bot asks "Do you have produce ready?" → 500kg, ready in 2 weeks → bot returns top matched buyer with score. Sunita Tai confirms → transaction REQUESTED.
5. **(4:30–5:30) Dashboard cutover** — switch to the buyer's dashboard (pre-logged-in on a second screen/laptop) — the incoming request appears in real time (or on refresh). Buyer clicks **Accept**.
6. **(5:30–6:30) Loop closed** — WhatsApp on the farmer's phone shows the acceptance notification instantly. Cut to the Admin dashboard Overview page showing the transaction funnel KPI ticking up.
7. **(6:30–7:00) Close** — repeat the one-line thesis: *"This is not a chatbot. This is a market-linkage system that closes the loop from advisory to a real transaction."*

**What judges see at every step:** a real WhatsApp conversation (not a mockup), a real explainable score, a real dashboard action, and a status update crossing back to the original channel — the full loop, visibly, inside 7 minutes.

---

## 32. Demo Failure-Proofing

| Failure | Fallback |
|---|---|
| Weather API down | Serve last successfully cached `WeatherData` row from Redis/Postgres; if that's stale beyond a threshold, serve seeded demo-day weather data flagged internally as `forecast: true, source: 'seed'` |
| Mandi API down | Same pattern — Redis cache, then latest seeded `MandiPrice` row; the recommendation/price-lookup code path is identical either way, so there is nothing special to "switch on" during the demo |
| WhatsApp API down/rate-limited | A pre-recorded screen capture of the WhatsApp flow is kept as a backup video, with the live dashboard portion (Sunita Tai's already-created transaction) still demoed live |
| Redis down | API degrades to reading from Postgres directly for cache-miss paths (cache is a strict optimization, never a hard dependency — Section 19) |
| ML unavailable | Silent, zero-impact — rules-only path is the *default* code path, not a fallback branch bolted on later (Section 13) |
| Unstable internet | Seed data pre-loaded locally; a local/offline demo profile flag (`DEMO_MODE=true`) makes ingestion jobs skip external calls and instead re-assert the seed dataset, so the whole app can run fully offline on a laptop hotspot if venue Wi-Fi fails |
| External API rate limit mid-demo | Same caching layer absorbs this — a rate-limited response is treated identically to a downtime response |

The unifying principle: **every external dependency has a cache-or-seed fallback that the core code path already uses in the happy path** — there is no separate "demo mode" logic to maintain and risk breaking; the fallback *is* the normal cache-miss behavior.

---

## 33. Deployment Architecture

```
Internet
  ↓
Vercel (Dashboard — React static build + CDN)
  ↓ (API calls, CORS-restricted to Vercel domain)
Render/Railway (API service — Node/Express container)
  ↓
Managed PostgreSQL (Render/Railway/Neon)
  ↓
Managed Redis (Render/Railway/Upstash)
  ↓
Render/Railway (Worker service — separate container, same image different CMD)
  ↓
External APIs (WhatsApp Cloud API, Twilio, IMD/weather, data.gov.in)
```

- **Frontend:** Vercel, auto-deploy from `main`, environment variable for `VITE_API_BASE_URL`.
- **API:** Render/Railway web service, `DATABASE_URL`/`REDIS_URL`/secrets injected via platform env config, health check endpoint `GET /health` wired to the platform's liveness probe.
- **Worker:** separate Render/Railway *background worker* service type (no public port needed) from the same repo/image, different start command.
- **Database/Redis:** managed add-ons — no self-hosted DB maintenance during a hackathon.
- **Webhook URL:** the API's public HTTPS URL (`https://api.kisansetu.app/api/v1/whatsapp/webhook`) registered in Meta's App Dashboard — must be stable, so this is set up early, not on demo day.
- **HTTPS/Domain:** platform-provided TLS is sufficient; a custom domain is a nice-to-have, not required for judging.
- **Health checks:** `/health` returns DB+Redis connectivity status so the platform (and the admin system-health page) can detect degraded state proactively.

---

## 34. CI/CD

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
```

- **Branch strategy:** `main` (always deployable, auto-deploys to production), `develop` (integration branch, auto-deploys to a staging Render/Vercel environment), short-lived `feature/*` branches merged into `develop` via PR + at least one review.
- **Secrets:** stored in GitHub Actions secrets + the hosting platform's own secret store — never in the repo.
- **Deploy trigger:** Render/Vercel's native git-integration auto-deploy on push to `main`/`develop` — no custom deploy scripting needed; CI's job is purely to gate merges with lint/typecheck/test, keeping the pipeline intentionally simple per the brief's instruction not to over-engineer CI/CD.

---

## 35. Database Migration + Backup

- **Migrations:** `prisma migrate dev` locally to generate migration files (checked into `prisma/migrations/`), `prisma migrate deploy` run as a release step before the API container starts in production (Render/Railway "pre-deploy command").
- **Seed scripts:** `prisma/seed.ts` run once against production only to load reference data (districts, crops, mandis) — **never** the synthetic demo transactions/farmers in a real deployment; a `SEED_DEMO_DATA=true` flag gates the demo-only fixtures so production and demo environments share the same seed script safely.
- **Backups:** rely on the managed Postgres provider's automated daily backups/point-in-time recovery (standard on Render/Railway/Neon paid tiers; for the hackathon, a manual `pg_dump` before the live demo is a cheap extra safety net).
- **Migration safety:** additive migrations (new nullable columns, new tables) are preferred over destructive ones during the build phase; any column rename/drop is reviewed by at least two team members before running against the shared dev database.

---

## 36. API Documentation

OpenAPI/Swagger spec generated from the zod validators + route definitions (via `zod-to-openapi` or hand-maintained `openapi.yaml` if time-constrained), served at `/api/v1/docs` using `swagger-ui-express`. Each documented endpoint includes: path, method, auth requirement, request schema, response schema (success + error shapes from Section 22), and example payloads matching Section 8's examples. This single spec doubles as the shared contract between the backend and frontend engineers during the 6-week build, reducing integration friction.

---

## 37. Performance + Scalability

**Required for SIH MVP:**
- Indexes on every FK + hot filter column (already in Section 7's schema)
- Redis caching for price/weather latest-lookups (Section 19)
- Pagination on all list endpoints (`GET /transactions`, `/farmers/:id/advisories`) via `?page&pageSize`, default page size 20
- Rate limiting on public/webhook endpoints (Section 25)
- Prisma's built-in connection pooling (sufficient at single-instance scale)

**Future production scaling (explicitly deferred):**
- Horizontal API scaling behind a load balancer with sticky-session-free JWT auth (already stateless, so this is a deploy-config change, not a code change)
- Worker pool scaling per queue based on queue depth metrics
- Read replicas for analytics/admin dashboard queries
- Table partitioning for `MandiPrice`/`WeatherData` by month once historical volume grows

---

## 38. Data Consistency

| Concern | Mechanism |
|---|---|
| Transaction state transitions | Single `prisma.$transaction()` per transition, with an optimistic `WHERE status = expected` guard (Section 17) |
| Buyer acceptance race (two buyers, one sell intent) | `Match`→`Transaction` is 1:1 (`matchId @unique`); the DB unique constraint itself is the final arbiter — a losing concurrent request gets a Prisma unique-violation, mapped to `409 CONFLICT` |
| Quantity tracking | `BuyerRequirement.quantityKg` is only decremented inside the same DB transaction that accepts a `Transaction`, never as a separate follow-up write |
| Duplicate requests | Idempotent upserts on `Match` (unique pair) and `MandiPrice` (unique per mandi/crop/date); `Message.externalMsgId` unique for WhatsApp dedupe |
| WhatsApp webhooks | Per-conversation Redis lock (Section 10) serializes processing of rapid-fire messages from the same user |
| Matching re-scans | Purely idempotent — re-running the matching job for the same sell intent recomputes and upserts, never duplicates |

Row-level locking (`SELECT ... FOR UPDATE` via Prisma's `$queryRaw` if ever needed) is intentionally avoided in MVP scope — the unique-constraint + optimistic-status-guard pattern above covers every realistic race condition in this domain without added complexity.

---

## 39. Six-Week Development Plan

### Week 1 — Backend Foundation + Database
- **Goals:** repo scaffolded, Prisma schema finalized, auth working end-to-end.
- **Backend:** monorepo setup, Express app skeleton, error handling middleware, logger, Prisma schema + first migration.
- **Frontend:** Vite+Tailwind scaffold, routing skeleton, login page.
- **Database:** full schema from Section 7 migrated; seed script v1 (districts, crops, mandis only).
- **APIs:** `/auth/register`, `/auth/login`, `/auth/refresh`.
- **Testing:** unit tests for password hashing/JWT utils; integration test for auth flow.
- **Deliverable:** a deployed (staging) API a teammate can log into.
- **Dependencies:** none — this unblocks everyone else.

### Week 2 — Farmer/FPO/Buyer Flows
- **Goals:** all core profile CRUD, RBAC enforced.
- **Backend:** farmers/buyers/fpo modules, RBAC middleware, `BuyerRequirement` CRUD.
- **Frontend:** Buyer dashboard shell (requirement posting form), FPO dashboard shell.
- **Database:** `FarmerProfile`, `Buyer`, `FPO`, `FPOMembership`, `BuyerRequirement` fully wired.
- **APIs:** Section 8's Farmers/Buyers/FPO groups.
- **Testing:** integration tests for RBAC boundaries.
- **Deliverable:** a buyer can register, log in, post a requirement.
- **Dependencies:** Week 1 auth.

### Week 3 — Market + Weather Ingestion
- **Goals:** real (or realistic seeded) data flowing into Postgres/Redis.
- **Backend:** `integrations/mandi`, `integrations/weather` clients; BullMQ queues + workers set up; scheduler config.
- **Frontend:** basic price/weather display components for later reuse.
- **Database:** `MandiPrice`, `WeatherData`, `DataIngestionJob` populated.
- **APIs:** `/market/prices/latest`, `/weather/:districtId/latest`.
- **Testing:** unit tests on normalization/dedup logic with fixture payloads.
- **Deliverable:** admin system-health page shows successful ingestion runs.
- **Dependencies:** Week 1 infra (`infra/redis.ts`, `infra/queues`).

### Week 4 — Recommendation + Matching
- **Goals:** the two core "intelligence" engines working and explainable.
- **Backend:** `recommendation` module (rules engine + config), `matching` module (scoring).
- **Frontend:** advisory result display (with reason text), match candidate display.
- **Database:** `Advisory`, `SellIntent`, `Match` wired.
- **APIs:** `/recommendations`, `/matching/run`, `/matching/:id/candidates`.
- **Testing:** unit tests on rule/scoring functions against fixture data (highest-value tests in the whole project).
- **Deliverable:** given a farmer + crop context, a scored, explained recommendation is returned; given a sell intent, ranked buyer matches are returned.
- **Dependencies:** Week 3 data (weather/price), Week 2 profiles.

### Week 5 — WhatsApp + Regional Language + Dashboard
- **Goals:** the actual farmer-facing channel works end-to-end; dashboard is demo-ready.
- **Backend:** `whatsapp` module (webhook, state machine, Cloud API client), `locales/` translation files, Twilio voice fallback (if time permits).
- **Frontend:** Transaction accept/reject flow, Admin Overview KPIs, Analytics page.
- **Database:** `Conversation`, `Message`, `Transaction`, `TransactionStatusHistory` fully wired end-to-end.
- **APIs:** `/whatsapp/webhook`, `/transactions/*`.
- **Testing:** integration test simulating a full webhook conversation sequence; idempotency test (duplicate message).
- **Deliverable:** a real WhatsApp number that a tester can message and complete the full farmer journey.
- **Dependencies:** Weeks 1–4 (needs auth, profiles, recommendation, matching all functioning).

### Week 6 — Testing + Deployment + Demo Hardening
- **Goals:** production deployment live, demo script rehearsed, failure-proofing implemented.
- **Backend/Frontend:** bug fixes from full E2E runs, `DEMO_MODE` fallback flag (Section 32), final seed data (Section 30).
- **Database:** production migration deploy, backup taken pre-demo.
- **Testing:** full manual E2E run-through 3+ times, load-test the webhook lightly (a handful of concurrent messages).
- **Deliverable:** the Section 31 demo runs successfully, live, at least twice before the actual judging slot.
- **Dependencies:** everything.

---

## 40. Team Division (4 Developers)

| Role | Responsibilities | Integration Points |
|---|---|---|
| **1. Backend Engineer** | Auth, farmers/buyers/FPO modules, transaction system, error handling, validation, DB migrations | Provides the API contract (Section 8) that everyone else builds against from Week 1 |
| **2. Frontend Engineer** | Dashboard (all pages in Section 20/21), API client, forms, protected routes | Consumes the OpenAPI spec (Section 36); needs early mock responses from Backend Engineer to unblock in Week 2 |
| **3. Recommendation/Data Engineer** | Recommendation engine, matching engine, mandi/weather ingestion pipelines, ML layer (if time permits), seed data | Owns Sections 12–16, 30; hands off scored results consumed by Backend's transaction module |
| **4. Integration/DevOps Engineer** | WhatsApp module, conversation state machine, regional language files, deployment (Docker, CI/CD, hosting), demo failure-proofing | Owns Sections 10, 11, 27–35; is the one who "wires the whole thing together" for the live demo |

**Weekly sync point:** a 15-minute stand-up + a shared `apps/api/openapi.yaml` diff review, since the API contract is the seam every role depends on.

---

## 41. Git Workflow

- **Branches:** `main` (production, protected, PR-only), `develop` (staging, protected, PR-only), `feature/<module>-<short-desc>` (e.g. `feature/matching-scoring`), `fix/<short-desc>`.
- **Commit convention:** Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`) for a clean, judge-presentable git history.
- **Pull requests:** every PR into `develop`/`main` requires at least one teammate review and a green CI run (Section 34); PR description must state which section of this blueprint it implements.
- **Branch protection:** `main` and `develop` require PRs (no direct push), require CI to pass, and require 1 approval.
- **Environment management:** each developer has a local `.env` (never committed); `develop`/`main` environments have their own separate secrets in the hosting platforms.

---

## 42. Definition of Done (MVP)

- [ ] WhatsApp conversational flow works end-to-end on a real registered number
- [ ] Marathi (regional language) flow verified working, English fallback verified
- [ ] Weather ingestion pipeline populates real or seeded data reliably
- [ ] Mandi price ingestion pipeline populates real or seeded data reliably
- [ ] Recommendation engine returns a scored, explained advisory for at least 5 crops
- [ ] Buyer matching returns ranked, explained candidates
- [ ] Farmer can create a transaction request from a match
- [ ] Buyer can accept/reject from the dashboard and farmer is notified
- [ ] Dashboard (Admin/FPO/Buyer) is functional for all defined pages
- [ ] Auth + RBAC enforced across every protected route
- [ ] PostgreSQL deployed and migrated in production
- [ ] Redis deployed and connected in production
- [ ] Worker deployed as a separate running service
- [ ] Backend API deployed and publicly reachable over HTTPS
- [ ] Frontend dashboard deployed and publicly reachable
- [ ] Full end-to-end demo (Section 31) runs successfully at least twice before judging

---

## 43. Final Production Checklist

- [ ] **Backend:** all Section 8 endpoints implemented, error responses standardized, `/health` endpoint live
- [ ] **Database:** migrations applied, indexes verified, reference data (districts/crops/mandis) seeded
- [ ] **Redis:** connected, cache keys verified populated post-ingestion
- [ ] **Workers:** all 7 queues (Section 18) running with correct retry/backoff config
- [ ] **WhatsApp:** webhook verified with Meta, signature verification tested, idempotency tested
- [ ] **Dashboard:** all pages load, role-based access confirmed for each of the 5 roles
- [ ] **Security:** Section 25's checklist fully applied, `npm audit` clean of high/critical issues
- [ ] **Deployment:** staging and production environments both live and match
- [ ] **Monitoring:** logs verified structured and searchable on the hosting platform
- [ ] **Backups:** at least one manual `pg_dump` taken before demo day
- [ ] **Demo:** Section 31 script rehearsed, Section 32 fallbacks tested by deliberately killing each external dependency once in staging

---

## 44. Final Architecture Summary

```
User (Farmer / Buyer / FPO / Admin)
  ↓
Communication Layer     (WhatsApp Cloud API, Twilio Voice, React Dashboard)
  ↓
API Layer               (Express + TypeScript, Auth, RBAC, Validation)
  ↓
Business Logic          (Farmers, Buyers, FPO, Crops, Transactions modules)
  ↓
Recommendation + Matching  (explainable rules engine + weighted matching, ML additive only)
  ↓
Transaction Layer        (state machine, audit history, concurrency-safe)
  ↓
PostgreSQL                (single source of truth)
  ↓
Background Processing     (BullMQ workers: ingestion, matching, notifications)
  ↓
External Data              (data.gov.in mandi prices, IMD weather, WhatsApp Cloud API)
```

> Kisan Setu is not fundamentally a prediction system. It is a market-linkage system that uses agricultural intelligence to close the loop between farmer decisions and actual buyer transactions.

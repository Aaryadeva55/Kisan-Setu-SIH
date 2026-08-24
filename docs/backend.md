# Kisan Setu — Backend Blueprint
### Government of Maharashtra · Smart India Hackathon

> Kisan Setu is not fundamentally a prediction system. It is a market-linkage system that uses agricultural intelligence to close the loop between farmer decisions and actual buyer transactions.

This document covers everything the **Backend Engineer, Recommendation/Data Engineer, and Integration/DevOps Engineer** own: API, database, business logic, WhatsApp system, engines, jobs, security, and deployment. See the companion `kisan-setu-frontend-blueprint.md` for the dashboard.

---

## 1. Context (Read First)

**Problem:** Farmers get advisory, price data, and buyer access as three disconnected things — no system closes the loop into an actual transaction. Kisan Setu is a WhatsApp/voice platform that takes a farmer through: *advisory → market intelligence → buyer/FPO matching → transaction request → transaction tracking.*

**Core differentiator:** the judged outcome is a closed transaction, not chatbot quality. Every backend decision below protects that narrative — the transaction system, matching engine, and explainability of every score are the heart of the backend.

**MVP must work with zero ML dependency.** Rules-first everywhere; ML is additive only.

---

## 2. System Architecture (Backend View)

```
Farmer
  ↓
WhatsApp Cloud API / Twilio Voice
  ↓
Webhook Ingress (API) — verify, dedupe, parse
  ↓
API Layer (Express) — Auth, Controllers, Routes  ◄── also serves Dashboard (frontend)
  ↓
Business Services — Advisory / Market / Auth / Transactions
  ↓                              ↓
Recommendation Engine     Matching Engine (weighted scoring)
(rules + optional ML)              ↓
                          Transaction System (state machine + audit)
  ↓                              ↓
PostgreSQL  ◄─────────────────────┘   ← source of truth
  ↓
Redis (cache / rate-limit / conversation state)  ◄──►  BullMQ  ──►  Workers
                                                                       ↓
                                                         External APIs (data.gov.in mandi,
                                                         IMD weather, WhatsApp Cloud API)
```

**Component rationale:**
- **Webhook Ingress** is thin by design — verify, dedupe by message ID, enqueue, return 200 fast. WhatsApp times out and retries otherwise.
- **Business Services** hold all domain logic so WhatsApp and the dashboard's future farmer-facing surfaces (if any) reuse identical logic.
- **Recommendation** and **Matching** are separate engines answering different questions and independently testable.
- **PostgreSQL is the single source of truth.** Redis never holds anything not reconstructable from Postgres.
- **Workers** run as a separate Node process so a slow ingestion job never blocks farmer-facing request latency.

---

## 3. Architecture Decisions

| Decision | Reasoning |
|---|---|
| **PostgreSQL over MongoDB** | The domain is inherently relational — farmers, buyers, transactions, matches all need strong FK relationships and multi-table transactional integrity (accepting a transaction atomically updates `Transaction` + inserts `TransactionStatusHistory` + adjusts buyer capacity). |
| **Prisma over raw SQL/TypeORM** | Type-safe queries matching the TS-first stack, strong migration tooling for a fast 6-week build, generated types eliminate a class of bugs when schema changes mid-hackathon. |
| **Redis** | Strictly cache (mandi price / weather latest-lookup), BullMQ's backing store, rate limiting. Never source of truth. |
| **BullMQ** | Node-native, Redis-backed, exactly fits the ingestion + notification workloads without introducing Kafka/RabbitMQ overkill. |
| **Node.js/Express** | Matches existing team skill set; mature ecosystem for WhatsApp SDKs, Prisma, BullMQ. |
| **TypeScript strict mode** | Non-negotiable at this domain complexity — transaction states, RBAC, multi-table joins are exactly where loose typing produces production bugs. |
| **Rules-first recommendation** | Explainability is a hard SIH judging requirement. Rules also work with zero training data on day one. |
| **Where ML belongs** | Strictly additive — price-trend forecasting and demand ranking adjust rule-based scores, never replace them. |
| **Why not microservices** | At 6 weeks / 4 developers / one deployment target, microservices add ops overhead with zero benefit yet. |
| **Why modular monolith** | Clean internal boundaries (`modules/farmers`, `modules/transactions`, ...) that could later be extracted, while keeping one deployable unit, one DB pool, one CI pipeline. |

**MVP vs future-scale:**

| Concern | MVP (SIH) | Future Scale |
|---|---|---|
| Deployment | Single API instance + single worker instance | Horizontally scaled API behind LB, dedicated worker pools per queue |
| Database | Single PostgreSQL instance | Read replicas, partitioned `MandiPrice`/`WeatherData` by date |
| Matching | Synchronous-ish scoring on small candidate sets | Precomputed indexes, geo-spatial indexing (PostGIS) |
| ML | None or one lightweight regression | Dedicated model-serving layer, feature store |

---

## 4. Backend Repository Structure

```
kisan-setu/
├── apps/
│   ├── api/          # Express + TypeScript backend
│   └── worker/        # BullMQ worker processes (separate deploy target)
├── packages/
│   ├── shared/         # cross-cutting utils
│   ├── types/           # shared TS types/DTOs, also consumed by dashboard
│   └── config/           # shared env schema (zod), eslint/tsconfig base
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── docker-compose.yml
└── .github/workflows/ci.yml
```

### `apps/api/src/`

```
src/
├── config/            # env loading + validation (zod), constants, feature flags
├── modules/
│   ├── auth/
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
│           ├── *.controller.ts   # HTTP layer only
│           ├── *.service.ts      # business logic
│           ├── *.repository.ts   # Prisma queries isolated here
│           ├── *.routes.ts
│           ├── *.validator.ts    # zod schemas
│           └── *.types.ts
├── shared/
│   ├── middleware/    # auth, error handler, rate limiter, request-id, role-guard
│   ├── errors/        # AppError + subclasses
│   ├── logger/        # pino instance + child logger factory
│   └── utils/
├── infra/
│   ├── prisma.ts
│   ├── redis.ts
│   └── queues/         # BullMQ queue definitions (producers only)
├── integrations/
│   ├── whatsapp/
│   ├── twilio/
│   ├── mandi/
│   └── weather/
├── app.ts              # express app assembly — NO app.listen()
└── index.ts            # imports app, calls app.listen(), graceful shutdown
```

**Why:** `app.ts`/`index.ts` split makes the app importable in integration tests without binding a port. `repository.ts` isolating Prisma calls lets services be unit-tested with a mocked repository.

### `apps/worker/src/`

```
src/
├── queues/            # queue *definitions*, shared via packages/types
├── jobs/
│   ├── price-ingestion.job.ts
│   ├── weather-ingestion.job.ts
│   ├── matching.job.ts
│   ├── notification.job.ts
│   └── cleanup.job.ts
├── processors/         # the actual async (job) => {...} functions, unit-testable in isolation
└── index.ts             # boots all BullMQ Workers
```

---

## 5. Database Architecture

### 5.1 Reasoning Before Tables

- **User vs Profile split**: `User` holds only auth-relevant fields. Role-specific data (`FarmerProfile`, `Buyer`, `FPO`) lives in separate 1:1 tables, avoiding a wide, mostly-null "god table."
- **Every transactional entity gets `createdAt`/`updatedAt`.** `Transaction` additionally gets full history via `TransactionStatusHistory` rather than silently mutating a status column — auditability is a government-project requirement.
- **Soft deletion** (`deletedAt`) only where accidental hard-deletes are costly and "undo" matters: `User`, `BuyerRequirement`, `Transaction`. Reference tables (`Crop`, `Mandi`) are hard-delete-safe.
- **Mandi price and weather data are append-only time series** — never updated in place, always inserted with a timestamp.
- **Composite uniqueness**: `MandiPrice` unique on `(mandiId, cropId, priceDate)` prevents duplicate ingestion; `Match` unique on `(sellIntentId, buyerRequirementId)` prevents duplicate rows on re-scans.
- **Indexes** on every foreign key plus every hot filter column (`FarmerProfile.districtId`, `MandiPrice.priceDate`, `Transaction.status`).

### 5.2 ER Diagram (Mermaid)

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

---

## 6. Prisma Schema

```prisma
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
  buyerType    String
  createdAt    DateTime @default(now())

  requirements BuyerRequirement[]
}

model Crop {
  id        String   @id @default(cuid())
  name      String   @unique
  category  String?
  waterReq  String?
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
  season    String
  sowStart  Int
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
  sourceRef  String?
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
  forecast    Boolean  @default(false)
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
  reason         String   @db.Text
  ruleTrace      Json
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
  status         String   @default("OPEN")
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
  scoreBreakdown     Json
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
  changedBy     String?
  note          String?
  createdAt     DateTime          @default(now())

  @@index([transactionId, createdAt])
}

model Conversation {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  channel   String
  state     String
  context   Json
  updatedAt DateTime @updatedAt
  createdAt DateTime @default(now())

  messages Message[]

  @@index([userId])
}

model Message {
  id              String   @id @default(cuid())
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  direction       String
  externalMsgId   String?  @unique
  content         String   @db.Text
  createdAt       DateTime @default(now())

  @@index([conversationId, createdAt])
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  channel   String
  title     String
  body      String
  status    String   @default("PENDING")
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
  jobType    String
  status     String
  recordsIn  Int      @default(0)
  recordsOk  Int      @default(0)
  error      String?
  startedAt  DateTime @default(now())
  finishedAt DateTime?
}
```

**Key decisions:** `onDelete: Cascade` only on strictly-owned child rows; shared lookup data (`Crop`, `Mandi`, `District`) defaults to `Restrict`. `ruleTrace`/`scoreBreakdown` JSON columns make explainability queryable data, not a log line. `Match` unique on its pair makes re-running matching always idempotent.

---

## 7. API Architecture

Base path `/api/v1`. All authenticated routes require `Authorization: Bearer <accessToken>`.

### Auth
| Method | URL | Purpose | Auth | Role |
|---|---|---|---|---|
| POST | `/auth/register` | Create Buyer/FPO/Admin account | No | — |
| POST | `/auth/login` | Login, returns access+refresh token | No | — |
| POST | `/auth/refresh` | Rotate refresh token | Refresh cookie | — |
| POST | `/auth/logout` | Revoke refresh token | Yes | Any |

### Farmers
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

### Crops / Weather / Market Prices
| Method | URL | Purpose | Auth | Role |
|---|---|---|---|---|
| GET | `/crops` | List crops (+season filter) | No | — |
| GET | `/crops/:id/seasons` | Season windows | No | — |
| GET | `/weather/:districtId/latest` | Latest observed+forecast | No | — |
| GET | `/weather/:districtId/history` | Historical series | Yes | ADMIN |
| GET | `/market/prices/latest?cropId&districtId` | Latest modal price | No | — |
| GET | `/market/prices/history?cropId&mandiId` | Trend series | Yes | ADMIN |

### Recommendations / Matching
| Method | URL | Purpose | Auth | Role |
|---|---|---|---|---|
| POST | `/recommendations` | Generate advisory for farmer+crop context | Internal | FARMER (via WhatsApp module) |
| GET | `/recommendations/:farmerId/latest` | Latest advisory | Yes | self, FPO, ADMIN |
| POST | `/matching/run` | Trigger match scan | Internal | system |
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

### WhatsApp / Notifications / Admin
| Method | URL | Purpose | Auth | Role |
|---|---|---|---|---|
| GET | `/whatsapp/webhook` | Meta verification handshake | Meta secret token | — |
| POST | `/whatsapp/webhook` | Inbound message ingress | Meta signature | — |
| GET | `/notifications` | List own notifications | Yes | Any |
| PATCH | `/notifications/:id/read` | Mark read | Yes | Any (owner) |
| GET | `/admin/overview` | KPIs | Yes | ADMIN, GOVERNMENT_EVALUATOR |
| GET | `/admin/analytics?district&dateRange` | Drilldown analytics | Yes | ADMIN, GOVERNMENT_EVALUATOR |
| GET | `/admin/system-health` | Ingestion job status, queue depth | Yes | ADMIN |

**Example — Create Transaction**

`POST /transactions`
```json
{ "matchId": "clx1234match", "quantityKg": 500, "agreedPrice": 2100 }
```
```json
// 201
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
// 409 — match already has a transaction
{ "error": { "code": "MATCH_ALREADY_CONVERTED", "message": "This match already has a transaction." } }
```

---

## 8. Authentication + Authorization

```
Register → bcrypt hash password (cost 12) → User row created (role fixed at registration)
Login → verify bcrypt hash → issue:
   accessToken  (JWT, 15 min, HS256, payload: {userId, role})
   refreshToken (JWT, 7 days, stored hashed in DB, httpOnly secure cookie)
Every protected request → authMiddleware verifies accessToken → attaches req.user
Access token expired → client calls /auth/refresh with refresh cookie
   → verify against stored hash → rotate: issue new pair, invalidate old refresh token
Logout → delete/blacklist refresh token record
```

Roles: `FARMER, BUYER, FPO, ADMIN, GOVERNMENT_EVALUATOR`. Farmers never use a password — identity is the verified WhatsApp phone number; a `FARMER`-role `User` row is created transparently on first WhatsApp contact (`passwordHash = null`).

```ts
export function requireAuth(req, res, next) {
  const token = extractBearer(req);
  if (!token) throw new UnauthorizedError();
  req.user = verifyAccessToken(token);
  next();
}

export function requireRole(...roles: Role[]) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) throw new ForbiddenError();
    next();
  };
}
```

Refresh token rotation prevents replay: every refresh issues a new token and invalidates the previous; reuse of an already-rotated token revokes the entire session family.

---

## 9. WhatsApp System

```
Inbound WhatsApp message
  → POST /whatsapp/webhook
  → verify X-Hub-Signature-256 against app secret
  → check externalMsgId against Message table (idempotency) — if seen, 200 immediately
  → resolve/create User by phone number
  → load or create Conversation (state machine)
  → detect language (from Conversation.context)
  → lightweight intent detection (keyword/button-payload based, not NLP for MVP)
  → dispatch to BusinessService based on (state, intent)
  → service returns response payload (text/buttons/list)
  → enqueue outbound message job (whatsapp queue) — decouples send latency from webhook response
  → persist inbound+outbound Message rows
  → return 200 OK immediately after enqueue
```

**Conversation states:**
```
START → LANGUAGE_SELECTION → LOCATION → MAIN_MENU
MAIN_MENU → CROP_SELECTION → ADVISORY → (offer) → QUERY (sell intent capture)
QUERY → BUYER_MATCH → TRANSACTION_CONFIRMATION → TRANSACTION_CREATED → MAIN_MENU
MAIN_MENU → PRICE → MAIN_MENU
Any state → "status"/"help" keyword → short-circuits without losing context
```

State is persisted in `Conversation.state`/`context` (Postgres), not only Redis — a server restart or worker crash never loses a farmer's mid-conversation progress. Redis is only a short-TTL read cache.

**Reliability:**
- **Duplicate webhooks:** `Message.externalMsgId` unique — duplicate insert caught and short-circuited.
- **Idempotency:** state transitions derive purely from `(currentState, inboundPayload)` — safe to replay.
- **Retries:** outbound sends use BullMQ retry with exponential backoff (3 attempts).
- **Message ordering:** short Redis lock keyed by `conversationId` serializes rapid double-taps.
- **Rate limits:** outbound queue respects Meta's per-number limits via BullMQ's `limiter` config.
- **Webhook security:** signature verification mandatory before parsing; failures logged to `AuditLog`, rejected 401.

---

## 10. Regional Language Architecture

- **Language selection** is the first conversation state; stored on `User.preferredLang`.
- **Static translations:** bot copy lives in `locales/mr.json`, `locales/hi.json`, `locales/en.json`, a simple `t(key, lang)` lookup — no external translation API dependency (zero runtime cost, offline-safe for demo).
- **Dynamic content** (crop/mandi names, advisory reasons) uses a small curated dictionary of ~30–50 agricultural terms rather than general MT — keeps agri terminology correct and demo offline-safe.
- **Intent recognition** works on button/list payload values (language-independent IDs); free-text fallback does fuzzy-matching against `Crop` table aliases per language.
- **Voice:** Twilio IVR speech↔text with `mr-IN`, reusing the exact same state machine — no separate logic path for voice.
- **Fallback language:** defaults to Marathi, never silently falls back to English.
- **Numbers/dates/currency:** `Intl.NumberFormat('mr-IN', { style: 'currency', currency: 'INR' })`-style formatting.

---

## 11. Recommendation Engine

```
Input (farmerId, districtId, season, optional cropId filter)
  → Validation (zod)
  → Feature extraction: latest WeatherData, CropSeason windows, 30-day MandiPrice trend,
    FarmerProfile.landSizeAcres
  → Rules engine: each candidate crop scored 0–100 via weighted rule contributions
  → Scoring: normalize, rank top N
  → Recommendation: top crop(s) + suitabilityScore
  → Explanation: human-readable string built directly from the rules that fired
```

**Example rules:**
```
RULE: low_rainfall_high_water_crop
  IF district.rainfall_last_30d < 50mm AND crop.waterReq == HIGH
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

```ts
function generateAdvisory(farmer: FarmerProfile, candidateCrops: Crop[]): Advisory[] {
  const weather = getLatestWeather(farmer.districtId);
  return candidateCrops.map(crop => {
    let score = 50;
    const fired: RuleResult[] = [];
    for (const rule of RULES) {
      const result = rule.evaluate({ farmer, crop, weather });
      if (result.applies) { score += result.delta; fired.push(result); }
    }
    score = clamp(score, 0, 100);
    const reason = fired.map(r => r.reasonText).join(' ');
    return { cropId: crop.id, suitabilityScore: score, reason, ruleTrace: fired };
  }).sort((a, b) => b.suitabilityScore - a.suitabilityScore);
}
```

`ruleTrace` is stored verbatim in `Advisory.ruleTrace` — both the farmer's WhatsApp reply and the admin dashboard can show "why," directly answering the most common judge question: "how do you know this recommendation is trustworthy?"

---

## 12. ML Layer

| Use case | Features | Approach |
|---|---|---|
| Price trend prediction | Historical `MandiPrice.modalPrice` (30–90 days), seasonality | Linear regression / moving average per crop-mandi pair |
| Demand prediction | `BuyerRequirement` posting counts over time | Rolling-window trend |
| Crop ranking refinement | Rule score + predicted trend as extra weighted input | `finalScore = 0.8 * ruleScore + 0.2 * mlSignal` |

```
Training data: MandiPrice history (queried from Postgres)
  → Feature engineering: rolling averages, day-of-season, district
  → Train offline (scheduled monthly script, no real-time training)
  → Versioned model artifact
  → Inference: worker loads latest versioned model, exposes predictTrend(cropId, mandiId)
  → Evaluation: back-tested before being marked "active"
  → Fallback: no model / low confidence → mlSignal = 0, rules result used unmodified
```

**Constraint:** recommendation and matching must be complete and correct with ML entirely disabled — enforced via `try/catch` around ML inference that logs and degrades, never blocks.

---

## 13. Mandi Price Data Pipeline

```
data.gov.in Mandi Price API
  → Scheduled job (BullMQ repeatable, every 6 hours)
  → 'price-ingestion' queue → Worker
  → Validation (zod)
  → Normalization (mandi/crop name → internal IDs via alias map)
  → Deduplication (upsert on unique (mandiId, cropId, priceDate))
  → PostgreSQL insert
  → Redis cache update (latest:price:{cropId}:{mandiId}, TTL = next refresh window)
  → DataIngestionJob row recorded
```

```ts
export async function priceIngestionProcessor(job: Job) {
  const jobLog = await createIngestionJobRecord('PRICE');
  try {
    const raw = await mandiApiClient.fetchLatest();
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
    throw err;
  }
}
```

BullMQ options: `{ attempts: 5, backoff: { type: 'exponential', delay: 5000 } }`. On repeated failure, the last cached price keeps serving — never a hard failure surfaced to the farmer (also doubles as demo failure-proofing).

---

## 14. Weather Data Pipeline

```
IMD / weather API
  → Scheduled ingestion (twice daily)
  → Location mapping: district centroid lat/long (static seed)
  → 'weather-ingestion' queue → Worker
  → Store forecast=true (next 3–5 days) and forecast=false (observed)
  → Redis cache: latest:weather:{districtId}, TTL ~6h
  → On API failure: serve last cached/observed value; log DataIngestionJob FAILED
```

Weather reaches the recommendation engine purely via `getLatestWeather(districtId)` (Redis-first, Postgres fallback) — the recommendation engine never talks to the external API directly.

---

## 15. Buyer/FPO Matching Engine

| Factor | Weight |
|---|---|
| Crop compatibility | gate (must match) |
| Location proximity | 20% |
| Quantity fit | 15% |
| Price compatibility | 15% |
| Quality match | 10% |
| Harvest timing fit | 10% |
| *(remaining weight reserved for crop-compatibility strength on partial/grade substitutes)* | 30% |

Weights live in a `MatchConfig` table/JSON, not hardcoded — different pilot districts/crops (perishables vs storable grains) may need proximity weighted higher or lower than price, and this must be tunable without a redeploy.

```
New SellIntent OR new BuyerRequirement created
  → enqueue 'buyer-matching' job
  → Worker loads candidates: same cropId, isActive/OPEN, same district or within radiusKm
  → For each pair, compute weighted score
  → Persist Match rows (upsert on unique pair) with scoreBreakdown JSON
  → Top candidates (score above threshold, e.g. 0.5) surfaced
```

```ts
function scoreMatch(intent: SellIntent, req: BuyerRequirement): MatchScoreResult {
  if (intent.cropId !== req.cropId) return { score: 0, breakdown: {} };

  const locationScore = computeLocationScore(intent.farmer.districtId, req.districtId, req.radiusKm);
  const quantityScore = 1 - Math.min(Math.abs(intent.quantityKg - req.quantityKg) / req.quantityKg, 1);
  const priceScore = req.maxPrice ? clamp(1 - (intent.expectedPrice - req.maxPrice) / req.maxPrice, 0, 1) : 0.5;
  const qualityScore = intent.quality === req.minQuality ? 1 : 0.5;
  const timingScore = computeTimingFit(intent.harvestDate, req.neededByDate);

  const score =
    0.20 * locationScore + 0.15 * quantityScore + 0.15 * priceScore +
    0.10 * qualityScore + 0.10 * timingScore + 0.30 * 1.0;

  return { score, breakdown: { locationScore, quantityScore, priceScore, qualityScore, timingScore } };
}
```

---

## 16. Transaction System

```
Farmer selects a Match candidate
  → POST /transactions { matchId, quantityKg, agreedPrice? }
  → Validate: Match exists, no existing Transaction, SellIntent still OPEN
  → DB transaction: create Transaction(REQUESTED) + TransactionStatusHistory(null→REQUESTED)
    + mark SellIntent.status = MATCHED
  → Enqueue notification to buyer
  → Buyer: Accept → status ACCEPTED + history row + close/decrement BuyerRequirement
           Reject → status REJECTED + history row → SellIntent reopened → optional re-match
  → IN_PROGRESS / COMPLETED advanced manually by either party
  → CANCELLED available to farmer/admin at any pre-COMPLETED state
```

States: `REQUESTED → MATCHED → PENDING_BUYER → ACCEPTED → IN_PROGRESS → COMPLETED`, with `REJECTED`/`CANCELLED` as terminal off-ramps.

**Concurrency:** every transition runs inside a single `prisma.$transaction([...])`, guarded by `WHERE status = <expectedCurrentStatus>` (optimistic concurrency) — a losing concurrent request (e.g., double-tap Accept) affects zero rows and returns `409 Conflict`.

---

## 17. Background Jobs

| Queue | Producer | Trigger | Purpose |
|---|---|---|---|
| `price-ingestion` | scheduler | every 6h | Pull + store mandi prices |
| `weather-ingestion` | scheduler | 2x/day | Pull + store weather |
| `recommendations` | API | farmer requests advisory | Async-safe path (can be sync in MVP) |
| `buyer-matching` | API | new SellIntent/BuyerRequirement | Recompute match candidates |
| `notifications` | any service | any user-facing event | Send WhatsApp/email/dashboard notification |
| `whatsapp` | webhook handler | every inbound message needing a reply | Outbound send, decoupled from webhook latency |
| `cleanup` | scheduler | daily | Expire stale intents/requirements, purge old context |

```ts
new Worker('price-ingestion', priceIngestionProcessor, { connection: redisConnection, concurrency: 2 });
queue.add('ingest', {}, {
  attempts: 5,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: 100,
  removeOnFail: false, // keep visible on admin system-health page
});
```

Failed jobs stay visible (no auto-removal) for manual re-trigger from `/admin/system-health` — no separate DLQ infra needed at this scale.

---

## 18. Redis Architecture

| Use | Key pattern | TTL |
|---|---|---|
| BullMQ backing store | managed internally | n/a |
| Latest mandi price cache | `latest:price:{cropId}:{mandiId}` | 6h |
| Latest weather cache | `latest:weather:{districtId}` | 6h |
| Rate limiting | `ratelimit:{ip or userId}:{route}` | rolling window |
| Conversation read-cache | `conv:{userId}` | 5 min |
| Per-conversation lock | `lock:conv:{conversationId}` | few seconds |

**PostgreSQL = source of truth. Redis = cache/queue/temporary infrastructure.** A full Redis flush should degrade performance, never correctness.

---

## 19. Error Handling

```ts
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

Standard response:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid input", "details": { "field": "quantityKg", "issue": "must be positive" } } }
```

Central handler maps `AppError` subclasses to status codes; unrecognized errors are logged with full stack + `requestId` and returned as generic `500 INTERNAL_ERROR`. Prisma known-error codes (e.g. `P2002` unique violation) are translated into `ConflictError` at the repository boundary.

---

## 20. Validation

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

Environment variables validated once at boot (`envSchema.parse(process.env)`) — the app refuses to start misconfigured. External API responses (mandi/weather) also pass through a zod schema before being trusted.

---

## 21. Logging + Observability

- **Structured logging:** Pino, JSON output, one child logger per request carrying a `requestId`.
- **Levels:** `error` (needs attention), `warn` (degraded/fallback paths, e.g. ML unavailable), `info` (business events), `debug` (dev only).
- **Request IDs** flow through every log line, returned as `X-Request-Id` header.
- **Error IDs:** unexpected 500s get a unique `errorId` logged server-side and shown to the user.
- **Metrics:** API latency and queue failures logged as structured events, queryable in the hosting platform's log viewer — appropriately scoped for SIH, no separate Prometheus/Grafana stack.
- **Audit logs:** every state-changing `Transaction` action, auth event, and admin action inserts an `AuditLog` row.

---

## 22. Security

Priority order for MVP:

1. **Password hashing:** bcrypt, cost 12, never plaintext.
2. **JWT security:** short-lived access tokens (15 min), `alg` pinned to `HS256`.
3. **Refresh token security:** httpOnly, secure, `SameSite=Strict`, rotated on every use, hashed at rest.
4. **CORS:** explicit allow-list of the deployed dashboard origin only.
5. **Helmet:** standard secure headers.
6. **Rate limiting:** per-IP/per-user on auth endpoints and the WhatsApp webhook.
7. **Input validation:** zod on every boundary.
8. **SQL injection prevention:** Prisma's parameterized queries; raw SQL avoided.
9. **Webhook verification:** `X-Hub-Signature-256` HMAC check mandatory.
10. **RBAC:** enforced at middleware layer on every route.
11. **Secrets:** never committed; injected via platform secret manager.
12. **HTTPS:** enforced by hosting platforms.
13. **Audit logs:** as above.
14. **Dependency security:** `npm audit`/Dependabot checked before each deploy.

---

## 23. Environment Variables

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

## 24. Local Development

```bash
git clone https://github.com/<org>/kisan-setu.git && cd kisan-setu
npm install
docker compose up -d postgres redis
cp apps/api/.env.example apps/api/.env
npm run --workspace apps/api prisma:migrate:dev
npm run --workspace apps/api prisma:seed
npm run --workspace apps/api dev        # terminal 1
npm run --workspace apps/worker dev     # terminal 2
```

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

**Development:** only `postgres`+`redis` run in Docker; `api`/`worker` run natively for fast hot-reload.
**Production:** `api` and `worker` each get a slim multi-stage Dockerfile (`node:20-alpine`, `npm ci --omit=dev`, `npx prisma generate`, `npm run build`, `CMD node dist/index.js`) — two images from the same monorepo, deployed as two separate services so a worker crash never takes the API down.

---

## 25. Testing

| Layer | Tool | What's tested |
|---|---|---|
| Unit | `node:test` | Recommendation rule functions, matching score calculator, formatters — pure functions, no DB |
| Integration | Supertest + dedicated test Postgres DB | Full API round-trip: auth flow, transaction state transitions, RBAC enforcement |
| E2E | Scripted scenario walkthrough | Simulated WhatsApp payloads → recommendation → sell intent → match → buyer accepts → transaction COMPLETED |

**Priority given limited time:**
1. Transaction state machine transitions (the judged differentiator — must never break live).
2. Matching score correctness on a known fixture set.
3. Auth/RBAC boundaries.
4. WhatsApp webhook idempotency (duplicate message doesn't double-create a transaction).

---

## 26. Seed/Demo Data

`prisma/seed.ts` creates:
- 3 districts (e.g., Nashik, Pune, Ahmednagar) with static lat/long
- 8–10 crops with realistic `waterReq` and `CropSeason` windows
- 3–4 mandis per district
- 60 days of synthetic-but-trend-realistic `MandiPrice` history per crop-mandi pair
- 14 days observed + 5 days forecast `WeatherData` per district
- ~15 farmer `User`+`FarmerProfile` rows
- 5 buyers with varied `BuyerRequirement`s
- 2 FPOs with member farmers
- Pre-existing `Transaction`s in mixed states so the dashboard isn't empty on load
- **One named "hero" farmer with no pre-existing sell intent** — reserved for the live demo

`SEED_DEMO_DATA=true` gates the demo-only fixtures so production and demo environments share one seed script safely.

---

## 27. Deployment Architecture

```
Internet
  ↓
Vercel (Dashboard — CDN)          ← frontend team's deploy target
  ↓ (API calls, CORS-restricted)
Render/Railway (API — Node/Express container)
  ↓
Managed PostgreSQL (Render/Railway/Neon)
  ↓
Managed Redis (Render/Railway/Upstash)
  ↓
Render/Railway (Worker — separate container, same image, different CMD)
  ↓
External APIs (WhatsApp Cloud API, Twilio, IMD/weather, data.gov.in)
```

- **API:** Render/Railway web service, secrets via platform env config, `GET /health` wired to liveness probe.
- **Worker:** separate *background worker* service type (no public port) from the same repo/image.
- **Database/Redis:** managed add-ons — no self-hosted DB maintenance.
- **Webhook URL:** stable public HTTPS URL registered in Meta's App Dashboard early, not on demo day.
- **Health checks:** `/health` reports DB+Redis connectivity for both the platform and the admin system-health page.

---

## 28. CI/CD

```yaml
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

Branches: `main` (production, auto-deploy), `develop` (staging, auto-deploy), short-lived `feature/*` merged via PR + 1 review. Secrets in GitHub Actions secrets + platform secret store. Deploy trigger is the platform's native git-integration — CI only gates merges.

---

## 29. Database Migration + Backup

- **Migrations:** `prisma migrate dev` locally, `prisma migrate deploy` as a pre-deploy step in production.
- **Seed scripts:** run once in production for reference data (districts/crops/mandis) only; `SEED_DEMO_DATA=true` gates demo-only fixtures.
- **Backups:** managed Postgres provider's automated daily backups/PITR; a manual `pg_dump` before the live demo as a cheap extra safety net.
- **Migration safety:** additive migrations preferred during the build phase; destructive changes reviewed by 2+ teammates.

---

## 30. API Documentation

OpenAPI/Swagger spec generated from zod validators + route definitions (`zod-to-openapi` or hand-maintained `openapi.yaml`), served at `/api/v1/docs` via `swagger-ui-express`. Every endpoint documents path, method, auth, request/response schema, and example payloads matching Section 7. This spec is the shared contract the frontend team builds against.

---

## 31. Performance + Scalability

**Required for MVP:** indexes on every FK/hot filter column, Redis caching for price/weather lookups, pagination on all list endpoints (`?page&pageSize`, default 20), rate limiting on public/webhook endpoints, Prisma's built-in connection pooling.

**Deferred to future scale:** horizontal API scaling behind a load balancer (already stateless via JWT, so a deploy-config change not a code change), worker pool scaling per queue, read replicas for analytics, table partitioning for `MandiPrice`/`WeatherData` by month.

---

## 32. Data Consistency

| Concern | Mechanism |
|---|---|
| Transaction state transitions | Single `prisma.$transaction()` per transition, optimistic `WHERE status = expected` guard |
| Buyer acceptance race | `Match`→`Transaction` is 1:1 (`matchId @unique`); a losing concurrent request gets a unique-violation mapped to `409 CONFLICT` |
| Quantity tracking | `BuyerRequirement.quantityKg` decremented only inside the same DB transaction that accepts |
| Duplicate requests | Idempotent upserts on `Match`, `MandiPrice`; `Message.externalMsgId` unique |
| WhatsApp webhooks | Per-conversation Redis lock serializes rapid-fire messages |
| Matching re-scans | Idempotent — recomputes and upserts, never duplicates |

Row-level locking is intentionally avoided in MVP scope — the unique-constraint + optimistic-status-guard pattern covers every realistic race in this domain.

---

## 33. Demo Failure-Proofing

| Failure | Fallback |
|---|---|
| Weather API down | Last cached `WeatherData` from Redis/Postgres, else seeded data flagged `source: 'seed'` |
| Mandi API down | Same pattern via Redis cache then latest seeded `MandiPrice` row — identical code path |
| WhatsApp API down/rate-limited | Pre-recorded backup video; live dashboard portion still demoed |
| Redis down | API degrades to reading Postgres directly for cache-miss paths |
| ML unavailable | Silent, zero-impact — rules-only path is the default, not a bolted-on fallback |
| Unstable internet | `DEMO_MODE=true` makes ingestion jobs skip external calls and re-assert seed data, runnable fully offline |
| Rate limit mid-demo | Handled identically to downtime via the caching layer |

**Principle:** every external dependency has a cache-or-seed fallback the core code path already uses in the happy path — no separate demo-mode logic to maintain.

---

## 34. Role & Six-Week Plan (Backend-Relevant Slice)

| Role | Responsibilities |
|---|---|
| **Backend Engineer** | Auth, farmers/buyers/FPO modules, transaction system, error handling, validation, migrations |
| **Recommendation/Data Engineer** | Recommendation engine, matching engine, mandi/weather ingestion pipelines, ML layer, seed data |
| **Integration/DevOps Engineer** | WhatsApp module, conversation state machine, regional language files, deployment, CI/CD, demo failure-proofing |

**Week-by-week (backend scope):**
- **Week 1:** repo scaffold, Prisma schema + migration, auth end-to-end.
- **Week 2:** farmers/buyers/FPO CRUD, RBAC middleware.
- **Week 3:** mandi/weather ingestion pipelines, BullMQ queues + workers, scheduler.
- **Week 4:** recommendation engine + matching engine, unit tests on scoring logic.
- **Week 5:** WhatsApp module (webhook, state machine, Cloud API client), transaction accept/reject flow.
- **Week 6:** production deploy, `DEMO_MODE` fallback flag, final seed data, full E2E rehearsal.

---

## 35. Backend Definition of Done

- [ ] All API endpoints (Section 7) implemented, error responses standardized, `/health` live
- [ ] Auth + RBAC enforced across every protected route
- [ ] WhatsApp conversational flow works end-to-end on a real number, idempotency verified
- [ ] Marathi flow verified working, English fallback verified
- [ ] Weather + mandi ingestion pipelines populate real or seeded data reliably
- [ ] Recommendation engine returns scored, explained advisory for 5+ crops
- [ ] Buyer matching returns ranked, explained candidates
- [ ] Transaction lifecycle (request → accept/reject → complete) works with correct concurrency handling
- [ ] PostgreSQL + Redis deployed in production; worker deployed as a separate service
- [ ] Backend API deployed and publicly reachable over HTTPS
- [ ] `DEMO_MODE` fallback tested by killing each external dependency once in staging

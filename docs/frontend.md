# Kisan Setu — Frontend Development Roadmap (Dashboard)
### Buyer / FPO / Admin / Government-Evaluator Web Dashboard — React + Vite + Tailwind

> Companion document to `kisan-setu-master-blueprint.md`. This roadmap covers **only** `apps/dashboard` — the web frontend. Farmers are served entirely over WhatsApp (Section 10 of the blueprint) and have **no web UI**; do not build farmer-facing pages.

---

## 0. Ground Truth Extracted From the Blueprint

Before any planning, here is what this roadmap is built against — do not deviate from these facts:

- **Roles that use the dashboard:** `BUYER`, `FPO`, `ADMIN`, `GOVERNMENT_EVALUATOR`. `FARMER` never logs into the dashboard (WhatsApp-only, OTP-based if ever added — out of scope here).
- **Auth:** email/password, JWT access token (15 min, in-memory) + httpOnly refresh cookie (7 days, rotated). No forgot-password/OTP endpoint exists yet in the API contract — flagged as a **Should Have** gap to build UI for defensively (Section 13).
- **API base path:** `/api/v1`, bearer token auth, standardized error shape `{ error: { code, message, details } }`.
- **Core loop the frontend must visually sell:** Buyer sees an incoming transaction request → Accepts → Farmer notified on WhatsApp → Admin Overview KPI ticks up. This is the single most important interaction in the entire dashboard (Section 31 of blueprint).
- **Device priority:** laptop/tablet first (blueprint Section 21 says so explicitly) — buyers, FPOs, and admins are professional/institutional users, not farmers on cheap phones. Mobile support is still required but is secondary polish, not primary layout target.
- **Team context:** 4-person team, you are Frontend Engineer #2, consuming an OpenAPI spec the Backend Engineer owns. You must be able to build against **mocked** responses starting Week 2, before the real API exists.

---

## 1. Technology Stack & Library Justification

### 1.1 Core Stack (fixed — do not deviate)

| Layer | Choice |
|---|---|
| Language | JavaScript (JSX) |
| Build tool | Vite |
| Framework | React 18 |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Server state | TanStack Query v5 |
| Client/UI state | Zustand |
| Forms | React Hook Form |
| Validation | Zod |
| Components | shadcn/ui (built on Radix UI) |

### 1.2 Full Library Table

| Library | Used For | Why This Project | Free/OSS | Where |
|---|---|---|---|---|
| **shadcn/ui + Radix UI** | Button, Input, Select, Dialog, Tabs, Dropdown, Popover, Tooltip, Table primitives | Accessible-by-default (Radix), copy-into-repo model means no bundle bloat and full styling control to match agri-tech theme; fastest path to a professional SaaS look | Yes | Every page — this is the component foundation |
| **Lucide React** | All icons | Consistent, clean icon set; matches shadcn's default icon language | Yes | Navbar, sidebar, KPI cards, buttons, empty states |
| **React Hook Form** | All forms (login, requirement posting, bundle transaction) | Uncontrolled-input performance, minimal re-renders, integrates natively with Zod | Yes | Auth pages, Buyer Requirement form, FPO Bundle form |
| **Zod** | Form + env var validation | Mirrors backend's Zod schemas (Section 23 of blueprint) — same *shape*, not duplicated logic, so frontend/backend validation never drifts silently | Yes | `schemas/`, forms, `.env` validation |
| **React Router v6** | Routing, role-guarded routes, nested layouts | Standard, well-documented, supports nested layouts cleanly for `/admin/*`, `/buyer/*`, `/fpo/*` trees | Yes | `routes/` |
| **TanStack Query** | All server-state fetching/caching (KPIs, transactions, farmers, prices) | Explicitly named in blueprint Section 21; free caching, retries, background refetch — critical for a dashboard with live-ish KPIs during a demo | Yes | `api/` hooks, every data-driven page |
| **Zustand** | Auth session state (`user`, `accessToken`) | Explicitly named in blueprint Section 21; minimal boilerplate vs Redux, access token deliberately kept in memory only (XSS mitigation) | Yes | `store/authStore.js` |
| **Recharts** | Overview KPI trend charts, transaction funnel, price trend line, district heatmap bar | Composable, good defaults, easy to theme with Tailwind colors, handles the funnel/line/bar charts the Admin Overview needs | Yes | Admin Overview, Analytics, Market Prices pages |
| **date-fns** | Date formatting, "harvest date within 2 weeks," relative timestamps | Lightweight, tree-shakeable, avoids Moment.js bloat | Yes | Transactions, Advisory Activity, notifications |
| **clsx + tailwind-merge** | Conditional className composition | Standard shadcn/ui pairing (`cn()` utility) — required by every shadcn component | Yes | `lib/utils.js`, all components |
| **Sonner** | Toast notifications (accept/reject success, API errors, session expiry) | Cleaner API and nicer default animation than react-hot-toast; drop-in shadcn-recommended toaster | Yes | Global, mounted once in `App.jsx` |
| **Framer Motion (motion)** | Page-load fade-ins, KPI number count-up, modal/drawer transitions, request-accepted micro-animation | Used sparingly — see Section 18 — to make the Accept-transaction moment (the demo's climax) feel premium without being distracting | Yes | Transaction accept flow, Overview KPI cards, modals |
| **React Leaflet + Leaflet** | District/mandi location context on Farmers/Transactions detail (optional map pin), District adoption heatmap base map | Free, no API key required (unlike Google Maps), works fully offline with cached tiles if venue Wi-Fi fails (matches blueprint's `DEMO_MODE` philosophy) | Yes | Admin Analytics (district heatmap), optional farmer/buyer location display |
| **js-cookie** *(tiny, optional)* | Reading non-httpOnly convenience cookies if ever needed | Only if the refresh flow needs a client-readable flag; otherwise skip — httpOnly cookie is handled entirely server-side | Yes | `lib/` (only if needed) |

**Deliberately excluded:** Swiper/Embla (no carousels in this product), React Markdown (no markdown content), rich text editors (no CMS-like content in scope). Do not install these — they add nothing here.

---

## 2. Project Understanding (Extracted & Organized)

### 2.1 Problem Being Solved
Farmers get advisory, prices, and buyer contacts as three disconnected tools. Kisan Setu closes the loop with a WhatsApp farmer channel + a web dashboard where **Buyers accept real transaction requests** and **Admins/Government see closure as a measurable KPI**, not just advisory usage.

### 2.2 Dashboard Personas (frontend scope only)

| Persona | Primary Goal on Dashboard | Login |
|---|---|---|
| **Buyer** | Post crop requirements, review incoming farmer-matched requests, accept/reject, track transaction history | Email/password |
| **FPO Admin** | View member farmers, see aggregated demand, bundle multiple farmers into one transaction, monitor all member transactions | Email/password |
| **Admin (Kisan Setu ops)** | Full visibility: farmers, buyers, FPOs, crops, prices, weather, recommendations, transactions, system health | Email/password |
| **Government Evaluator** | Read-only Overview + Analytics for outcome reporting (no write access) | Email/password |

### 2.3 Feature Prioritization (MoSCoW)

**Must Have (demo-critical, build first)**
- Login/logout, protected + role-based routing
- Buyer: Post/edit requirement, Incoming Requests list, Accept/Reject action, My Transactions
- Admin: Overview KPIs (the funnel + GMV), Transactions list, Farmers (read-only), System Health
- Global: loading/error/empty states, toast notifications, responsive layout

**Should Have**
- FPO: Farmers tab, Demand tab, Bundle Transaction flow
- Admin: Buyers, FPOs, Crops, Market Prices, Weather, Recommendations, Advisory Activity, Analytics (district drilldown)
- Forgot-password UI (defensive — backend contract not yet defined; build the screen, stub the call)
- CSV export on Admin tables

**Nice to Have**
- District heatmap map (Leaflet)
- Dark mode
- Notification bell with live unread count
- PDF export of Analytics

### 2.4 Non-UI-Relevant Requirements Confirmed Out of Scope for This Dashboard
Farmer WhatsApp flow, recommendation/matching *algorithm* internals, background job processors, database, ML layer — all backend/DevOps work per Section 40 of the blueprint. The frontend only **displays** their outputs.

---

## 3. Complete Page Inventory

> Route prefix convention: `/admin/*`, `/buyer/*`, `/fpo/*`, all wrapped by role-checked `ProtectedRoute`. `GOVERNMENT_EVALUATOR` reuses `/admin/*` routes in read-only mode (see Section 10).

### 3.1 `/login`
```
Public. Layout: AuthLayout (centered card, no nav).
├── Kisan Setu logo + tagline
├── Email input
├── Password input (show/hide toggle)
├── "Forgot password?" link → /forgot-password
├── Submit button ("Log in")
├── Error banner (invalid credentials)
└── Loading state: button shows spinner, disabled
API: POST /auth/login
On success: store {user, accessToken} in Zustand → redirect by role:
  ADMIN/GOVERNMENT_EVALUATOR → /admin/overview
  BUYER → /buyer/dashboard
  FPO → /fpo/dashboard
Mobile: full-width card, no side illustration. Desktop: card + left-side illustration panel.
```

### 3.2 `/forgot-password` (Should Have — UI built, API stubbed)
```
Public. Layout: AuthLayout.
├── Email input
├── Submit ("Send reset link")
├── Success state: "Check your email" confirmation panel
API: not in current backend contract — call is wrapped in try/catch and shows
     a generic "If this account exists, a reset link was sent" message either way
     (do not leak account existence; also gracefully degrades until backend ships it).
```

### 3.3 `/unauthorized`
```
Public (reachable by any authenticated user hitting a route their role can't access).
├── 403 illustration/icon
├── "You don't have access to this page" message
├── "Back to my dashboard" button → role-based home
```

### 3.4 `/404`
```
Public. Catch-all route.
├── 404 illustration
├── "Page not found"
├── "Back to dashboard" button
```

### 3.5 `/admin/overview` (Admin, Government Evaluator — read only)
```
Layout: DashboardLayout (Sidebar + Topbar).
Header
├── Page title "Overview"
├── Date-range selector (Last 7 / 30 / 90 days)
├── Notification bell (unread count badge)
└── Profile dropdown (name, role, logout)

KPI Grid (6 cards, responsive 3x2 → 2x3 → 1x6)
├── Total Farmers Reached (count + delta vs prior period)
├── Advisories Delivered (7/30-day count)
├── Active Sell Intents (open, awaiting match)
├── Transactions Funnel mini-view (Requested→Accepted→Completed counts)
├── Estimated GMV Closed (₹, sum of COMPLETED transactions)
└── Data Pipeline Health (green/yellow/red dot + "last ingestion: Xm ago")

Main Content (2-column on desktop, stacked on mobile)
├── Left: Transaction Funnel chart (Recharts funnel/bar: Requested→Matched→Accepted→Completed)
├── Right: District-wise Adoption list/bar (top 5 districts by farmer count)
└── Below: Recent Transactions table (last 10, status badge, link to /admin/transactions/:id)

Actions
├── "Export report" button (CSV) — disabled with tooltip if no data in range
└── "View all transactions" link → /admin/transactions

States: Loading = 6 skeleton KPI cards + skeleton chart. Empty = friendly "No activity in
this range yet" (unlikely given seed data, but must exist). Error = retry banner, does not
crash the rest of the shell (error boundary scoped per widget, not whole page).
API: GET /admin/overview, GET /admin/analytics (for the funnel/district data)
Auth: ADMIN, GOVERNMENT_EVALUATOR (evaluator sees identical page, all export/action
      buttons hidden via role check, not just disabled — Section 25 RBAC note applies:
      still enforce server-side, frontend hiding is UX only)
```

### 3.6 `/admin/farmers` and `/admin/farmers/:id`
```
/admin/farmers
Header: title + search (by name/phone/village) + district filter dropdown
Table columns: Name, Phone, District/Taluka, Preferred Language, FPO (if any),
  Advisories Count, Last Active, Actions (View)
Pagination: 20/page, page controls bottom
Empty state: "No farmers match your filters" + clear-filters button
Loading: table skeleton rows (8 rows)
Mobile: table collapses to stacked cards (name+phone header, details below)

/admin/farmers/:id
├── Farmer profile header (name, phone, district, language, land size)
├── Tabs: Advisory History | Sell Intent History
│   ├── Advisory History: list of past advisories (crop, score, date, reason snippet)
│   └── Sell Intent History: list with status badges, linked Transaction if converted
API: GET /farmers/:id, GET /farmers/:id/advisories, GET /farmers/:id/sell-intents
Auth: ADMIN, FPO (own members only — enforced server-side)
```

### 3.7 `/admin/buyers`
```
Header: title + search + "Requirement status" filter (Active/Inactive)
Table: Buyer name/org, Crop(s) required, Quantity, Price range, District/radius,
  Status badge, Actions (View requirement)
Row click → modal or drawer with full BuyerRequirement detail
Empty/Loading/Error: same pattern as Farmers table
API: (admin-level list not explicitly in Section 8's contract — built by aggregating
     GET /buyers/requirements per buyer, OR flagged to Backend Engineer as a needed
     GET /admin/buyers endpoint; document this as an API gap, do not silently assume)
Auth: ADMIN
```

### 3.8 `/admin/fpos`
```
Header: title + search
Table: FPO name, Member Count, District, Active Bundles, Actions (View)
Row click → /admin/fpos/:id showing member list + bundle transaction history
API: same gap-flag as Buyers — GET /admin/fpos not in current contract; list is
     assembled client-side from known FPO ids for MVP, or requested from backend.
Auth: ADMIN
```

### 3.9 `/admin/crops`
```
Header: title + "Add Crop" button (if admin-write is in scope; else read-only list)
Table: Crop name, Category, Water Requirement, Active Seasons (chips), Actions
Detail drawer: CropSeason windows table (season name, sowing window, harvest window)
API: GET /crops, GET /crops/:id/seasons
Auth: ADMIN (read for all; write deferred — Should Have)
```

### 3.10 `/admin/market-prices`
```
Header: Crop selector + District/Mandi selector + date range
Main: Line chart (Recharts) of modal price trend over selected range
Below: Table of raw price points (Mandi, Date, Modal Price, Min, Max)
Empty state: "No price data for this crop/mandi combination"
Loading: chart skeleton + table skeleton
API: GET /market/prices/latest, GET /market/prices/history
Auth: ADMIN (latest is public per contract, history requires ADMIN)
```

### 3.11 `/admin/weather`
```
Header: District selector
Cards: Current conditions (temp, rainfall, humidity icons)
Chart: 14-day observed + 5-day forecast (Recharts area chart)
API: GET /weather/:districtId/latest, GET /weather/:districtId/history
Auth: ADMIN (latest public, history ADMIN-only)
```

### 3.12 `/admin/recommendations`
```
Header: Farmer search (by phone/name) or Farmer id
Main: latest Advisory card — crop, suitabilityScore (large %, color-coded),
  full explanation text (the rule-based reasoning string), timestamp
History list below: prior advisories for that farmer
Empty state: "No advisories yet for this farmer"
API: GET /recommendations/:farmerId/latest, GET /farmers/:id/advisories
Auth: ADMIN, FPO (own members)
```

### 3.13 `/admin/transactions` and `/admin/transactions/:id`
```
/admin/transactions
Header: title + Status filter tabs (All/Requested/Matched/Accepted/In Progress/
  Completed/Rejected/Cancelled) + search by farmer/buyer name + date range
Table: Farmer, Buyer, Crop, Quantity, Agreed Price, Status badge, Created date, Actions(View)
Pagination, Empty, Loading, Error — same patterns as Farmers table

/admin/transactions/:id
├── Header: Transaction id, current status badge (large, color-coded)
├── Summary card: Farmer, Buyer, Crop, Quantity, Agreed Price, Match Score
├── Status Timeline (vertical stepper): every TransactionStatusHistory entry with
│   timestamp and actor — this is the auditability feature, make it visually clear
├── Actions (ADMIN only): Cancel transaction (if not COMPLETED/CANCELLED already)
└── Related Match details (score breakdown: location/quantity/price/quality/timing —
    shown as small horizontal bar chart, reusing the SAME explanation pattern as
    Advisory, since blueprint explicitly frames both as "explainable")
API: GET /transactions?role=..., GET /transactions/:id, PATCH /transactions/:id/cancel
Auth: ADMIN (full), participant roles see only their own via /buyer or /fpo routes below
```

### 3.14 `/admin/analytics`
```
Header: District filter, Date range filter
Charts (Recharts):
├── Transactions funnel by stage (bar)
├── GMV trend over time (line)
├── District adoption heatmap (bar ranked, OR Leaflet choropleth if time permits)
└── Advisory delivery volume over time (line)
Export: "Download CSV" / "Download PDF" buttons (Should Have)
API: GET /admin/analytics?district&dateRange
Auth: ADMIN, GOVERNMENT_EVALUATOR (export buttons hidden for evaluator role — or kept,
      since evaluators are exactly who needs the export; keep visible for this role)
```

### 3.15 `/admin/system-health`
```
Header: title + "Refresh" button
Table: Job Type (price-ingestion, weather-ingestion, buyer-matching, notifications,
  whatsapp, cleanup), Last Run, Status (Success/Failed/Running), Queue Depth
Failed job rows: expandable to show error message + "Retrigger" button
Empty state: N/A (always shows all known queues even if no runs yet — show "Never run")
API: GET /admin/system-health
Auth: ADMIN only (not shown to Government Evaluator — operational, not outcome data)
```

### 3.16 `/buyer/dashboard`
```
Layout: DashboardLayout (Buyer nav variant — no Farmers/Admin links).
Header: greeting ("Welcome back, {Buyer Org Name}"), notification bell, profile dropdown
KPI strip (3 cards): Active Requirements, Incoming Requests (pending count, badge-highlighted
  if >0), Transactions Completed
Tabs: Overview | My Requirements | Incoming Requests | My Transactions
Overview tab: recent activity feed (new match, new request, status change) + quick actions
  ("+ Post Requirement" primary button)
API: GET /buyers/requirements, GET /transactions?role=buyer
Auth: BUYER
```

### 3.17 `/buyer/requirements` (list) and `/buyer/requirements/new` + `/buyer/requirements/:id/edit`
```
/buyer/requirements
Header: title + "+ New Requirement" button
Table/Card grid: Crop, Quantity needed, Price range, Quality, District/Radius,
  Status toggle (Active/Inactive switch inline), Actions (Edit)
Empty state: "You haven't posted any requirements yet" + CTA button (primary empty state,
  this is likely the FIRST thing a new buyer sees — make it welcoming, not sparse)

/buyer/requirements/new  and  /buyer/requirements/:id/edit
Form (React Hook Form + Zod), fields:
├── Crop (searchable select, from GET /crops)
├── Quantity needed (number, kg)
├── Max acceptable price (number, ₹/kg, optional)
├── Minimum quality grade (select)
├── District (select) + Radius km (slider or number)
├── Needed-by date (date picker)
├── Submit ("Post Requirement" / "Save Changes")
Validation: all required except max price; quantity/radius positive numbers (Zod,
  mirrors backend's zod shape per blueprint Section 23)
On submit success: toast "Requirement posted" → redirect to /buyer/requirements
API: POST /buyers/requirements, PATCH /buyers/requirements/:id
Mobile: single-column form, sticky submit button at bottom
```

### 3.18 `/buyer/requests` (Incoming Requests — THE demo-critical page)
```
Header: title + Status filter (Pending/Accepted/Rejected)
Card list (not a dense table — this page deserves visual weight since it's the demo climax):
each card shows:
├── Farmer name + district (avatar/initials)
├── Crop + quantity + expected price
├── Match score (visual badge, e.g. "82% match") + "why" expandable detail
│   (location/quantity/price/quality/timing breakdown — small horizontal bars)
├── Requested date/time
├── Accept button (primary, green) / Reject button (secondary, outlined red)
└── On Reject: inline reason textarea (optional) before confirming

Accept flow: click Accept → confirm dialog ("Accept this request for 500kg Soybean
  from Sunita Tai?") → PATCH /transactions/:id/accept → optimistic UI update (card
  moves to "Accepted" with a brief success animation, Section 18) → toast confirmation
  → item disappears from "Pending" filter into "Accepted"
Reject flow: click Reject → dialog with optional reason → PATCH .../reject → toast
  → card removed from Pending

Empty state (Pending filter, none): "No pending requests right now — check back soon"
Loading: 3 skeleton cards
Error: inline error banner per card action (not full-page — one failed accept shouldn't
  hide the rest of the list)
API: GET /transactions?role=buyer (filtered client-side or via query param to REQUESTED/
     MATCHED status), PATCH /transactions/:id/accept, PATCH /transactions/:id/reject
Auth: BUYER
```

### 3.19 `/buyer/transactions` and `/buyer/transactions/:id`
```
Same pattern as /admin/transactions but scoped to this buyer's own transactions,
no Cancel action (Cancel is FARMER/ADMIN only per Section 17 of blueprint), buyer
CAN mark "Complete" (PATCH /transactions/:id/complete) once goods are exchanged.
Status timeline identical component reused from Admin detail page (shared component,
not duplicated — see Section 6).
API: GET /transactions?role=buyer, GET /transactions/:id, PATCH /transactions/:id/complete
Auth: BUYER (own transactions only, enforced server-side)
```

### 3.20 `/buyer/profile`
```
Read-only account info (org name, email, registered district) + "Change password"
form (Should Have — no backend endpoint in current contract; build UI, flag gap).
```

### 3.21 `/fpo/dashboard`
```
Layout: DashboardLayout (FPO nav variant).
KPI strip: Member Farmers, Active Demand Matches, Bundles In Progress
Tabs: Farmers | Demand | Matching/Bundle | Transaction Monitoring
```

### 3.22 `/fpo/farmers`
```
Table: member farmer list (Name, District, Recent Advisory crop, Recent Sell Intent
  status, Actions → View, links into /admin/farmers/:id detail component reused
  read-only for FPO scope)
API: GET /fpo/:id/farmers
Auth: FPO (own org only)
```

### 3.23 `/fpo/demand`
```
Card grid: relevant buyer requirements matching member crops (Crop, Quantity, Buyer
  org, District/radius, Price range) — read-only visibility, "Notify eligible
  farmers" action (Should Have, may just be informational for MVP)
API: GET /fpo/:id/demand
Auth: FPO
```

### 3.24 `/fpo/bundle` (bundle transaction builder)
```
Multi-select interface:
├── Step 1: Select a Buyer Requirement (from Demand tab list)
├── Step 2: Select multiple member farmers' open Sell Intents matching that crop
│   (checkbox list, running total of combined quantity shown live)
├── Step 3: Review — combined quantity vs requirement quantity, price summary
├── Submit: "Create Bundle Transaction"
Validation: combined quantity must be > 0, at least 1 farmer selected
On submit: POST /fpo/:id/bundle-transaction → success toast → redirect to
  /fpo/transactions
Edge case UI: if a farmer's sell intent is withdrawn mid-build, show inline warning
  and recalculate total (mirrors blueprint's Section 2.3 failure case)
API: POST /fpo/:id/bundle-transaction
Auth: FPO (owner)
```

### 3.25 `/fpo/transactions`
```
Same shared Transactions table/detail components as Buyer/Admin, scoped to
transactions involving this FPO's member farmers.
API: GET /transactions?role=fpo, GET /transactions/:id
Auth: FPO
```

### 3.26 `/` (Public Landing Page — SIH judging asset)
```
Not in the backend's role-protected API surface — pure marketing/context page for
judges browsing the live URL before the demo.
├── Hero: "From advisory to a real sale — closing India's agri market-linkage gap"
│   + one-line subtext + CTA "Log in to Dashboard"
├── Four-stage funnel visual (What to grow → What it's worth → Who will buy →
│   How to transact) — directly reuses the blueprint's Section 1.4 narrative
├── "How it works" 3-step strip (Farmer on WhatsApp → Matched to Buyer → Dashboard
│   closes the loop)
├── Stats strip (static or live from /admin/overview if public-safe subset exposed)
├── Footer: Government of Maharashtra / SIH attribution, contact
No auth required, no data fetching dependency for judges evaluating before login.
```

---

## 4. Sitemap & User Flows

### 4.1 Sitemap

```
/  (Landing)
│
├── /login
│   ├── → /admin/overview      (ADMIN, GOVERNMENT_EVALUATOR)
│   ├── → /buyer/dashboard     (BUYER)
│   └── → /fpo/dashboard       (FPO)
│
├── /forgot-password
├── /unauthorized
├── /404 (catch-all)
│
├── /admin
│   ├── /overview
│   ├── /farmers            ├── /farmers/:id
│   ├── /buyers
│   ├── /fpos                ├── /fpos/:id
│   ├── /crops
│   ├── /market-prices
│   ├── /weather
│   ├── /recommendations
│   ├── /transactions        ├── /transactions/:id
│   ├── /analytics
│   └── /system-health
│
├── /buyer
│   ├── /dashboard
│   ├── /requirements        ├── /requirements/new  ├── /requirements/:id/edit
│   ├── /requests             (Incoming Requests)
│   ├── /transactions        ├── /transactions/:id
│   └── /profile
│
└── /fpo
    ├── /dashboard
    ├── /farmers
    ├── /demand
    ├── /bundle
    ├── /transactions        ├── /transactions/:id
    └── /profile
```

### 4.2 User Flow — Buyer (primary demo flow)

```
Buyer
→ / (Landing) → clicks "Log in to Dashboard"
→ /login → enters credentials → submits
→ /buyer/dashboard (sees KPI strip + notification badge on "Incoming Requests")
→ clicks "Incoming Requests" tab / nav item
→ /buyer/requests → sees new pending card (farmer, crop, match score)
→ expands "why this match" breakdown
→ clicks Accept → confirm dialog → confirms
→ optimistic UI: card animates to Accepted, KPI strip updates
→ toast: "Request accepted — farmer notified"
→ (optional) clicks into /buyer/transactions/:id to see status timeline
```

### 4.3 User Flow — Admin (secondary demo flow, closes the loop visually)

```
Admin
→ /login → /admin/overview
→ sees Transaction Funnel widget — "Accepted" count increments (on refresh or
  live if polling is enabled via TanStack Query refetchInterval)
→ clicks "View all transactions" → /admin/transactions
→ filters by status=Accepted → finds the just-accepted transaction
→ clicks row → /admin/transactions/:id → sees full status timeline including
  the REQUESTED → ACCEPTED history entries with timestamps
```

### 4.4 User Flow — FPO (Should Have flow)

```
FPO Admin
→ /login → /fpo/dashboard
→ /fpo/demand → reviews an open buyer requirement
→ /fpo/bundle → selects requirement → selects 3 member farmers' sell intents
  → reviews combined quantity → submits
→ /fpo/transactions → sees new bundle transaction, REQUESTED status
```

### 4.5 User Flow — New Buyer Onboarding (first-time empty state)

```
Buyer registers → /login (post-registration redirect) → /buyer/dashboard
  (all KPIs show 0, friendly empty states, no confusion)
→ clicks primary CTA "+ Post Requirement" (shown prominently since account is new)
→ /buyer/requirements/new → fills form → submits
→ /buyer/requirements → sees the new requirement listed, Active toggle on
→ waits for matches → /buyer/requests stays empty until a farmer converts a match
  ("No pending requests right now" empty state, not an error)
```

---

## 5. Complete Folder Structure — `apps/dashboard/src/`

```
src/
├── assets/                    # logo, illustrations, favicon source
│
├── components/
│   ├── ui/                    # shadcn/ui primitives (Button, Input, Select, Dialog,
│   │                          #   Tabs, Table, Badge, Avatar, Skeleton, Toast, etc.)
│   │                          #   — generated via shadcn CLI, lightly themed, NOT
│   │                          #   hand-built from scratch
│   ├── layout/                # DashboardLayout, AuthLayout, Sidebar, Topbar,
│   │                          #   MobileNav, Footer — structural shells only
│   ├── forms/                 # RequirementForm, LoginForm, BundleTransactionForm
│   │                          #   — RHF+Zod wired, no page-routing logic inside
│   ├── charts/                # FunnelChart, PriceTrendChart, GmvTrendChart,
│   │                          #   WeatherChart, DistrictAdoptionChart — Recharts
│   │                          #   wrappers with project theming pre-applied
│   ├── cards/                 # KpiCard, TransactionCard, RequestCard,
│   │                          #   RequirementCard, FarmerCard
│   └── common/                # StatusBadge, MatchScoreBadge, EmptyState,
│                               #   ErrorState, LoadingSkeleton, ConfirmDialog,
│                               #   StatusTimeline, ScoreBreakdown, Pagination
│
├── pages/                     # route-level components ONLY — compose components,
│   ├── landing/                #   fetch data via hooks, contain no reusable UI logic
│   ├── auth/                  #   (Login, ForgotPassword)
│   ├── admin/                 #   (Overview, Farmers, FarmerDetail, Buyers, Fpos,
│   │                          #    Crops, MarketPrices, Weather, Recommendations,
│   │                          #    Transactions, TransactionDetail, Analytics,
│   │                          #    SystemHealth)
│   ├── buyer/                 #   (Dashboard, Requirements, RequirementForm,
│   │                          #    Requests, Transactions, TransactionDetail, Profile)
│   ├── fpo/                   #   (Dashboard, Farmers, Demand, Bundle,
│   │                          #    Transactions, TransactionDetail, Profile)
│   └── errors/                #   (NotFound, Unauthorized)
│
├── layouts/                   # top-level layout wrappers used by routes/index.jsx
│                               #   (DashboardLayout wraps Sidebar+Topbar+Outlet;
│                               #    AuthLayout wraps centered-card+Outlet)
│
├── routes/
│   ├── index.jsx               # single source of truth: <Routes> tree
│   ├── ProtectedRoute.jsx      # checks auth + role, redirects to /login or /unauthorized
│   └── roleRoutes.js           # role→allowed-path-prefix map (used by ProtectedRoute
│                               #   and by Sidebar to decide which links to render)
│
├── hooks/
│   ├── useAuth.js              # thin wrapper reading Zustand authStore
│   ├── useTransactions.js      # TanStack Query hooks (list/detail/accept/reject/complete)
│   ├── useFarmers.js
│   ├── useBuyerRequirements.js
│   ├── useAdminOverview.js
│   ├── useAdminAnalytics.js
│   ├── useCrops.js
│   ├── useMarketPrices.js
│   ├── useWeather.js
│   ├── useFpo.js
│   └── useDebounce.js          # generic, used by table search inputs
│
├── services/
│   └── apiClient.js            # fetch wrapper: base URL, bearer token attach,
│                               #   401→refresh-then-retry-once, error normalization
│
├── api/                        # one file per backend module, thin functions ONLY
│   ├── auth.api.js             #   (no React, no hooks — pure fetch calls consumed
│   ├── farmers.api.js          #    by the hooks/ layer)
│   ├── buyers.api.js
│   ├── fpo.api.js
│   ├── crops.api.js
│   ├── weather.api.js
│   ├── market.api.js
│   ├── recommendations.api.js
│   ├── transactions.api.js
│   └── admin.api.js
│
├── lib/
│   ├── utils.js                 # cn() (clsx+tailwind-merge), formatCurrency,
│                               #   formatDate (date-fns wrappers)
│   └── queryClient.js           # TanStack QueryClient instance + default options
│
├── store/
│   └── authStore.js             # Zustand: { user, accessToken, setSession, clear }
│
├── schemas/                     # Zod schemas — SAME shape as backend's zod schemas
│   ├── auth.schema.js           #   (login, forgot-password)
│   ├── requirement.schema.js
│   └── bundle.schema.js
│
├── constants/
│   ├── roles.js                 # ROLES enum, role→home-route map
│   ├── transactionStatus.js     # status enum, status→color/label map
│   └── routes.js                # named route path constants (no magic strings)
│
├── context/                     # only if a need arises beyond Zustand+Query
│                               #   (kept empty/unused by default — do not add
│                               #    Context providers for state Zustand/Query
│                               #    already own)
│
├── App.jsx                      # QueryClientProvider, Toaster mount, <RouterProvider>
├── main.jsx
└── index.css                    # Tailwind directives + CSS variables (design tokens)
```

### 5.1 Folder Rationale

| Folder | Exists Because | Belongs There | Does NOT Belong There |
|---|---|---|---|
| `components/ui` | shadcn primitives must stay generic/unopinionated so they're reusable everywhere | Button, Input, Dialog, Table shell | Anything with API calls or business logic |
| `components/cards` | Domain-specific display cards used across multiple pages | KpiCard, TransactionCard | Page-level data-fetching |
| `pages/*` | Route-level composition only | `useTransactions()` calls, layout assembly | Reusable UI markup (extract to components instead) |
| `api/*` | Isolate raw HTTP calls so hooks/tests can mock cleanly | `fetch()` calls, response typing | React hooks, UI state |
| `hooks/*` | TanStack Query wraps every `api/*` call — single place per resource | `useQuery`/`useMutation` definitions | Raw fetch logic (delegate to `api/`) |
| `store/` | Only auth session is truly global; everything else is server state (Query) or local | `authStore` | Transaction lists, form state (those live in Query/RHF) |
| `schemas/` | Mirrors backend Zod shapes per blueprint's own stated philosophy | Zod object schemas | Form UI |

---

## 6. Component Architecture

### 6.1 Global / Layout Components

| Component | Purpose | Build vs Library |
|---|---|---|
| `Sidebar` | Role-aware nav links (reads `roleRoutes.js`), collapsible on tablet | Build (project-specific nav) |
| `Topbar` | Page title slot, notification bell, profile dropdown | Build, dropdown from shadcn `DropdownMenu` |
| `MobileNav` | Drawer-style nav for <768px | shadcn `Sheet` |
| `Breadcrumbs` | Shown on detail pages (`Transactions > #TXN123`) | Build, small |
| `ConfirmDialog` | Reusable "Are you sure?" for Accept/Reject/Cancel actions | shadcn `AlertDialog` |
| `Toaster` | Global toast mount point | Sonner, mounted once in `App.jsx` |
| `LoadingSkeleton` | Generic skeleton block, composed per-page into table/card skeletons | shadcn `Skeleton` |
| `EmptyState` | Icon + title + description + optional CTA button, reused on every list page | Build |
| `ErrorState` | Icon + message + "Retry" button, used inside error boundaries and failed queries | Build |

### 6.2 UI Components (shadcn/ui — install via CLI, do not hand-roll)

Button, Input, Select, Checkbox, Switch, Tabs, Badge, Avatar, Card, Table, Dialog, AlertDialog, Sheet (drawer), DropdownMenu, Popover, Tooltip, Calendar, DatePicker (Calendar+Popover composition), Skeleton, Separator, Pagination (build thin wrapper over shadcn Button group).

### 6.3 Feature Components (project-specific)

| Component | Purpose | Props | Variants | Used In |
|---|---|---|---|---|
| `KpiCard` | One metric with label, value, delta, icon | `{label, value, delta, icon, loading}` | default, warning (e.g. pipeline red dot) | Admin Overview, Buyer/FPO dashboards |
| `StatusBadge` | Colored pill for transaction/sell-intent status | `{status}` | maps via `constants/transactionStatus.js` | Every table/card showing a Transaction |
| `MatchScoreBadge` | Circular/pill score display (e.g. "82%") with color scale (red<50%, amber 50-75%, green>75%) | `{score}` | small (table), large (detail) | Requests, Recommendations, Transaction detail |
| `ScoreBreakdown` | Horizontal mini-bar chart of the 5 weighted factors | `{breakdown: {locationScore, quantityScore, priceScore, qualityScore, timingScore}}` | expanded/collapsed | RequestCard expand, TransactionDetail |
| `StatusTimeline` | Vertical stepper of `TransactionStatusHistory` entries | `{history: []}` | — | Transaction detail (Admin/Buyer/FPO — shared) |
| `RequestCard` | Incoming request card with Accept/Reject | `{request, onAccept, onReject}` | pending/accepted/rejected visual state | Buyer Requests page |
| `RequirementCard` | Buyer's own posted requirement | `{requirement, onEdit, onToggleActive}` | — | Buyer Requirements page |
| `TransactionRow` | Table row, reused across Admin/Buyer/FPO transaction tables | `{transaction, showFarmer, showBuyer}` | column visibility toggles by role | 3 different Transactions pages |
| `FarmerCard` | Compact farmer summary | `{farmer}` | — | FPO Farmers, Admin Farmers (mobile card view) |
| `DateRangeFilter` | Shared date-range picker for Overview/Analytics/Market Prices | `{value, onChange}` | — | Multiple admin pages |
| `SearchInput` | Debounced search box (uses `useDebounce`) | `{value, onChange, placeholder}` | — | Every table page |

---

## 7. Design System

### 7.1 Color Palette (agri-tech, government-credible — not a generic purple SaaS template)

```css
:root {
  /* Primary — deep agricultural green, trustworthy/institutional */
  --primary: #1E6F4C;
  --primary-hover: #17573C;
  --primary-foreground: #FFFFFF;

  /* Secondary — warm earth/harvest tone, used for CTAs needing warmth (not error) */
  --secondary: #C9A227;
  --secondary-foreground: #1A1A1A;

  /* Accent — sky/water blue, used for informational elements (weather, links) */
  --accent: #2E7DAF;

  /* Backgrounds */
  --background: #F7F9F6;         /* soft off-white with a green undertone */
  --surface: #FFFFFF;             /* cards/panels */
  --surface-muted: #F0F3EE;

  /* Text */
  --text-primary: #17241E;
  --text-secondary: #5B6B62;
  --text-disabled: #A3AFA8;

  /* Borders */
  --border: #E1E7DF;

  /* Status */
  --success: #1E6F4C;   /* reuse primary for ACCEPTED/COMPLETED */
  --warning: #C9A227;   /* MATCHED/PENDING */
  --error: #C0392B;     /* REJECTED/CANCELLED */
  --info: #2E7DAF;      /* REQUESTED */
}
```

**Status → color mapping (used by `StatusBadge`):**

| Status | Color |
|---|---|
| REQUESTED | info (blue) |
| MATCHED / PENDING_BUYER | warning (amber) |
| ACCEPTED | success (green) |
| IN_PROGRESS | accent (blue, slightly deeper) |
| COMPLETED | primary (dark green, filled) |
| REJECTED / CANCELLED | error (red) |

### 7.2 Typography

- **Font:** Inter (Google Fonts, free) for all UI text — excellent legibility at small sizes, wide language/number support. Devanagari-adjacent numerals aren't needed in dashboard UI (only in WhatsApp copy), so no special font is required here.
- **Scale:** `text-xs` (12px, table meta) · `text-sm` (14px, body/table) · `text-base` (16px, form inputs) · `text-lg` (18px, card titles) · `text-xl`/`text-2xl` (page titles) · `text-3xl`/`text-4xl` (KPI numbers, Landing hero).
- **Weight:** 400 body, 500 labels/table headers, 600 card titles, 700 KPI numbers and page `h1`.

### 7.3 Component Styling Tokens

- **Border radius:** `rounded-lg` (8px) default for cards/inputs/buttons; `rounded-full` for badges/avatars.
- **Shadows:** `shadow-sm` for cards at rest, `shadow-md` on hover for clickable cards, no heavy drop shadows (keep the government/institutional feel restrained).
- **Spacing:** Tailwind default scale, 4px base unit; page padding `p-6` desktop / `p-4` mobile; card padding `p-5`; consistent `gap-4`/`gap-6` in grids.
- **Container widths:** dashboard content max-width `max-w-7xl`, form pages `max-w-2xl`, auth cards `max-w-md`.
- **Breakpoints (Tailwind default):** `sm` 640px · `md` 768px · `lg` 1024px · `xl` 1280px · `2xl` 1536px.
- **Icon style:** Lucide React, `strokeWidth={1.75}`, 20px default in-line, 24px in nav/KPI cards.

### 7.4 Design Principles for This Project Specifically

1. **Explainability is a design feature, not a footnote.** Match scores and advisory reasons must always be visually paired with their "why" — never show a bare percentage.
2. **Status is always color+text+icon**, never color alone (accessibility + judge legibility from a distance during demo).
3. **The Buyer Accept button is the single most important button in the product** — give it visual priority (primary color, largest touch target on its page) wherever it appears.
4. **Institutional, not consumer-flashy.** This is a government-adjacent B2B tool — clean, dense-enough-to-be-credible, restrained motion (Section 18).

---

## 8. UI Inspiration

| Product | Take Inspiration From | Specific Section | Don't Copy | Adaptation |
|---|---|---|---|---|
| **Linear** | Clean data-dense tables, minimal chrome, fast-feeling interactions | Issue list row density, status badge style | Their dark-mode-first aesthetic (Kisan Setu should be light, institutional) | Apply the same row-density and badge shape to `TransactionRow`/`StatusBadge` |
| **Stripe Dashboard** | KPI card layout, restrained color use, clear data hierarchy | Overview page top KPI strip, transaction detail timeline | Purple/violet brand color (use our green) | Mirror the KPI-strip-then-chart-then-table page structure for `/admin/overview` |
| **Notion** | Empty states with friendly illustration + single clear CTA | First-time empty states (e.g. empty database) | Playful/casual tone (keep ours a bit more formal, government context) | Use for `EmptyState` component — icon + one-line message + one CTA, nothing busier |
| **Razorpay Dashboard** | Indian fintech-appropriate data tables, ₹ currency formatting, status pill conventions | Transactions table, filter chip row | Dense multi-column financial tables (we have fewer columns) | Use their filter-chip pattern for the Transactions status filter tabs |
| **data.gov.in / India government dashboards** | Credible, sober visual language appropriate for a Government of Maharashtra pilot | Color restraint, formal typography | Their dated component styling and poor mobile responsiveness | Keep the *tone* (credible, sober) while using modern shadcn components underneath |
| **Airbnb Host Dashboard** | Card-based "incoming request" pattern with clear accept/decline | Host reservation request cards | Travel-specific imagery | Direct structural model for `RequestCard` on `/buyer/requests` — this is the closest real-world analog to "farmer sends a transaction request" |

---

## 9. Library Recommendations Table (Consolidated)

| Requirement | Recommended Library | Why | Free? | Where Used |
|---|---|---|---|---|
| UI components | shadcn/ui + Radix UI | Accessible, unstyled-core, copy-in model | Yes | Everywhere |
| Icons | Lucide React | Consistent with shadcn ecosystem | Yes | Nav, cards, buttons |
| Animations | Framer Motion (motion) | Selective premium polish | Yes | Accept flow, KPI counters |
| Carousels | — (not needed) | No carousel content in this product | — | — |
| Forms | React Hook Form | Performance, RHF+Zod pairing | Yes | All forms |
| Validation | Zod | Mirrors backend schema shape | Yes | Forms, env vars |
| Charts | Recharts | Composable, easy Tailwind theming | Yes | Overview, Analytics, Prices, Weather |
| Maps | React Leaflet | Free, no API key, offline-tile-friendly | Yes | District heatmap (nice-to-have) |
| Tables | shadcn Table (Radix-based) + TanStack Table if sorting/pagination complexity grows | Start simple with shadcn; upgrade only if needed | Yes | All list pages |
| Toasts | Sonner | Clean API, good defaults | Yes | Global |
| Modals | shadcn Dialog / AlertDialog | Accessible, consistent | Yes | Confirm actions, detail popups |
| Date handling | date-fns | Lightweight, tree-shakeable | Yes | Timestamps, filters |
| File upload | — (not in MVP scope; no file-upload requirement in blueprint) | N/A | — | — |
| Rich text | — (not needed) | No CMS content | — | — |
| Auth UI | Built with shadcn Input/Button/Form primitives | No dedicated auth-UI library needed at this scope | — | Login/ForgotPassword |
| Loading states | shadcn Skeleton | Matches design system automatically | Yes | Every data page |
| Accessibility | Radix UI primitives (underlies shadcn) | Keyboard/ARIA handled by the primitive layer | Yes | All interactive components |

---

## 10. Routing Architecture

```
/                          public    Layout: LandingLayout   Page: Landing
/login                     public    Layout: AuthLayout      Page: Login          → redirect if already authed
/forgot-password           public    Layout: AuthLayout      Page: ForgotPassword
/unauthorized              public    Layout: AuthLayout      Page: Unauthorized
/*  (catch-all)             public    Layout: AuthLayout      Page: NotFound

/admin                     private   role: ADMIN, GOVERNMENT_EVALUATOR   Layout: DashboardLayout
  /overview
  /farmers                 (write actions hidden for GOVERNMENT_EVALUATOR)
  /farmers/:id
  /buyers
  /fpos
  /fpos/:id
  /crops
  /market-prices
  /weather
  /recommendations
  /transactions            (Cancel action hidden for GOVERNMENT_EVALUATOR)
  /transactions/:id
  /analytics
  /system-health           (ADMIN only — hidden entirely from GOVERNMENT_EVALUATOR)

/buyer                     private   role: BUYER    Layout: DashboardLayout
  /dashboard
  /requirements
  /requirements/new
  /requirements/:id/edit
  /requests
  /transactions
  /transactions/:id
  /profile

/fpo                       private   role: FPO    Layout: DashboardLayout
  /dashboard
  /farmers
  /demand
  /bundle
  /transactions
  /transactions/:id
  /profile
```

**Redirect behavior:**
- Unauthenticated user hits any `/admin|/buyer|/fpo/*` → redirect to `/login`, store intended path, redirect back after successful login.
- Authenticated user hits `/login` directly → redirect to their role's home.
- Authenticated user hits a path outside their role prefix → redirect to `/unauthorized` (never silently 404 — a wrong-role hit is a permissions issue, not a missing page).
- Access token expired mid-session → `apiClient` attempts one silent `/auth/refresh`; if that also fails → clear session, redirect to `/login` with a "Session expired" toast.

**`ProtectedRoute` implementation contract:**
```jsx
<ProtectedRoute allowedRoles={['ADMIN', 'GOVERNMENT_EVALUATOR']}>
  <AdminLayoutOutlet />
</ProtectedRoute>
```
Checks `useAuthStore` for `user` + `accessToken`; on mount, if no in-memory token but a refresh cookie might exist (page reload case), attempts a silent refresh before deciding to redirect — prevents a jarring flash-redirect-to-login on every browser refresh.

---

## 11. State Management

| State | Where It Lives | Why |
|---|---|---|
| Auth session (`user`, `accessToken`) | Zustand (`authStore`) | Truly global, needed by `apiClient`, `ProtectedRoute`, `Sidebar` simultaneously; token kept in memory only |
| All server data (transactions, farmers, KPIs, prices, weather) | TanStack Query | Server state — caching/retry/refetch handled for free; never duplicate this into Zustand |
| Form input state (login, requirement form, bundle builder) | React Hook Form local state | Scoped to the form, no need to lift higher |
| Filters/search on list pages | URL search params (`useSearchParams`) | Shareable/bookmarkable, survives refresh, avoids extra state plumbing |
| Modal/dialog open state | Local component `useState` | Purely presentational, no reason to globalize |
| Selected date range (Overview/Analytics) | URL search params | Same reasoning as filters — also lets a judge share a specific analytics view by link |
| Sidebar collapsed/expanded (tablet) | Local `useState`, optionally persisted via a simple in-memory ref (NOT localStorage inside artifacts, but fine in the real app) | UI-only preference |

**Explicitly do not introduce:** a global Redux/Context store for transactions, farmers, or any server-fetched entity — TanStack Query already owns that, and duplicating it into Zustand creates two sources of truth that will drift, especially around the Accept/Reject optimistic-update flow.

---

## 12. API Integration Architecture

### 12.1 `apiClient.js` contract

```js
// services/apiClient.js
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function request(path, { method = 'GET', body, retry = true } = {}) {
  const { accessToken } = useAuthStore.getState();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    credentials: 'include', // sends the httpOnly refresh cookie
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && retry) {
    const refreshed = await tryRefresh(); // POST /auth/refresh
    if (refreshed) return request(path, { method, body, retry: false });
    useAuthStore.getState().clear();
    window.location.href = '/login';
    return;
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(data?.error?.code, data?.error?.message, data?.error?.details);
  }
  return data;
}

export const apiClient = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
};
```

This directly implements blueprint Section 21's stated pattern: *"thin fetch wrapper that auto-attaches the bearer token and transparently retries once through `/auth/refresh` on a 401."*

### 12.2 Example Query/Mutation Hooks

```js
// hooks/useTransactions.js
export function useTransactions({ role, status }) {
  return useQuery({
    queryKey: ['transactions', role, status],
    queryFn: () => transactionsApi.list({ role, status }),
  });
}

export function useAcceptTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => transactionsApi.accept(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['transactions'] });
      // optimistic: mark this transaction ACCEPTED in cache immediately
    },
    onError: (err, id, context) => {
      // rollback optimistic update, toast the error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['admin-overview'] });
    },
  });
}
```

### 12.3 Example API Contracts Consumed (from blueprint Section 8 — authoritative; if the real backend deviates, update this table, don't guess)

```
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/farmers/:id
GET    /api/v1/farmers/:id/advisories
GET    /api/v1/farmers/:id/sell-intents
POST   /api/v1/buyers/requirements
GET    /api/v1/buyers/requirements
PATCH  /api/v1/buyers/requirements/:id
GET    /api/v1/fpo/:id/farmers
GET    /api/v1/fpo/:id/demand
POST   /api/v1/fpo/:id/bundle-transaction
GET    /api/v1/crops
GET    /api/v1/crops/:id/seasons
GET    /api/v1/weather/:districtId/latest
GET    /api/v1/weather/:districtId/history
GET    /api/v1/market/prices/latest?cropId&districtId
GET    /api/v1/market/prices/history?cropId&mandiId
GET    /api/v1/recommendations/:farmerId/latest
GET    /api/v1/matching/:sellIntentId/candidates
POST   /api/v1/transactions
GET    /api/v1/transactions?role=buyer|farmer|fpo
GET    /api/v1/transactions/:id
PATCH  /api/v1/transactions/:id/accept
PATCH  /api/v1/transactions/:id/reject
PATCH  /api/v1/transactions/:id/complete
PATCH  /api/v1/transactions/:id/cancel
GET    /api/v1/notifications
PATCH  /api/v1/notifications/:id/read
GET    /api/v1/admin/overview
GET    /api/v1/admin/analytics?district&dateRange
GET    /api/v1/admin/system-health
```
**Gaps to flag to the Backend Engineer explicitly (not in the contract above, needed by this frontend):** `GET /admin/buyers` (list all buyers, for `/admin/buyers`), `GET /admin/fpos` (list all FPOs, for `/admin/fpos`). Build these two pages against a mocked response first; do not block on them.

### 12.4 Mocking Strategy (Week 2, before real API exists)

Use MSW (Mock Service Worker) with handlers matching the exact contract above, seeded with data shaped like blueprint Section 30's seed script (3 districts, 8-10 crops, ~15 farmers, 5 buyers, transactions in mixed states). This lets every page in Section 3 be built and demoed internally before the backend is live, and the mock handlers double as a lightweight contract test later.

---

## 13. Authentication (Frontend Flow)

```
1. Login
   User → /login → enters email/password → POST /auth/login
   → success: response contains { user, accessToken } (refresh token arrives as
     httpOnly cookie, invisible to JS) → store {user, accessToken} in authStore
     → redirect to role-based home (or intended path if redirected here)
   → failure: inline error "Invalid email or password", no field-level leak of
     which field was wrong (standard security practice)

2. Session persistence across reloads
   On app boot (App.jsx mount), if authStore is empty, silently call
   POST /auth/refresh (cookie sent automatically) → if it returns a new access
   token, rehydrate the session invisibly (show a full-page loading spinner for
   this brief check, not a login-flash) → if it fails, render public routes only

3. Logout
   User → profile dropdown → "Log out" → POST /auth/logout → clear authStore
   → redirect to /login

4. Session expiration mid-use
   Any API call gets 401 → apiClient attempts one silent refresh → if that also
   401s → clear session → toast "Your session expired, please log in again" →
   redirect to /login, preserving the path they were on to return to after re-login

5. Protected routes
   Every /admin, /buyer, /fpo route wrapped in <ProtectedRoute allowedRoles={...}>
   — unauthenticated → /login; wrong role → /unauthorized (never a silent 404)

6. Role-based routes
   Sidebar renders only the nav items valid for the current role (roleRoutes.js);
   this is a UX convenience only — actual enforcement is server-side per blueprint
   Section 25 ("RBAC ... never left to the frontend to hide a button")

7. Registration
   Not built as a public self-serve flow for this MVP — buyer/FPO/admin accounts
   are provisioned by the team/admin per blueprint's pilot scope. If a public
   /register page becomes needed later, it follows the same AuthLayout pattern
   as Login, posting to POST /auth/register.

8. Forgot / Reset password (Should Have, defensive build)
   UI built per Section 3.2; backend contract does not yet define this endpoint.
   Wire the button to a stubbed api call that fails gracefully with a generic
   "check your email" message either way, and flag this as an open item for the
   Backend Engineer rather than blocking the rest of the frontend on it.
```

**Loading state during the silent-refresh boot check:** full-page centered spinner with the Kisan Setu logo, max ~1-2s expected — never render a flash of the login page followed by an auto-redirect, which looks broken during a live demo.

---

## 14. Every Button and Interaction (Key Examples)

```
Button: Log in
Page: /login
Action: POST /auth/login
Loading: button text → spinner, disabled, form fields disabled
Success: redirect to role home
Failure: red inline banner above form, button re-enabled
Mobile: full-width

Button: Accept  (RequestCard, /buyer/requests)
Action: opens ConfirmDialog → on confirm, PATCH /transactions/:id/accept
Loading: button → spinner, card dimmed but not removed
Success: optimistic status change to ACCEPTED, brief highlight animation,
  toast "Request accepted — farmer will be notified"
Failure: card returns to REQUESTED state, toast "Couldn't accept — try again"
Disabled: never disabled on a REQUESTED card; hidden entirely once already
  ACCEPTED/REJECTED (card moves out of the Pending filter)
Mobile: full-width stacked with Reject below it

Button: Reject  (RequestCard)
Action: opens dialog with optional reason textarea → PATCH .../reject
Loading/Success/Failure: same pattern as Accept, outline/red style
Mobile: full-width, secondary visual weight to Accept

Button: + Post Requirement / + New Requirement
Page: /buyer/dashboard, /buyer/requirements
Action: navigates to /buyer/requirements/new
Loading: n/a (pure navigation)
Mobile: full-width primary button, sticky at top of empty state

Button: Save Changes / Post Requirement  (RequirementForm submit)
Action: RHF validated → POST or PATCH buyers/requirements
Loading: spinner, disabled
Success: toast + redirect to /buyer/requirements
Failure: inline field errors (Zod) shown under each input; top-of-form banner
  for non-field errors (e.g. server 500)
Disabled: submit disabled while required fields are empty/invalid (RHF isValid)

Dropdown: Profile menu
Page: Topbar, all authenticated pages
Items: Profile, (role-specific settings), Log out
Action: Log out → POST /auth/logout → redirect /login

Tabs: Status filter  (Admin/Buyer/FPO Transactions pages)
Action: updates ?status= URL param, refetches via TanStack Query key change
Loading: table skeleton while refetching
Mobile: horizontally scrollable tab strip

Search input: any list page
Action: debounced (400ms) → updates ?q= URL param → refetch
Loading: subtle inline spinner inside the input, table doesn't fully skeleton
  (avoid jarring full-reload feel on every keystroke)
Empty result: EmptyState "No results for '{query}'" + clear button

Pagination: any table
Action: updates ?page= URL param
Mobile: simplified to Prev/Next only (no page-number list)

Table row click: Transactions, Farmers, Buyers, FPOs
Action: navigate to detail route
Mobile: entire card is tappable (not just a small "View" link)

Notification bell: Topbar
Action: opens Popover listing GET /notifications, click item →
  PATCH /notifications/:id/read + navigate to related transaction
Loading: skeleton list inside popover
Empty: "You're all caught up"

Date-range filter: Overview, Analytics, Market Prices
Action: updates ?from=&to= URL params, refetches charts
Mobile: collapses to a single "Date range" button opening a Sheet/drawer
```

---

## 15. Loading, Empty, Error & Edge States (Per Major Page)

| Page | Loading | Empty | Error | Offline/Network | Success | Validation | Permission |
|---|---|---|---|---|---|---|---|
| Admin Overview | 6 KPI skeletons + chart skeleton | N/A (seed data guarantees content; still code the branch) | Per-widget error boundary, retry button, rest of page unaffected | Cached React Query data shown stale with a small "offline" indicator | KPI numbers count-up animate on load | — | Evaluator sees same page, write actions hidden |
| Buyer Requests | 3 card skeletons | "No pending requests right now" + illustration | Inline error banner per action, list stays intact | Query retries with backoff, toast if all retries exhausted | Accept/reject success toast + card transition | — | N/A (buyer-only page) |
| Requirement Form | N/A (form, not fetch) | N/A | Top-of-form error banner on submit failure | Submit button shows "Retry" state if network fails mid-submit | Toast + redirect on save | Inline Zod field errors, red border + message under field | N/A |
| Transactions Table | 8 row skeletons | "No transactions yet" + explanation text | Full error state with retry (table replaced, not partial) | Stale cache shown with banner | New rows subtly highlighted if arrived via refetch | — | Cancel button hidden for non-owning roles |
| Farmers Table | 8 row skeletons | "No farmers match your filters" + clear-filters CTA | Full error state with retry | Stale cache + banner | — | Search/filter always valid (no invalid state possible) | FPO sees only own members |
| System Health | Table skeleton | N/A (always shows known queue types) | Row-level "couldn't load status" per queue, not full-page | N/A (admin-only, low-frequency page) | Manual refresh spinner | — | Hidden entirely from non-ADMIN |
| Analytics | Chart skeletons per chart | "No data for this range" per chart independently | Per-chart error state | Stale + banner | Export buttons enabled only once data loaded | Date range always constrained to valid past dates | Export button visibility per role |
| Bundle Builder (FPO) | Skeleton for demand/farmer lists | "No open demand right now" | Inline error, doesn't lose in-progress selection | Warn if a selected farmer's sell intent becomes stale mid-build | Success toast + redirect | Combined quantity must be >0, Zod-validated | N/A (FPO-only) |

---

## 16. Responsive Design

| Element | Mobile (<768px) | Tablet (768–1024px) | Desktop (≥1024px) |
|---|---|---|---|
| Sidebar | Hidden, replaced by `MobileNav` Sheet triggered from Topbar hamburger | Collapsed to icon-only rail, expandable on tap | Fully expanded, persistent |
| Topbar | Logo + hamburger + notification bell only, profile in the drawer | Full topbar | Full topbar |
| KPI Grid | 1 column, stacked | 2 columns | 3 columns (Overview) |
| Tables | Convert to stacked cards (one card per row, key fields as label:value pairs) | Horizontal-scroll table if columns don't fit, else full table | Full table, all columns |
| Transaction/Request Cards | Full-width, stacked, actions full-width | 2-column grid | 2–3 column grid |
| Forms | Single column, sticky submit button pinned to bottom of viewport | Single column, normal submit placement | Single column, `max-w-2xl` centered |
| Charts | Reduced to essential series, legend below, horizontal scroll if needed | Full chart | Full chart with all series/legend inline |
| Date range filter | Collapses into a Sheet triggered by one button | Inline popover | Inline popover |
| Filter tabs | Horizontal scroll strip | Full row | Full row |
| Modals/Dialogs | Full-screen Sheet-style | Centered dialog, ~80% width | Centered dialog, fixed max-width |

Tailwind usage pattern: mobile-first (`className="flex flex-col md:flex-row"`), Sidebar visibility via `hidden lg:flex` + a `Sheet` counterpart for `<lg`.

---

## 17. Accessibility

- **Semantic HTML:** `<nav>`, `<main>`, `<table>` (real `<table>` markup even when visually styled as shadcn Table, not `<div>` soup), `<button>` for actions (never a styled `<div onClick>`).
- **Keyboard navigation:** every interactive element reachable via Tab; Dialog/Sheet trap focus and return it to the trigger on close (comes free from Radix); Accept/Reject reachable and confirmable via keyboard alone (Enter on focused button opens ConfirmDialog, Enter again confirms).
- **Focus states:** visible focus ring (`focus-visible:ring-2 ring-primary`) on every interactive element — do not strip default outlines without replacing them.
- **ARIA:** rely on Radix's built-in ARIA roles for Dialog/Dropdown/Tabs (already correct); add `aria-label` to icon-only buttons (notification bell, hamburger, table row action icons).
- **Accessible forms:** every input has a associated `<label>` (via shadcn `Form` + RHF `FormLabel`), error messages linked via `aria-describedby`, required fields marked both visually (`*`) and with `aria-required`.
- **Color contrast:** verify primary green (#1E6F4C) on white passes WCAG AA for body text; status badges use text+icon, not color alone (Section 7.4).
- **Screen readers:** `StatusTimeline` steps announced in order with a text description, not just a visual dot; `KpiCard` delta (+/-) has a visually-hidden text equivalent ("increased by 12%").
- **Accessible modals:** ConfirmDialog/AlertDialog use Radix's built-in focus trap + Escape-to-close + labelled by title.
- **Accessible navigation:** Sidebar active-link state conveyed with both color and `aria-current="page"`.

---

## 18. Animations & Micro-interactions (Use Sparingly — Institutional Tone)

| Interaction | Animation | Tool |
|---|---|---|
| Page/route transition | Simple fade-in (150ms), no slide/zoom | Framer Motion, `AnimatePresence` at layout level |
| KPI number on Overview load | Count-up from 0 to value (400ms ease-out) | Framer Motion `useAnimate` / simple custom hook |
| Accept button click → success | Card border flashes green briefly, checkmark icon scales in, then card transitions out of "Pending" filter | Framer Motion `layout` animation on the card list |
| Card hover (Requests, Requirements) | Subtle `shadow-sm → shadow-md` + 1px lift, 150ms | Tailwind transition utilities (no JS needed) |
| Modal/Dialog open/close | Fade + slight scale (Radix default, keep it, don't override with anything flashier) | Radix (via shadcn Dialog) |
| Toast enter/exit | Slide-in from top-right, auto-dismiss fade | Sonner default |
| Sidebar collapse/expand | Width transition, 200ms ease | Tailwind `transition-all` |
| Loading skeleton | Gentle pulse (Tailwind's built-in `animate-pulse`) | Tailwind |
| Status badge change (e.g. table row updates after refetch) | Brief background color flash to draw the eye, fades over 1s | Framer Motion `animate` on key change |

**Explicit rule:** no parallax, no scroll-triggered reveal animations, no bouncy easing — this is a professional government-pilot dashboard, not a marketing site (the Landing page, Section 3.26, is the only page allowed slightly more visual flair, and even there keep it restrained per Section 7.4).

---

## 19. Development Roadmap in Phases

### Phase 0 — Project Analysis (Done — captured in Sections 0–4 of this document)
Objective: shared understanding before code. Nothing to build.

### Phase 1 — Project Setup
- **Objective:** working Vite+React+Tailwind shell with tooling.
- **Tasks:** init Vite, install Tailwind, configure path aliases (`@/`), ESLint+Prettier, `.env` files, install shadcn/ui CLI and base config.
- **Files:** `vite.config.js`, `tailwind.config.js`, `jsconfig.json`/`vite-alias`, `.eslintrc`, `.env.example`, `components.json` (shadcn).
- **Libraries:** vite, react, react-dom, tailwindcss, postcss, autoprefixer, eslint.
- **Dependencies:** none.
- **Definition of done:** `npm run dev` shows a blank styled page with Tailwind classes working, path alias `@/components` resolves.
- **Testing checklist:** dev server boots, hot reload works, alias import works.

### Phase 2 — Design System
- **Objective:** tokens + base shadcn components themed.
- **Tasks:** define CSS variables (Section 7.1) in `index.css`, install shadcn Button/Input/Card/Badge/Skeleton, verify theme applies.
- **Files:** `index.css`, `components/ui/*` (generated).
- **Libraries:** shadcn/ui, class-variance-authority, clsx, tailwind-merge, lucide-react.
- **Dependencies:** Phase 1.
- **Definition of done:** a test page renders themed Button/Badge/Card matching Section 7 palette.

### Phase 3 — Global Layout
- **Objective:** DashboardLayout + AuthLayout shells with responsive nav.
- **Tasks:** build `Sidebar`, `Topbar`, `MobileNav` (Sheet), `Footer`, `AuthLayout` centered card.
- **Files:** `layouts/DashboardLayout.jsx`, `layouts/AuthLayout.jsx`, `components/layout/*`.
- **Libraries:** shadcn Sheet, DropdownMenu.
- **Dependencies:** Phase 2.
- **Definition of done:** layouts render with placeholder nav links, responsive collapse verified at all breakpoints (Section 16).

### Phase 4 — Routing & Auth Shell
- **Objective:** route tree, Zustand authStore, ProtectedRoute, apiClient with mocked auth.
- **Tasks:** build `routes/index.jsx`, `ProtectedRoute.jsx`, `authStore.js`, `apiClient.js`, install MSW and write `auth` mock handlers.
- **Files:** `routes/*`, `store/authStore.js`, `services/apiClient.js`, `mocks/handlers/auth.js`.
- **Libraries:** react-router-dom, zustand, msw.
- **Dependencies:** Phase 3.
- **Definition of done:** login with mocked credentials redirects to a placeholder role home; visiting a protected route unauthenticated redirects to `/login`.

### Phase 5 — Public Pages
- **Objective:** Landing, Login, ForgotPassword, Unauthorized, 404.
- **Tasks:** build all of Section 3.1–3.4 and 3.26 against mock/auth shell from Phase 4.
- **Files:** `pages/landing/`, `pages/auth/`, `pages/errors/`.
- **Dependencies:** Phase 4.
- **Definition of done:** full public navigation works end-to-end with mocked login.

### Phase 6 — Admin Dashboard Core (Overview, Transactions)
- **Objective:** the two highest-priority Admin pages, fully data-driven against MSW mocks matching Section 30 seed shape.
- **Tasks:** `KpiCard`, `StatusBadge`, `MatchScoreBadge`, `ScoreBreakdown`, `StatusTimeline`, charts (`FunnelChart`, `GmvTrendChart`), Overview + Transactions list + Transactions detail pages.
- **Libraries:** @tanstack/react-query, recharts, date-fns.
- **Dependencies:** Phase 5.
- **Definition of done:** Overview shows KPIs + funnel chart from mock data; Transactions table filters/paginates; detail page shows full status timeline.

### Phase 7 — Buyer Core Flow (the demo-critical phase)
- **Objective:** Buyer Dashboard, Requirements CRUD, Incoming Requests with Accept/Reject, My Transactions.
- **Tasks:** `RequirementForm` (RHF+Zod), `RequirementCard`, `RequestCard`, Accept/Reject mutations with optimistic updates, ConfirmDialog wiring.
- **Libraries:** react-hook-form, zod, @hookform/resolvers, sonner.
- **Dependencies:** Phase 6 (reuses StatusBadge/StatusTimeline/ScoreBreakdown).
- **Definition of done:** a mocked "Accept" click updates the card, fires a toast, and updates Overview KPIs on next visit — the full demo loop works end-to-end against mocks.

### Phase 8 — Admin Remaining Pages + FPO Flow
- **Objective:** Farmers, Buyers, FPOs, Crops, Market Prices, Weather, Recommendations, Analytics, System Health + full FPO module.
- **Tasks:** build remaining Section 3.6–3.15, 3.21–3.25 pages; district/crop selectors reused across Market Prices/Weather/Recommendations.
- **Libraries:** react-leaflet (if heatmap is attempted), leaflet.
- **Dependencies:** Phase 7.
- **Definition of done:** every route in Section 10 renders correctly for its role against mock data, no placeholder pages remain.

### Phase 9 — Real API Integration
- **Objective:** swap MSW mocks for the live backend as it becomes available.
- **Tasks:** point `VITE_API_BASE_URL` at staging API, verify every `api/*.js` function against real responses, fix any contract drift found (log it back to Backend Engineer), remove MSW from production build.
- **Dependencies:** Phase 8 + backend team's Week 4–5 deliverables (blueprint Section 39).
- **Definition of done:** app runs fully against the real staging API with zero MSW involvement, all pages still function.

### Phase 10 — Responsive Optimization Pass
- **Objective:** verify and fix every breakpoint from Section 16 across every page built so far.
- **Tasks:** systematic pass at 375px/768px/1024px/1440px for each page in Section 3.
- **Dependencies:** Phase 9 (verify against real data volumes, not just mock).
- **Definition of done:** no horizontal scroll on unintended elements, no overlapping/cut-off content at any breakpoint.

### Phase 11 — Accessibility Pass
- **Objective:** apply Section 17 checklist across the app.
- **Tasks:** keyboard-only navigation test of the full demo flow, screen-reader spot-check on Overview and Requests, contrast check on all status colors.
- **Dependencies:** Phase 10.
- **Definition of done:** full demo flow (Login → Accept Request → view Overview) completable via keyboard alone.

### Phase 12 — Testing
- **Objective:** apply Section 24's checklist.
- **Tasks:** manual E2E pass, cross-browser check (Chrome/Firefox/Safari), form validation edge cases, API-failure simulation (kill network mid-Accept).
- **Dependencies:** Phase 11.
- **Definition of done:** every item in Section 24 checked off at least once.

### Phase 13 — Performance Optimization
- **Objective:** apply Section 25's checklist; not premature, only after functionality is complete.
- **Tasks:** route-level code splitting (`React.lazy`), image optimization for Landing illustrations, Lighthouse run, bundle analysis.
- **Dependencies:** Phase 12.
- **Definition of done:** Lighthouse Performance score ≥85 on Overview and Landing.

### Phase 14 — Production Build & Readiness
- **Objective:** apply Section 26's checklist.
- **Tasks:** production `.env` values set, remove console.logs/debug code, verify no build warnings, add favicon/metadata/OG tags, build 404 page confirmed at deployed host level.
- **Dependencies:** Phase 13.
- **Definition of done:** `npm run build` clean, `npm run preview` matches dev behavior with no errors in console.

### Phase 15 — Deployment
- **Objective:** live on Vercel, demo-ready.
- **Tasks:** per Section 27.
- **Dependencies:** Phase 14 + backend API deployed and CORS-configured for the Vercel domain.
- **Definition of done:** public URL loads, login works against production API, full demo flow (Section 28) rehearsed successfully at least twice.

---

## 20. Exact Build Order

```
 1. npm create vite@latest apps/dashboard -- --template react
 2. Install Tailwind, configure postcss/tailwind.config.js
 3. Configure path alias (@/ → src/)
 4. Install & init shadcn/ui (components.json)
 5. Create folder structure (Section 5)
 6. Write index.css design tokens (Section 7.1)
 7. Generate shadcn Button, Input, Card, Badge, Skeleton
 8. Build lib/utils.js (cn helper)
 9. Build EmptyState, ErrorState, LoadingSkeleton (common/)
10. Build Sidebar, Topbar, MobileNav, Footer
11. Build DashboardLayout, AuthLayout
12. Install react-router-dom, build routes/index.jsx skeleton (placeholder pages)
13. Install zustand, build authStore.js
14. Install msw, set up mock handlers matching Section 12.3 contract + seed shape
15. Build services/apiClient.js
16. Build ProtectedRoute.jsx + roleRoutes.js
17. Build Login page + login flow end-to-end against mocks
18. Build ForgotPassword, Unauthorized, 404 pages
19. Build Landing page
20. Install @tanstack/react-query, set up queryClient + QueryClientProvider
21. Build StatusBadge, MatchScoreBadge, ScoreBreakdown, StatusTimeline (common/)
22. Install recharts, build FunnelChart, GmvTrendChart
23. Build KpiCard
24. Build Admin Overview page
25. Build Admin Transactions list + detail pages
26. Install react-hook-form, zod, @hookform/resolvers
27. Build RequirementForm + schemas/requirement.schema.js
28. Build Buyer Dashboard, Requirements list/new/edit
29. Install sonner, mount global Toaster
30. Build RequestCard + Accept/Reject mutations (optimistic updates)
31. Build Buyer Requests page
32. Build Buyer Transactions list/detail (reuse StatusTimeline)
33. Build Buyer Profile page
34. Build remaining Admin pages: Farmers, Buyers, FPOs, Crops, Market Prices,
    Weather, Recommendations, Analytics, System Health
35. Build FPO Dashboard, Farmers, Demand, Bundle builder, Transactions, Profile
36. Install framer-motion, add animations per Section 18
37. Swap MSW → real VITE_API_BASE_URL, verify every page against staging API
38. Responsive pass (Section 16) across every page
39. Accessibility pass (Section 17)
40. Full manual E2E test pass (Section 24)
41. Performance pass: React.lazy route splitting, Lighthouse run
42. Production build cleanup + metadata/favicon/OG tags
43. Deploy to Vercel, configure env vars, verify SPA routing
44. Rehearse full demo flow (Section 28) at least twice
```

---

## 21. Installation Commands

```bash
# ── Initial setup ──
npm create vite@latest apps/dashboard -- --template react
cd apps/dashboard
npm install

# ── Tailwind CSS ──
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# ── shadcn/ui (also installs Radix + cva + clsx + tailwind-merge as needed) ──
npx shadcn@latest init
npx shadcn@latest add button input select checkbox switch tabs badge avatar \
  card table dialog alert-dialog sheet dropdown-menu popover tooltip calendar \
  skeleton separator form

# ── Icons ──
npm install lucide-react

# ── Routing ──
npm install react-router-dom

# ── Server state ──
npm install @tanstack/react-query
npm install -D @tanstack/react-query-devtools

# ── Client state ──
npm install zustand

# ── Forms + validation ──
npm install react-hook-form zod @hookform/resolvers

# ── Charts ──
npm install recharts

# ── Dates ──
npm install date-fns

# ── Toasts ──
npm install sonner

# ── Animation ──
npm install framer-motion

# ── Maps (nice-to-have) ──
npm install leaflet react-leaflet

# ── Mocking (dev dependency, remove/disable for production build) ──
npm install -D msw
npx msw init public/ --save

# ── Linting/formatting ──
npm install -D eslint prettier eslint-config-prettier
```

---

## 22. Environment Variables

```env
# .env.example — committed to the repo, values blank/placeholder
VITE_API_BASE_URL=https://api.kisansetu.app/api/v1
VITE_APP_NAME=Kisan Setu
VITE_ENABLE_MOCKS=false
```

| Variable | Purpose | Frontend-safe? |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL the `apiClient` prefixes every request with | Yes — public backend URL, not a secret |
| `VITE_APP_NAME` | Display name in Topbar/browser title | Yes |
| `VITE_ENABLE_MOCKS` | Toggles MSW worker registration in `main.jsx` (only in dev) | Yes — a boolean flag, not sensitive |

**Critical rule:** every Vite env var prefixed `VITE_` is bundled into the client-side JS and is **publicly visible** in the deployed bundle. Never put `JWT_SECRET`, database URLs, API keys for third-party paid services, or any backend secret in a `VITE_` variable — those belong only in the backend's own `.env` (blueprint Section 26). The dashboard has no legitimate need for any secret value; if a future requirement seems to need one, that's a sign the call must be proxied through the backend instead.

`.env` (with real values) is gitignored; only `.env.example` is committed, per blueprint Section 41.

---

## 23. Git & Project Workflow

Reuses the blueprint's team-wide Git workflow (Section 41) — do not invent a separate one for the frontend:

- **Branches:** `main` (protected, PR-only), `develop` (protected, PR-only), `feature/dashboard-<short-desc>` (e.g. `feature/dashboard-buyer-requests`), `fix/<short-desc>`.
- **Commit convention:** Conventional Commits — `feat:`, `fix:`, `chore:`, `test:`, `docs:` (e.g. `feat: add optimistic accept/reject on buyer requests`).
- **PRs:** every PR into `develop` needs one teammate review + green CI; PR description states which roadmap Phase/Section it implements (ties directly back to this document's Section 19 phases).
- **Merge strategy:** squash-merge feature branches into `develop` for a clean history; `develop` → `main` via a release PR after a phase is demo-verified.
- **`.gitignore`:** `node_modules/`, `.env`, `dist/`, `.vercel/`.
- **Environment files:** each developer keeps a local `.env` (never committed); Vercel preview/production deployments get their own env vars set in the Vercel dashboard, not from the repo.

---

## 24. Testing Checklist

**Navigation**
- [ ] Every Sidebar/nav link routes correctly for each role
- [ ] Breadcrumbs on detail pages link back correctly
- [ ] Browser back/forward doesn't break auth state or filters

**Forms**
- [ ] Login rejects invalid credentials with correct error message
- [ ] Requirement form rejects negative/zero quantity, missing required fields
- [ ] Bundle builder rejects zero-farmer selection
- [ ] All Zod error messages are human-readable, not raw schema output

**Authentication**
- [ ] Session persists across a hard browser refresh
- [ ] Expired access token triggers silent refresh, not a visible flicker
- [ ] Logout clears session and blocks back-navigation into protected pages
- [ ] Wrong-role access attempt redirects to `/unauthorized`, not a 404 or crash

**API Failures**
- [ ] Killing network mid-Accept shows an error toast and reverts optimistic UI
- [ ] 500 response on Overview shows per-widget error state, not a blank page
- [ ] 404 on a transaction detail (deleted/invalid id) shows a friendly not-found message, not a crash

**Loading States**
- [ ] Every list page shows skeletons, not a blank flash, before data arrives
- [ ] Slow network (throttle to Slow 3G in devtools) doesn't produce layout shift

**Empty States**
- [ ] New buyer with zero requirements sees the welcoming empty state, not an error
- [ ] Filtered table with no matches shows "clear filters" CTA

**Mobile Responsiveness**
- [ ] Full demo flow completable on a 375px viewport
- [ ] Tables convert to cards correctly, no horizontal overflow
- [ ] Sticky submit buttons don't overlap content

**Desktop Responsiveness**
- [ ] Layout doesn't over-stretch awkwardly at 1920px+ (respect `max-w-7xl`)

**Browser Compatibility**
- [ ] Chrome, Firefox, Safari (desktop) — no console errors, visual parity
- [ ] Safari-specific date input / flex quirks checked

**Accessibility**
- [ ] Full demo flow completable via keyboard only
- [ ] Screen reader announces status changes on Requests page

**Buttons**
- [ ] Every primary action button has loading/disabled/success/error states verified per Section 14

**Modals**
- [ ] ConfirmDialog traps focus, Escape closes it, background is inert while open

**Tables**
- [ ] Sorting (if implemented) doesn't break pagination state
- [ ] Pagination URL params survive a page refresh

**Search**
- [ ] Debounce prevents a request per keystroke
- [ ] Clearing search resets to full unfiltered list

**Filters**
- [ ] Combining status filter + search + date range all narrow correctly together
- [ ] Filters persist across a page refresh (URL params)

**File Uploads**
- [ ] N/A — no file upload requirement in this project's MVP scope (confirm this stays true before demo)

**Authentication Redirects**
- [ ] Deep-linking to a protected URL while logged out → login → redirected back to that exact URL

---

## 25. Performance Optimization

- **Lazy loading / code splitting:** `React.lazy()` + `Suspense` at the route level for `/admin/*`, `/buyer/*`, `/fpo/*` bundles — a buyer never needs to download admin-only chart code.
- **Image optimization:** Landing page illustrations exported as optimized SVG/WebP, no unoptimized PNGs.
- **Bundle size:** watch `recharts` and `leaflet` — both are the heaviest dependencies here; lazy-load the Analytics/heatmap page specifically so they don't bloat the initial Login/Landing bundle.
- **React rendering:** memoize `TransactionRow`/`RequestCard` with `React.memo` since these render in lists that re-render on every optimistic mutation; avoid inline arrow-function props where it causes unnecessary re-renders in large lists.
- **API caching:** TanStack Query's default `staleTime` tuned per resource — KPIs/Overview can tolerate a 30–60s stale window (avoid re-fetching on every tab focus during a demo), while `/buyer/requests` should have a shorter stale time or a `refetchInterval` so new requests appear promptly during the live demo.
- **Memoization:** `useMemo` for derived table data (e.g. computed funnel percentages) only where profiling shows it matters — do not memoize everything reflexively.
- **Font loading:** self-host Inter via `@fontsource/inter` or preload the Google Fonts link with `font-display: swap` to avoid invisible-text flash.
- **Lighthouse / Core Web Vitals:** run Lighthouse on Landing and Admin Overview pre-deployment; target LCP <2.5s, CLS near 0 (skeletons must reserve the exact final layout space to avoid shift).

**Explicitly deferred (premature at this scale):** server-side rendering, service workers/PWA, virtualized lists (table sizes here — dozens to low hundreds of rows for a hackathon pilot — don't warrant `react-window`).

---

## 26. Production Readiness Checklist

- [ ] `VITE_API_BASE_URL` points to the production API, not localhost/staging
- [ ] Production build (`npm run build`) completes with zero errors and zero warnings
- [ ] No `console.log`/`console.error` debug statements left in committed code (ESLint rule enforced)
- [ ] Every page in Section 3 verified responsive at all breakpoints
- [ ] Accessibility pass (Section 17) complete
- [ ] Every loading/error/empty state in Section 15 verified against the real API, not just mocks
- [ ] `favicon.ico` / `favicon.svg` set (Kisan Setu mark, not the Vite default)
- [ ] `<title>` and `<meta name="description">` set per page (React Router + a small `useDocumentTitle` hook, or a head-management approach)
- [ ] Open Graph tags on the Landing page (`og:title`, `og:description`, `og:image`) — judges/reviewers may share the link before the live session
- [ ] Custom 404 page verified reachable via an actual unknown URL, not just internal routing
- [ ] Security: no secrets in `VITE_` vars (Section 22), CORS confirmed restricted to the deployed origin on the backend side
- [ ] Performance: Lighthouse run completed, no major regressions
- [ ] Production build tested via `npm run preview` before deploying, matching dev behavior

---

## 27. Deployment

**Recommendation: Vercel.** This matches blueprint Section 33's architecture exactly (dashboard on Vercel, API on Render/Railway, CORS restricted to the Vercel domain), gives automatic PR preview deployments (useful for team review before merging demo-critical UI), zero-config SPA routing support for Vite, and a generous free tier sufficient for an SIH pilot.

| Option | Verdict |
|---|---|
| **Vercel** | **Recommended** — matches blueprint architecture, free tier, PR previews, trivial Vite SPA config |
| Netlify | Equally capable alternative; only switch if the team already has Netlify infra elsewhere |
| Cloudflare Pages | Fine alternative, marginally more manual SPA-routing config; no strong reason to pick over Vercel here |
| GitHub Pages | Not recommended — no built-in env var injection per environment, awkward SPA routing, worse fit for a team already using GitHub Actions CI |

**Exact deployment steps:**
1. Push `apps/dashboard` to GitHub (monorepo — set Vercel's "Root Directory" to `apps/dashboard`).
2. In Vercel: "Import Project" → select the repo → set Root Directory to `apps/dashboard`.
3. **Build command:** `npm run build`
4. **Output directory:** `dist`
5. **Environment variables:** add `VITE_API_BASE_URL` (production API URL) and `VITE_APP_NAME` in Vercel's Project Settings → Environment Variables, for both Production and Preview environments.
6. **SPA routing config:** add a `vercel.json` in `apps/dashboard`:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```
   This ensures a hard refresh on `/buyer/requests` doesn't 404 — Vercel serves `index.html` and React Router takes over client-side.
7. Deploy — Vercel auto-builds on push to `main` (production) and every PR (preview URL).
8. **Custom domain (optional):** add under Project Settings → Domains once a domain is available; not required for judging.
9. **Redeploy after changes:** simply push to `main` (or merge the PR) — Vercel redeploys automatically; no manual redeploy step needed.

---

## 28. SIH Demo Optimization

The frontend's job in the demo is narrow and specific: it is **not** the star of the first 3 minutes (that's the live WhatsApp conversation per blueprint Section 31) — it is the payoff in minutes 4:30–6:30, where the loop visibly closes. Design every polish decision around that window.

**First 30 seconds a judge sees the dashboard (minute ~4:30):**
- The Buyer's `/buyer/requests` page, already logged in on a second screen, showing a fresh pending request card with a visible match score.
- This must load instantly (pre-warmed, not a cold skeleton the judge has to wait through) — keep this tab open and idle before the demo starts, don't navigate to it live.

**Workflow to demonstrate:** exactly the Buyer flow in Section 4.2 — Accept click → optimistic animation → toast → then cut to Admin Overview (Section 4.3) showing the funnel KPI increment. These two flows are the **only** ones that need to be flawless; everything else (Analytics, System Health, FPO bundle builder) is secondary polish a judge might click into during Q&A, not during the timed script.

**Animations worth implementing (from Section 18):** the Accept-card transition and the KPI count-up are the two animations judges will actually consciously register — prioritize building these well over any other motion polish.

**Features receiving the most polish:** `RequestCard` + `ScoreBreakdown` (this is where "explainability" — the project's stated differentiator per blueprint Section 1.4 — becomes visible on screen), `StatusTimeline` on Transaction detail (the auditability story), Admin Overview funnel chart.

**Features that can be simplified for the demo:** System Health can be a static-looking table if the real ingestion pipeline isn't fully wired by Week 6 — it's a real page, just not one anyone will stare at. FPO bundle builder can be demonstrated with 2 farmers instead of a large realistic set. Analytics district heatmap can fall back to a simple ranked bar list if the Leaflet map isn't finished in time — don't let a nice-to-have visualization block the core loop.

**What to mock if the backend isn't ready:** everything, via MSW, seeded to match blueprint Section 30's exact seed shape (same district names, same "hero farmer" reserved with no pre-existing sell intent) — so that when the real backend does come online, the demo data is already narratively identical and nothing about the rehearsed script needs to change.

**How to create a convincing demo flow:** rehearse with two devices/screens side by side exactly as blueprint Section 31 describes — phone (WhatsApp) and laptop (dashboard) — and treat the dashboard's Accept button click as the literal, physical hand-off moment in the live script, not a description of what "would happen."

### 5-Minute Ideal Frontend-Portion Demo Flow

```
0:00–0:15  Dashboard already open on /buyer/requests, buyer already logged in.
           Presenter narrates: "The farmer's request has just come in."
0:15–0:45  Click into the RequestCard's "why this match" expand — show the
           ScoreBreakdown bars live. "This isn't a black box — location,
           quantity, price, quality, and timing all contributed to this 82%."
0:45–1:15  Click Accept → ConfirmDialog → confirm. Card animates, toast fires.
           "The farmer is notified on WhatsApp right now."
1:15–1:45  Cut to phone: show the WhatsApp acceptance notification arriving.
1:45–2:30  Cut back to a second dashboard tab: Admin Overview. Refresh (or let
           the live refetch fire). Funnel KPI's "Accepted" count increments.
           "This is a government evaluator's view — not a chatbot log, a real
           closed-loop transaction, auditable end to end."
2:30–3:00  Click into Transactions → the transaction detail → StatusTimeline
           showing REQUESTED → ACCEPTED with real timestamps.
3:00–3:30  Close with the Landing page's four-stage funnel visual on screen as
           the final held frame, tying back to the opening thesis.
```

---

## 29. Time-Based Prioritization

### Emergency — 24 Hours
**Build:** Login (hardcoded/mocked auth acceptable), DashboardLayout shell, Admin Overview (KPI cards only, static/mocked chart), Buyer Requests page with a working Accept button (optimistic UI, can be entirely mock-backed with no real API), Buyer Transactions list (read-only). Landing page as a single static hero section.
**Skip entirely:** FPO module, Analytics, System Health, Crops/Weather/Market Prices admin pages, Forgot Password, real API integration (stay on MSW mocks the whole time), animations beyond the bare Accept-card transition, accessibility pass, responsive polish beyond "doesn't visibly break."
**Rationale:** the 5-minute demo script only needs the Accept flow + Overview funnel — build exactly those two screens well and nothing else.

### Fast Build — 3–5 Days
**Build:** everything in Emergency, plus: real MSW-mocked-to-real-API swap once backend is available, Requirement Form CRUD, Transaction detail with StatusTimeline, Admin Farmers/Transactions full pages, basic FPO Dashboard + Farmers tab (Bundle builder can stay stubbed), responsive pass on the core demo pages only, Sonner toasts everywhere, basic loading/error/empty states on every built page.
**Skip:** Analytics charts beyond a simple table, System Health, Weather/Market Prices detail pages (keep as simple read-only tables, skip chart polish), Leaflet map, Framer Motion polish beyond Accept/KPI count-up, forgot-password flow (stub only).
**Rationale:** a judge poking around after the scripted demo should find a functional, if not fully decorated, app in every corner they click.

### Full Build — 1–2 Weeks
**Build:** every page in Section 3, every animation in Section 18, full accessibility pass (Section 17), full responsive pass (Section 16), Analytics with real charts + district visualization, System Health, FPO Bundle builder fully working, forgot-password UI, performance pass (Section 25), full production readiness checklist (Section 26).
**Skip:** anything explicitly out of MVP scope per the blueprint's Section 1.9 (multi-language dashboard UI, payment integration UI, logistics UI) — these were never in scope regardless of time available.

---

## 30. Final Master Checklist

```
## Project Setup
- [ ] Initialize Vite (React template)
- [ ] Configure Tailwind CSS
- [ ] Configure path alias (@/)
- [ ] Install & init shadcn/ui
- [ ] Install ESLint + Prettier
- [ ] Create full folder structure (Section 5)
- [ ] Set up .env.example and local .env
- [ ] Set up MSW mock handlers matching Section 12.3 contract

## Design System
- [ ] Define CSS color variables (Section 7.1)
- [ ] Set up typography scale (Inter font)
- [ ] Generate themed shadcn primitives (Button, Input, Card, Badge, Skeleton, etc.)
- [ ] Define spacing/radius/shadow tokens

## Layout Components
- [ ] Sidebar (role-aware)
- [ ] Topbar (title slot, notification bell, profile dropdown)
- [ ] MobileNav (Sheet drawer)
- [ ] Footer
- [ ] DashboardLayout
- [ ] AuthLayout

## Common / Feature Components
- [ ] EmptyState
- [ ] ErrorState
- [ ] LoadingSkeleton
- [ ] ConfirmDialog
- [ ] StatusBadge
- [ ] MatchScoreBadge
- [ ] ScoreBreakdown
- [ ] StatusTimeline
- [ ] KpiCard
- [ ] RequestCard
- [ ] RequirementCard
- [ ] TransactionRow
- [ ] FarmerCard
- [ ] DateRangeFilter
- [ ] SearchInput
- [ ] Pagination

## Routing & Auth
- [ ] routes/index.jsx full route tree
- [ ] ProtectedRoute (role-checked)
- [ ] roleRoutes.js
- [ ] authStore.js (Zustand)
- [ ] apiClient.js (bearer attach + 401 refresh-retry)
- [ ] Silent-refresh boot check in App.jsx

## Public Pages
- [ ] Landing (/)
- [ ] Login
- [ ] Forgot Password
- [ ] Unauthorized
- [ ] 404 Not Found

## Admin Pages
- [ ] Overview
- [ ] Farmers (list + detail)
- [ ] Buyers
- [ ] FPOs (list + detail)
- [ ] Crops
- [ ] Market Prices
- [ ] Weather
- [ ] Recommendations
- [ ] Transactions (list + detail)
- [ ] Analytics
- [ ] System Health

## Buyer Pages
- [ ] Dashboard
- [ ] Requirements (list)
- [ ] Requirement New/Edit form
- [ ] Incoming Requests (Accept/Reject flow)
- [ ] Transactions (list + detail)
- [ ] Profile

## FPO Pages
- [ ] Dashboard
- [ ] Farmers
- [ ] Demand
- [ ] Bundle Transaction builder
- [ ] Transactions (list + detail)
- [ ] Profile

## Data Layer
- [ ] All api/*.js request functions written per Section 12.3 contract
- [ ] All hooks/*.js TanStack Query wrappers written
- [ ] Optimistic Accept/Reject mutation with rollback on error
- [ ] Flag and document the two API gaps (GET /admin/buyers, GET /admin/fpos)

## States (per page in Section 15)
- [ ] Loading skeletons on every data-fetching page
- [ ] Empty states with correct copy + CTA where relevant
- [ ] Error states with retry, scoped per-widget where noted
- [ ] Validation states on every form (Zod + RHF)

## Responsive Design
- [ ] Verified at 375px (mobile)
- [ ] Verified at 768px (tablet)
- [ ] Verified at 1024px+ (desktop)
- [ ] Tables convert to cards on mobile
- [ ] Sidebar collapses correctly at each breakpoint

## Accessibility
- [ ] Full demo flow keyboard-navigable
- [ ] Focus states visible on every interactive element
- [ ] ARIA labels on icon-only buttons
- [ ] Form errors linked via aria-describedby
- [ ] Color+icon (not color alone) on all status indicators

## Animations
- [ ] Accept-card transition
- [ ] KPI count-up on Overview load
- [ ] Toast enter/exit (Sonner default)
- [ ] Modal/dialog open-close (Radix default)
- [ ] Sidebar collapse transition

## Testing
- [ ] Full Section 24 checklist executed
- [ ] Cross-browser check (Chrome/Firefox/Safari)
- [ ] Network-failure simulation on Accept/Reject
- [ ] Deep-link-while-logged-out redirect verified

## Performance
- [ ] Route-level code splitting (React.lazy)
- [ ] Lighthouse run on Landing + Overview, score ≥85
- [ ] Bundle size checked (recharts/leaflet lazy-loaded)
- [ ] No layout shift on skeleton→content swap

## Production Readiness
- [ ] Production env vars set
- [ ] Clean production build, zero warnings
- [ ] No debug console statements
- [ ] Favicon + metadata + OG tags set
- [ ] 404 verified at deployed URL level

## Deployment
- [ ] Vercel project created, root directory set to apps/dashboard
- [ ] Build command / output directory configured
- [ ] Environment variables set in Vercel
- [ ] vercel.json SPA rewrite added
- [ ] Production deploy verified live
- [ ] Custom domain configured (optional)

## Demo Readiness
- [ ] Buyer Requests page pre-warmed/idle before demo start
- [ ] Full 5-minute frontend demo flow (Section 28) rehearsed twice
- [ ] Second-screen dashboard + phone WhatsApp handoff rehearsed
- [ ] Fallback plan confirmed if live network fails (mock/seed data still tells the same story)
```

---

*This roadmap is a companion to `kisan-setu-master-blueprint.md` and inherits all architectural decisions made there (API contracts, roles, transaction lifecycle, seed data) as ground truth. Where this document notes an API gap or an open decision, resolve it with the Backend Engineer rather than guessing — the two documents must stay in sync as the six-week build progresses.*

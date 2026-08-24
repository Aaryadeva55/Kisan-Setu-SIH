import { http, HttpResponse } from 'msw';
import {
  SEED_USERS,
  SEED_DISTRICTS,
  SEED_CROPS,
  SEED_FARMERS,
  SEED_BUYER_REQUIREMENTS,
  SEED_TRANSACTIONS,
  SEED_FPOS,
  SEED_NOTIFICATIONS,
} from './seedData';

// Dynamic in-memory state for live demo interactivity
let transactionsState = JSON.parse(JSON.stringify(SEED_TRANSACTIONS));
let requirementsState = JSON.parse(JSON.stringify(SEED_BUYER_REQUIREMENTS));
let notificationsState = JSON.parse(JSON.stringify(SEED_NOTIFICATIONS));
let farmersState = JSON.parse(JSON.stringify(SEED_FARMERS));

export const handlers = [
  // ── Auth Handlers ──
  http.post('*/api/v1/auth/login', async ({ request }) => {
    const { email } = await request.json();
    let matchedUser = Object.values(SEED_USERS).find((u) => u.email.toLowerCase() === email?.toLowerCase());
    
    // Default fallback to Buyer if unrecognized email in demo
    if (!matchedUser) {
      if (email?.includes('admin')) matchedUser = SEED_USERS.admin;
      else if (email?.includes('eval')) matchedUser = SEED_USERS.evaluator;
      else if (email?.includes('fpo')) matchedUser = SEED_USERS.fpo;
      else matchedUser = SEED_USERS.buyer;
    }

    return HttpResponse.json({
      user: matchedUser,
      accessToken: `mock_jwt_token_${matchedUser.role.toLowerCase()}_${Date.now()}`,
    });
  }),

  http.post('*/api/v1/auth/refresh', () => {
    return HttpResponse.json({
      user: SEED_USERS.buyer,
      accessToken: `mock_jwt_token_refreshed_${Date.now()}`,
    });
  }),

  http.post('*/api/v1/auth/logout', () => {
    return HttpResponse.json({ success: true, message: 'Logged out successfully' });
  }),

  // ── Admin Overview & Analytics ──
  http.get('*/api/v1/admin/overview', () => {
    const requested = transactionsState.filter((t) => t.status === 'REQUESTED').length;
    const accepted = transactionsState.filter((t) => t.status === 'ACCEPTED').length;
    const inProgress = transactionsState.filter((t) => t.status === 'IN_PROGRESS').length;
    const completed = transactionsState.filter((t) => t.status === 'COMPLETED').length;
    
    const completedGmv = transactionsState
      .filter((t) => t.status === 'COMPLETED')
      .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

    return HttpResponse.json({
      metrics: {
        totalFarmersReached: farmersState.length + 1845,
        totalFarmersDelta: 14.2,
        advisoriesDelivered30d: 4280,
        advisoriesDelta: 18.5,
        activeSellIntents: requested + 12,
        estimatedGmvClosed: completedGmv + 3450000,
        gmvDelta: 22.8,
        pipelineHealth: {
          status: 'HEALTHY',
          lastIngestionMinutesAgo: 4,
          weatherSync: 'OK',
          priceSync: 'OK',
        },
      },
      funnel: [
        { stage: 'Sell Intents Registered', count: requested + accepted + inProgress + completed + 85, fill: '#2E7DAF' },
        { stage: 'Buyer Matched', count: accepted + inProgress + completed + 42, fill: '#C9A227' },
        { stage: 'Buyer Accepted', count: accepted + inProgress + completed, fill: '#5EA980' },
        { stage: 'Transaction Closed', count: completed, fill: '#1E6F4C' },
      ],
      districtAdoption: [
        { district: 'Nashik', farmersCount: 840, transactionsCount: 42, gmv: 1850000 },
        { district: 'Ahmednagar', farmersCount: 520, transactionsCount: 28, gmv: 1200000 },
        { district: 'Pune', farmersCount: 410, transactionsCount: 19, gmv: 890000 },
        { district: 'Solapur', farmersCount: 290, transactionsCount: 14, gmv: 620000 },
        { district: 'Chhatrapati Sambhajinagar', farmersCount: 195, transactionsCount: 9, gmv: 410000 },
      ],
      recentTransactions: transactionsState.slice(0, 8),
    });
  }),

  http.get('*/api/v1/admin/analytics', () => {
    return HttpResponse.json({
      gmvTrends: [
        { month: 'Apr', gmv: 420000, transactions: 18 },
        { month: 'May', gmv: 680000, transactions: 26 },
        { month: 'Jun', gmv: 1150000, transactions: 44 },
        { month: 'Jul', gmv: 1920000, transactions: 78 },
        { month: 'Aug', gmv: 3450000, transactions: 112 },
      ],
      advisoryVolume: [
        { week: 'W1', count: 620 },
        { week: 'W2', count: 840 },
        { week: 'W3', count: 1210 },
        { week: 'W4', count: 1610 },
      ],
      cropBreakdown: [
        { crop: 'Soybean', percentage: 38, value: 1311000 },
        { crop: 'Onion', percentage: 29, value: 1000500 },
        { crop: 'Tomato', percentage: 18, value: 621000 },
        { crop: 'Wheat', percentage: 15, value: 517500 },
      ],
    });
  }),

  http.get('*/api/v1/admin/system-health', () => {
    return HttpResponse.json({
      status: 'HEALTHY',
      serverUptime: '99.98%',
      lastChecked: new Date().toISOString(),
      queues: [
        { id: 'q_price', jobType: 'Market Price ETL (Agmarknet)', lastRun: '4 mins ago', status: 'Success', queueDepth: 0 },
        { id: 'q_weather', jobType: 'IMD Weather Ingestion', lastRun: '12 mins ago', status: 'Success', queueDepth: 0 },
        { id: 'q_matching', jobType: 'Buyer Demand Matcher', lastRun: '1 min ago', status: 'Success', queueDepth: 2 },
        { id: 'q_notif', jobType: 'WhatsApp Notification Worker', lastRun: 'Just now', status: 'Success', queueDepth: 0 },
        { id: 'q_cleanup', jobType: 'Expired Intent Cleanup', lastRun: '2 hours ago', status: 'Success', queueDepth: 0 },
      ],
    });
  }),

  // ── Farmers & Advisories ──
  http.get('*/api/v1/farmers', () => {
    return HttpResponse.json({ farmers: farmersState, total: farmersState.length });
  }),

  http.get('*/api/v1/farmers/:id', ({ params }) => {
    const farmer = farmersState.find((f) => f.id === params.id) || farmersState[0];
    return HttpResponse.json({ farmer });
  }),

  http.get('*/api/v1/farmers/:id/advisories', ({ params }) => {
    return HttpResponse.json({
      advisories: [
        {
          id: 'adv_01',
          crop: 'Soybean (JS 335)',
          sowingRecommendation: 'Optimal sowing between June 20 - July 05 after 75mm cumulative rainfall.',
          waterManagement: 'Ensure field drainage during heavy showers; avoid waterlogging in vegetative stage.',
          pestWarning: 'Monitor for Stem Fly & Spodoptera. Spray Chlorantraniliprole 18.5% SC @ 3ml/10L if threshold >2 larvae/m row.',
          suitabilityScore: 92,
          date: '2026-08-20T10:00:00Z',
        },
        {
          id: 'adv_02',
          crop: 'Onion (Late Kharif)',
          sowingRecommendation: 'Nursery preparation recommended in raised beds with Trichoderma seed treatment.',
          suitabilityScore: 84,
          date: '2026-08-10T14:30:00Z',
        },
      ],
    });
  }),

  http.get('*/api/v1/farmers/:id/sell-intents', ({ params }) => {
    const intents = transactionsState.filter((t) => t.farmerId === params.id);
    return HttpResponse.json({ sellIntents: intents });
  }),

  // ── Buyers & Requirements ──
  http.get('*/api/v1/admin/buyers', () => {
    return HttpResponse.json({
      buyers: [
        {
          id: 'usr_buyer_01',
          name: 'Sahyadri Agri Processors Ltd',
          contactPerson: 'Vikas Shinde',
          phone: '+91 98230 11223',
          email: 'buyer@sahyadri.com',
          district: 'Nashik',
          activeRequirementsCount: requirementsState.filter((r) => r.isActive).length,
          totalProcuredKg: 145000,
        },
        {
          id: 'usr_buyer_02',
          name: 'Mahyco Supply Chain Pvt Ltd',
          contactPerson: 'Pooja Deshmukh',
          phone: '+91 98500 44332',
          email: 'pooja@mahyco.com',
          district: 'Pune',
          activeRequirementsCount: 2,
          totalProcuredKg: 89000,
        },
      ],
    });
  }),

  http.get('*/api/v1/buyers/requirements', () => {
    return HttpResponse.json({ requirements: requirementsState });
  }),

  http.post('*/api/v1/buyers/requirements', async ({ request }) => {
    const body = await request.json();
    const crop = SEED_CROPS.find((c) => c.id === body.cropId) || SEED_CROPS[0];
    const district = SEED_DISTRICTS.find((d) => d.id === body.districtId) || SEED_DISTRICTS[0];

    const newReq = {
      id: `req_${Date.now().toString().slice(-4)}`,
      buyerId: 'usr_buyer_01',
      buyerName: 'Sahyadri Agri Processors Ltd',
      cropId: body.cropId,
      cropName: crop.name,
      quantityKg: Number(body.quantityKg),
      maxPricePerKg: body.maxPricePerKg ? Number(body.maxPricePerKg) : crop.modalPrice / 100,
      minQualityGrade: body.minQualityGrade,
      districtId: body.districtId,
      districtName: district.name,
      radiusKm: Number(body.radiusKm),
      neededByDate: body.neededByDate,
      isActive: true,
      matchedCount: 0,
      createdAt: new Date().toISOString(),
    };

    requirementsState = [newReq, ...requirementsState];
    return HttpResponse.json({ requirement: newReq }, { status: 201 });
  }),

  http.patch('*/api/v1/buyers/requirements/:id', async ({ params, request }) => {
    const body = await request.json();
    requirementsState = requirementsState.map((r) => (r.id === params.id ? { ...r, ...body } : r));
    const updated = requirementsState.find((r) => r.id === params.id);
    return HttpResponse.json({ requirement: updated });
  }),

  // ── FPO Module ──
  http.get('*/api/v1/admin/fpos', () => {
    return HttpResponse.json({ fpos: SEED_FPOS });
  }),

  http.get('*/api/v1/fpo/:id/farmers', () => {
    return HttpResponse.json({
      farmers: farmersState.filter((f) => f.fpoId === 'fpo_godavari' || true),
    });
  }),

  http.get('*/api/v1/fpo/:id/demand', () => {
    return HttpResponse.json({ demand: requirementsState });
  }),

  http.post('*/api/v1/fpo/:id/bundle-transaction', async ({ request }) => {
    const body = await request.json();
    const targetReq = requirementsState.find((r) => r.id === body.buyerRequirementId) || requirementsState[0];

    const newBundleTxn = {
      id: `TXN-BUNDLE-${Date.now().toString().slice(-4)}`,
      sellIntentId: `bundle_${Date.now().toString().slice(-4)}`,
      farmerId: 'fpo_godavari',
      farmerName: 'Godavari FPO (Multi-farmer Bundle)',
      farmerPhone: '+91 98221 00987',
      farmerVillage: 'Aggregated Nashik Cluster',
      buyerId: targetReq.buyerId,
      buyerName: targetReq.buyerName,
      cropId: targetReq.cropId,
      cropName: targetReq.cropName,
      quantityKg: 3500,
      agreedPricePerKg: targetReq.maxPricePerKg || 50,
      totalAmount: 3500 * (targetReq.maxPricePerKg || 50),
      districtName: targetReq.districtName,
      status: 'REQUESTED',
      matchScore: 94,
      scoreBreakdown: {
        locationScore: 96,
        quantityScore: 98,
        priceScore: 90,
        qualityScore: 92,
        timingScore: 94,
      },
      requestedAt: new Date().toISOString(),
      statusHistory: [
        {
          status: 'REQUESTED',
          actor: 'Godavari Farmer Producer Co. (Bundle Builder)',
          timestamp: new Date().toISOString(),
          note: `Bundled 3 farmers (${body.sellIntentIds?.length || 3} members) for ${targetReq.cropName}`,
        },
      ],
    };

    transactionsState = [newBundleTxn, ...transactionsState];
    return HttpResponse.json({ transaction: newBundleTxn }, { status: 201 });
  }),

  // ── Crops, Weather, Mandi Prices ──
  http.get('*/api/v1/crops', () => {
    return HttpResponse.json({ crops: SEED_CROPS });
  }),

  http.get('*/api/v1/weather/:districtId/latest', ({ params }) => {
    return HttpResponse.json({
      district: 'Nashik',
      temperatureC: 28.4,
      humidityPercent: 78,
      rainfallMm: 12.4,
      forecast: 'Moderate showers expected over the next 48 hours; good for soybean flowering stage.',
      updatedAt: new Date().toISOString(),
    });
  }),

  http.get('*/api/v1/weather/:districtId/history', () => {
    return HttpResponse.json({
      history: [
        { date: '18 Aug', temp: 29, rainfall: 4 },
        { date: '19 Aug', temp: 28, rainfall: 15 },
        { date: '20 Aug', temp: 27, rainfall: 22 },
        { date: '21 Aug', temp: 28, rainfall: 8 },
        { date: '22 Aug', temp: 30, rainfall: 0 },
        { date: '23 Aug', temp: 29, rainfall: 5 },
        { date: '24 Aug', temp: 28, rainfall: 12 },
      ],
    });
  }),

  http.get('*/api/v1/market/prices/latest', () => {
    return HttpResponse.json({
      prices: [
        { mandi: 'Lasalgaon (Nashik)', crop: 'Onion (Red)', modalPrice: 2450, minPrice: 1800, maxPrice: 2850, date: '2026-08-24' },
        { mandi: 'Pimpalgaon Baswant', crop: 'Soybean', modalPrice: 4850, minPrice: 4600, maxPrice: 5100, date: '2026-08-24' },
        { mandi: 'Baramati (Pune)', crop: 'Tomato', modalPrice: 1950, minPrice: 1400, maxPrice: 2200, date: '2026-08-24' },
        { mandi: 'Sangamner', crop: 'Cotton (Bt)', modalPrice: 7100, minPrice: 6800, maxPrice: 7400, date: '2026-08-23' },
      ],
    });
  }),

  http.get('*/api/v1/market/prices/history', () => {
    return HttpResponse.json({
      history: [
        { date: '01 Aug', modalPrice: 4650 },
        { date: '05 Aug', modalPrice: 4700 },
        { date: '10 Aug', modalPrice: 4780 },
        { date: '15 Aug', modalPrice: 4820 },
        { date: '20 Aug', modalPrice: 4890 },
        { date: '24 Aug', modalPrice: 4850 },
      ],
    });
  }),

  http.get('*/api/v1/recommendations/:farmerId/latest', () => {
    return HttpResponse.json({
      advisory: {
        crop: 'Soybean (JS 335)',
        suitabilityScore: 92,
        rationale: 'High rainfall probability (78mm) aligned with sowing date. Soil NPK values optimal for legume nodulation.',
        generatedAt: '2026-08-20T10:00:00Z',
      },
    });
  }),

  // ── Transactions Core (THE DEMO CLIMAX) ──
  http.get('*/api/v1/transactions', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('q')?.toLowerCase();

    let result = [...transactionsState];
    if (status && status !== 'ALL') {
      result = result.filter((t) => t.status === status);
    }
    if (search) {
      result = result.filter(
        (t) =>
          t.farmerName?.toLowerCase().includes(search) ||
          t.buyerName?.toLowerCase().includes(search) ||
          t.cropName?.toLowerCase().includes(search) ||
          t.id.toLowerCase().includes(search)
      );
    }

    return HttpResponse.json({ transactions: result, total: result.length });
  }),

  http.get('*/api/v1/transactions/:id', ({ params }) => {
    const txn = transactionsState.find((t) => t.id === params.id);
    if (!txn) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Transaction not found' } }, { status: 404 });
    }
    return HttpResponse.json({ transaction: txn });
  }),

  // Accept Mutation (Demo Climax!)
  http.patch('*/api/v1/transactions/:id/accept', ({ params }) => {
    const txn = transactionsState.find((t) => t.id === params.id);
    if (!txn) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Transaction not found' } }, { status: 404 });
    }

    txn.status = 'ACCEPTED';
    txn.acceptedAt = new Date().toISOString();
    txn.statusHistory.push({
      status: 'ACCEPTED',
      actor: 'Vikas Shinde (Buyer via Web Dashboard)',
      timestamp: new Date().toISOString(),
      note: `Accepted request for ${txn.quantityKg}kg ${txn.cropName} @ ₹${txn.agreedPricePerKg}/kg. WhatsApp alert dispatched to ${txn.farmerPhone}.`,
    });

    return HttpResponse.json({ transaction: txn, message: 'Transaction accepted successfully. Farmer notified on WhatsApp.' });
  }),

  // Reject Mutation
  http.patch('*/api/v1/transactions/:id/reject', async ({ params, request }) => {
    const txn = transactionsState.find((t) => t.id === params.id);
    if (!txn) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Transaction not found' } }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    txn.status = 'REJECTED';
    txn.rejectedAt = new Date().toISOString();
    txn.statusHistory.push({
      status: 'REJECTED',
      actor: 'Vikas Shinde (Buyer)',
      timestamp: new Date().toISOString(),
      note: body.reason || 'Declined by buyer',
    });

    return HttpResponse.json({ transaction: txn, message: 'Transaction rejected.' });
  }),

  // Complete Mutation
  http.patch('*/api/v1/transactions/:id/complete', ({ params }) => {
    const txn = transactionsState.find((t) => t.id === params.id);
    if (!txn) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Transaction not found' } }, { status: 404 });
    }

    txn.status = 'COMPLETED';
    txn.completedAt = new Date().toISOString();
    txn.statusHistory.push({
      status: 'COMPLETED',
      actor: 'Vikas Shinde (Buyer)',
      timestamp: new Date().toISOString(),
      note: 'Settlement confirmed. Transaction closed.',
    });

    return HttpResponse.json({ transaction: txn, message: 'Transaction marked completed.' });
  }),

  // Cancel Mutation (Admin/Farmer only)
  http.patch('*/api/v1/transactions/:id/cancel', ({ params }) => {
    const txn = transactionsState.find((t) => t.id === params.id);
    if (!txn) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Transaction not found' } }, { status: 404 });
    }

    txn.status = 'CANCELLED';
    txn.cancelledAt = new Date().toISOString();
    txn.statusHistory.push({
      status: 'CANCELLED',
      actor: 'Platform Administrator',
      timestamp: new Date().toISOString(),
      note: 'Transaction cancelled by administrative override',
    });

    return HttpResponse.json({ transaction: txn, message: 'Transaction cancelled.' });
  }),

  // Notifications
  http.get('*/api/v1/notifications', () => {
    return HttpResponse.json({ notifications: notificationsState });
  }),

  http.patch('*/api/v1/notifications/:id/read', ({ params }) => {
    notificationsState = notificationsState.map((n) => (n.id === params.id ? { ...n, isRead: true } : n));
    return HttpResponse.json({ success: true });
  }),
];

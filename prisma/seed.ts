import { PrismaClient, Role, Language, TransactionStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Kisan Setu database...');

  const passwordHash = await bcrypt.hash('password123', 12);

  // 1. Districts
  const districtsData = [
    { name: 'Nashik', state: 'Maharashtra', lat: 19.9975, lng: 73.7898 },
    { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
    { name: 'Ahmednagar', state: 'Maharashtra', lat: 19.0948, lng: 74.748 },
  ];

  const districts: Record<string, any> = {};
  for (const d of districtsData) {
    districts[d.name] = await prisma.district.upsert({
      where: { name_state: { name: d.name, state: d.state } },
      update: {},
      create: { name: d.name, state: d.state },
    });
  }
  console.log('✅ Districts created');

  // 2. Crops & Seasons
  const cropsData = [
    {
      name: 'Soybean',
      category: 'Oilseed',
      waterReq: 'MODERATE',
      seasons: [{ season: 'Kharif', sowStart: 6, sowEnd: 7, harvestStart: 10, harvestEnd: 11 }],
    },
    {
      name: 'Cotton',
      category: 'Fiber',
      waterReq: 'MODERATE',
      seasons: [{ season: 'Kharif', sowStart: 5, sowEnd: 6, harvestStart: 11, harvestEnd: 1 }],
    },
    {
      name: 'Onion',
      category: 'Vegetable',
      waterReq: 'MODERATE',
      seasons: [
        { season: 'Kharif', sowStart: 6, sowEnd: 7, harvestStart: 10, harvestEnd: 11 },
        { season: 'Rabi', sowStart: 10, sowEnd: 11, harvestStart: 2, harvestEnd: 4 },
      ],
    },
    {
      name: 'Sugarcane',
      category: 'Cash Crop',
      waterReq: 'HIGH',
      seasons: [{ season: 'Annual', sowStart: 1, sowEnd: 3, harvestStart: 12, harvestEnd: 3 }],
    },
    {
      name: 'Tomato',
      category: 'Vegetable',
      waterReq: 'HIGH',
      seasons: [
        { season: 'Kharif', sowStart: 6, sowEnd: 8, harvestStart: 9, harvestEnd: 11 },
        { season: 'Rabi', sowStart: 9, sowEnd: 11, harvestStart: 12, harvestEnd: 2 },
      ],
    },
    {
      name: 'Wheat',
      category: 'Cereal',
      waterReq: 'LOW',
      seasons: [{ season: 'Rabi', sowStart: 10, sowEnd: 12, harvestStart: 3, harvestEnd: 4 }],
    },
    {
      name: 'Pomegranate',
      category: 'Horticulture',
      waterReq: 'LOW',
      seasons: [{ season: 'Mrug Bahar', sowStart: 6, sowEnd: 7, harvestStart: 12, harvestEnd: 2 }],
    },
    {
      name: 'Gram',
      category: 'Pulse',
      waterReq: 'LOW',
      seasons: [{ season: 'Rabi', sowStart: 10, sowEnd: 11, harvestStart: 2, harvestEnd: 3 }],
    },
  ];

  const crops: Record<string, any> = {};
  for (const c of cropsData) {
    const crop = await prisma.crop.upsert({
      where: { name: c.name },
      update: { category: c.category, waterReq: c.waterReq },
      create: { name: c.name, category: c.category, waterReq: c.waterReq },
    });
    crops[c.name] = crop;

    for (const s of c.seasons) {
      await prisma.cropSeason.upsert({
        where: { cropId_season: { cropId: crop.id, season: s.season } },
        update: s,
        create: { cropId: crop.id, ...s },
      });
    }
  }
  console.log('✅ Crops & CropSeasons created');

  // 3. Mandis
  const mandisData = [
    { name: 'Lasalgaon APMC', district: 'Nashik', lat: 20.147, lng: 74.226 },
    { name: 'Pimpalgaon APMC', district: 'Nashik', lat: 20.171, lng: 73.985 },
    { name: 'Nashik City APMC', district: 'Nashik', lat: 19.997, lng: 73.789 },
    { name: 'Pune Gultekdi APMC', district: 'Pune', lat: 18.496, lng: 73.868 },
    { name: 'Junnar APMC', district: 'Pune', lat: 19.208, lng: 73.876 },
    { name: 'Baramati APMC', district: 'Pune', lat: 18.152, lng: 74.577 },
    { name: 'Ahmednagar APMC', district: 'Ahmednagar', lat: 19.095, lng: 74.748 },
    { name: 'Rahuri APMC', district: 'Ahmednagar', lat: 19.392, lng: 74.651 },
  ];

  const mandis: Record<string, any> = {};
  for (const m of mandisData) {
    const districtId = districts[m.district].id;
    let mandi = await prisma.mandi.findFirst({
      where: { name: m.name, districtId },
    });
    if (!mandi) {
      mandi = await prisma.mandi.create({
        data: { name: m.name, districtId, latitude: m.lat, longitude: m.lng },
      });
    }
    mandis[m.name] = mandi;
  }
  console.log('✅ Mandis created');

  // 4. Mandi Prices History (Last 60 days)
  console.log('⏳ Generating 60-day Mandi price history series...');
  const basePrices: Record<string, number> = {
    Soybean: 4600,
    Cotton: 7200,
    Onion: 2100,
    Sugarcane: 3100,
    Tomato: 1600,
    Wheat: 2450,
    Pomegranate: 8500,
    Gram: 5300,
  };

  const now = Date.now();
  for (const [mandiName, mandi] of Object.entries(mandis)) {
    for (const [cropName, crop] of Object.entries(crops)) {
      const base = basePrices[cropName] || 3000;
      for (let day = 60; day >= 0; day--) {
        const priceDate = new Date(now - day * 24 * 60 * 60 * 1000);
        // Slight upward or oscillating trend
        const variation = (Math.sin(day / 7) * 0.08 + (60 - day) * 0.002) * base;
        const modal = Math.round(base + variation);
        const min = Math.round(modal * 0.9);
        const max = Math.round(modal * 1.12);

        await prisma.mandiPrice.upsert({
          where: {
            mandiId_cropId_priceDate: {
              mandiId: mandi.id,
              cropId: crop.id,
              priceDate,
            },
          },
          update: { minPrice: min, maxPrice: max, modalPrice: modal },
          create: {
            mandiId: mandi.id,
            cropId: crop.id,
            priceDate,
            minPrice: min,
            maxPrice: max,
            modalPrice: modal,
          },
        });
      }
    }
  }
  console.log('✅ Mandi Prices (60 days) seeded');

  // 5. Weather Data (14 days observed + 5 days forecast)
  for (const [districtName, district] of Object.entries(districts)) {
    // 14 days observed
    for (let day = 14; day >= 0; day--) {
      const date = new Date(now - day * 24 * 60 * 60 * 1000);
      await prisma.weatherData.upsert({
        where: {
          districtId_date_forecast: {
            districtId: district.id,
            date,
            forecast: false,
          },
        },
        update: {},
        create: {
          districtId: district.id,
          date,
          tempMinC: 21.0 + Math.random() * 3,
          tempMaxC: 31.0 + Math.random() * 4,
          rainfallMm: Math.random() > 0.4 ? Math.random() * 25 : 0,
          humidity: 60 + Math.random() * 20,
          forecast: false,
        },
      });
    }

    // 5 days forecast
    for (let day = 1; day <= 5; day++) {
      const date = new Date(now + day * 24 * 60 * 60 * 1000);
      await prisma.weatherData.upsert({
        where: {
          districtId_date_forecast: {
            districtId: district.id,
            date,
            forecast: true,
          },
        },
        update: {},
        create: {
          districtId: district.id,
          date,
          tempMinC: 22.0 + Math.random() * 2,
          tempMaxC: 32.0 + Math.random() * 3,
          rainfallMm: Math.random() > 0.6 ? Math.random() * 15 : 0,
          humidity: 65 + Math.random() * 15,
          forecast: true,
        },
      });
    }
  }
  console.log('✅ Weather series seeded');

  // 6. Admin & Government Evaluator Users
  const adminUser = await prisma.user.upsert({
    where: { phone: '9999999999' },
    update: {},
    create: {
      phone: '9999999999',
      email: 'admin@kisansetu.in',
      passwordHash,
      role: Role.ADMIN,
      preferredLang: Language.ENGLISH,
    },
  });

  const evaluatorUser = await prisma.user.upsert({
    where: { phone: '9999999998' },
    update: {},
    create: {
      phone: '9999999998',
      email: 'evaluator@maharashtra.gov.in',
      passwordHash,
      role: Role.GOVERNMENT_EVALUATOR,
      preferredLang: Language.MARATHI,
    },
  });
  console.log('✅ Admin & Evaluator accounts created');

  // 7. Buyers & Requirements
  const buyersData = [
    { name: 'MahaAgro Procurement Ltd', phone: '9820011111', email: 'procurement@mahaagro.com', type: 'Processor' },
    { name: 'Sahyadri Agro Exports', phone: '9820022222', email: 'trades@sahyadriageo.com', type: 'Exporter' },
    { name: 'Pawan Food Processing', phone: '9820033333', email: 'buyer@pawanfoods.com', type: 'Food Brand' },
    { name: 'Kisan Mart Retail', phone: '9820044444', email: 'purchase@kisanmart.com', type: 'Retail Chain' },
    { name: 'Deccan Grain Corporation', phone: '9820055555', email: 'grain@deccan.com', type: 'Wholesaler' },
  ];

  const buyers: any[] = [];
  for (const b of buyersData) {
    let user = await prisma.user.findUnique({ where: { phone: b.phone } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: b.phone,
          email: b.email,
          passwordHash,
          role: Role.BUYER,
          preferredLang: Language.MARATHI,
        },
      });
    }

    let buyer = await prisma.buyer.findUnique({ where: { userId: user.id } });
    if (!buyer) {
      buyer = await prisma.buyer.create({
        data: { userId: user.id, companyName: b.name, buyerType: b.type },
      });
    }
    buyers.push(buyer);
  }

  // Buyer Requirements
  const requirementsData = [
    { buyerIdx: 0, crop: 'Soybean', qty: 25000, price: 4800, district: 'Nashik', radius: 50 },
    { buyerIdx: 0, crop: 'Cotton', qty: 15000, price: 7400, district: 'Nashik', radius: 60 },
    { buyerIdx: 1, crop: 'Onion', qty: 30000, price: 2350, district: 'Nashik', radius: 40 },
    { buyerIdx: 1, crop: 'Pomegranate', qty: 10000, price: 9000, district: 'Pune', radius: 50 },
    { buyerIdx: 2, crop: 'Tomato', qty: 12000, price: 1800, district: 'Pune', radius: 35 },
    { buyerIdx: 3, crop: 'Wheat', qty: 20000, price: 2600, district: 'Ahmednagar', radius: 50 },
    { buyerIdx: 4, crop: 'Gram', qty: 18000, price: 5500, district: 'Ahmednagar', radius: 60 },
  ];

  const requirements: any[] = [];
  for (const r of requirementsData) {
    const req = await prisma.buyerRequirement.create({
      data: {
        buyerId: buyers[r.buyerIdx].id,
        cropId: crops[r.crop].id,
        quantityKg: r.qty,
        maxPrice: r.price,
        districtId: districts[r.district].id,
        radiusKm: r.radius,
        isActive: true,
      },
    });
    requirements.push(req);
  }
  console.log('✅ Buyers & Requirements seeded');

  // 8. FPOs
  const fposData = [
    { name: 'Godavari Valley Farmer Producer Co', phone: '9830011111', reg: 'FPO-MH-NSK-2023-01', district: 'Nashik' },
    { name: 'Shivaji Maharaj Krishi FPO', phone: '9830022222', reg: 'FPO-MH-PUN-2022-04', district: 'Pune' },
  ];

  const fpos: any[] = [];
  for (const f of fposData) {
    let user = await prisma.user.findUnique({ where: { phone: f.phone } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: f.phone,
          email: `${f.phone}@fpo.in`,
          passwordHash,
          role: Role.FPO,
          preferredLang: Language.MARATHI,
        },
      });
    }

    let fpo = await prisma.fPO.findUnique({ where: { userId: user.id } });
    if (!fpo) {
      fpo = await prisma.fPO.create({
        data: { userId: user.id, name: f.name, regNumber: f.reg },
      });
    }
    fpos.push(fpo);
  }

  // 9. Farmers (15 realistic Marathi farmers)
  const farmersList = [
    { name: 'Ramesh Patil', phone: '9890001001', district: 'Nashik', village: 'Pimpalgaon', acres: 4.5, fpoIdx: 0 },
    { name: 'Sunita Tai Shinde', phone: '9890001002', district: 'Nashik', village: 'Lasalgaon', acres: 3.0, fpoIdx: 0 }, // HERO FARMER
    { name: 'Ananda Deshmukh', phone: '9890001003', district: 'Nashik', village: 'Dindori', acres: 5.0, fpoIdx: 0 },
    { name: 'Tukaram Pawar', phone: '9890001004', district: 'Nashik', village: 'Niphad', acres: 6.2, fpoIdx: 0 },
    { name: 'Sanjay More', phone: '9890001005', district: 'Nashik', village: 'Sinnar', acres: 2.5, fpoIdx: 0 },
    { name: 'Vikas Jadhav', phone: '9890001006', district: 'Pune', village: 'Baramati', acres: 7.0, fpoIdx: 1 },
    { name: 'Ganesh Kadam', phone: '9890001007', district: 'Pune', village: 'Junnar', acres: 3.5, fpoIdx: 1 },
    { name: 'Babanrao Shirole', phone: '9890001008', district: 'Pune', village: 'Shirur', acres: 4.0, fpoIdx: 1 },
    { name: 'Savita Gaikwad', phone: '9890001009', district: 'Pune', village: 'Manchar', acres: 2.0, fpoIdx: 1 },
    { name: 'Eknath Bhosale', phone: '9890001010', district: 'Ahmednagar', village: 'Rahuri', acres: 8.5, fpoIdx: null },
    { name: 'Dnyaneshwar Kale', phone: '9890001011', district: 'Ahmednagar', village: 'Sangamner', acres: 5.0, fpoIdx: null },
    { name: 'Shobha Chavan', phone: '9890001012', district: 'Ahmednagar', village: 'Kopargaon', acres: 3.2, fpoIdx: null },
    { name: 'Pandurang Jagtap', phone: '9890001013', district: 'Nashik', village: 'Yeola', acres: 4.0, fpoIdx: 0 },
    { name: 'Kavita Kolhe', phone: '9890001014', district: 'Pune', village: 'Indapur', acres: 3.8, fpoIdx: 1 },
    { name: 'Bhausaheb Thorat', phone: '9890001015', district: 'Ahmednagar', village: 'Akole', acres: 6.0, fpoIdx: null },
  ];

  const farmers: any[] = [];
  for (const f of farmersList) {
    let user = await prisma.user.findUnique({ where: { phone: f.phone } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: f.phone,
          role: Role.FARMER,
          preferredLang: Language.MARATHI,
        },
      });
    }

    let profile = await prisma.farmerProfile.findUnique({ where: { userId: user.id } });
    if (!profile) {
      profile = await prisma.farmerProfile.create({
        data: {
          userId: user.id,
          fullName: f.name,
          districtId: districts[f.district].id,
          village: f.village,
          landSizeAcres: f.acres,
        },
      });
    }
    farmers.push(profile);

    if (f.fpoIdx !== null) {
      await prisma.fPOMembership.upsert({
        where: { fpoId_farmerId: { fpoId: fpos[f.fpoIdx].id, farmerId: profile.id } },
        update: {},
        create: { fpoId: fpos[f.fpoIdx].id, farmerId: profile.id },
      });
    }
  }
  console.log('✅ 15 Farmers and FPO Memberships created');

  // 10. Sell Intents & Matches & Transactions in Mixed States
  // Note: Farmer index 1 (Sunita Tai Shinde) is intentionally left with NO pre-existing SellIntent
  // so she can be used cleanly as the HERO live demo farmer!
  const sellIntentsData = [
    { farmerIdx: 0, crop: 'Soybean', qty: 2000, price: 4700, status: 'COMPLETED' },
    { farmerIdx: 2, crop: 'Onion', qty: 5000, price: 2300, status: 'COMPLETED' },
    { farmerIdx: 3, crop: 'Cotton', qty: 1500, price: 7300, status: 'ACCEPTED' },
    { farmerIdx: 4, crop: 'Tomato', qty: 3000, price: 1750, status: 'REQUESTED' },
    { farmerIdx: 5, crop: 'Soybean', qty: 4000, price: 4650, status: 'MATCHED' },
    { farmerIdx: 6, crop: 'Pomegranate', qty: 2500, price: 8800, status: 'COMPLETED' },
    { farmerIdx: 7, crop: 'Wheat', qty: 3500, price: 2550, status: 'REJECTED' },
    { farmerIdx: 8, crop: 'Tomato', qty: 1500, price: 1700, status: 'OPEN' },
    { farmerIdx: 9, crop: 'Gram', qty: 2200, price: 5400, status: 'OPEN' },
    { farmerIdx: 10, crop: 'Wheat', qty: 4000, price: 2500, status: 'OPEN' },
  ];

  for (const s of sellIntentsData) {
    const farmer = farmers[s.farmerIdx];
    const crop = crops[s.crop];

    const sellIntent = await prisma.sellIntent.create({
      data: {
        farmerId: farmer.id,
        cropId: crop.id,
        quantityKg: s.qty,
        expectedPrice: s.price,
        status: s.status === 'OPEN' ? 'OPEN' : 'MATCHED',
      },
    });

    // Find a matching buyer requirement
    const req = requirements.find((r) => r.cropId === crop.id);
    if (req && s.status !== 'OPEN') {
      const match = await prisma.match.create({
        data: {
          sellIntentId: sellIntent.id,
          buyerRequirementId: req.id,
          score: 0.84,
          scoreBreakdown: {
            locationScore: 0.9,
            quantityScore: 0.85,
            priceScore: 0.9,
            qualityScore: 0.8,
            timingScore: 0.8,
            baseScore: 1.0,
          },
        },
      });

      if (s.status !== 'MATCHED') {
        const txnStatus = s.status as TransactionStatus;
        const txn = await prisma.transaction.create({
          data: {
            matchId: match.id,
            quantityKg: s.qty,
            agreedPrice: s.price,
            status: txnStatus,
          },
        });

        await prisma.transactionStatusHistory.create({
          data: {
            transactionId: txn.id,
            fromStatus: null,
            toStatus: TransactionStatus.REQUESTED,
            changedBy: `FARMER:${farmer.id}`,
            note: 'Initial transaction requested from match',
          },
        });

        if (txnStatus === TransactionStatus.ACCEPTED || txnStatus === TransactionStatus.COMPLETED) {
          await prisma.transactionStatusHistory.create({
            data: {
              transactionId: txn.id,
              fromStatus: TransactionStatus.REQUESTED,
              toStatus: TransactionStatus.ACCEPTED,
              changedBy: `BUYER:${req.buyerId}`,
              note: 'Accepted by buyer',
            },
          });
        }

        if (txnStatus === TransactionStatus.COMPLETED) {
          await prisma.transactionStatusHistory.create({
            data: {
              transactionId: txn.id,
              fromStatus: TransactionStatus.ACCEPTED,
              toStatus: TransactionStatus.COMPLETED,
              changedBy: `ADMIN:system`,
              note: 'Goods received and payment confirmed',
            },
          });
        }
      }
    }
  }

  console.log('✅ Transactions and audit status histories seeded');
  console.log('\n🌟 Seeding complete! All fixtures ready for demo & testing.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

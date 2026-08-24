import { prisma } from '../../infra/prisma.js';
import { getRedisClient, isRedisInMemory } from '../../infra/redis.js';
import { QUEUE_NAMES, getQueue } from '../../infra/queues/index.js';
import { OverviewMetrics, SystemHealthStatus, TransactionStatus } from '@kisan-setu/types';

export class AdminService {
  async getOverviewMetrics(dateRangeDays = 30): Promise<OverviewMetrics> {
    const since = new Date(Date.now() - dateRangeDays * 24 * 60 * 60 * 1000);

    const [
      totalFarmers,
      recentFarmers,
      advisoriesCount,
      activeIntentsCount,
      allTransactions,
      districtsWithCounts,
    ] = await Promise.all([
      prisma.farmerProfile.count(),
      prisma.farmerProfile.count({ where: { createdAt: { gte: since } } }),
      prisma.advisory.count({ where: { createdAt: { gte: since } } }),
      prisma.sellIntent.count({ where: { status: 'OPEN' } }),
      prisma.transaction.findMany({
        where: { deletedAt: null },
        include: { match: { include: { sellIntent: { include: { crop: true } } } } },
      }),
      prisma.district.findMany({
        include: {
          _count: { select: { farmers: true } },
          farmers: {
            include: {
              sellIntents: {
                include: { matches: { include: { transaction: true } } },
              },
            },
          },
        },
      }),
    ]);

    // Compute Funnel
    const funnel = {
      requested: 0,
      matched: 0,
      accepted: 0,
      inProgress: 0,
      completed: 0,
      rejected: 0,
      cancelled: 0,
    };

    let gmvClosed = 0;

    for (const txn of allTransactions) {
      if (txn.status === TransactionStatus.REQUESTED) funnel.requested++;
      else if (txn.status === TransactionStatus.MATCHED || txn.status === TransactionStatus.PENDING_BUYER) funnel.matched++;
      else if (txn.status === TransactionStatus.ACCEPTED) funnel.accepted++;
      else if (txn.status === TransactionStatus.IN_PROGRESS) funnel.inProgress++;
      else if (txn.status === TransactionStatus.COMPLETED) {
        funnel.completed++;
        const price = txn.agreedPrice || 4000;
        gmvClosed += (txn.quantityKg / 100) * price; // ₹/quintal price * quintals
      } else if (txn.status === TransactionStatus.REJECTED) funnel.rejected++;
      else if (txn.status === TransactionStatus.CANCELLED) funnel.cancelled++;
    }

    // Top districts adoption
    const topDistricts = districtsWithCounts.map((d) => {
      let districtTxnCount = 0;
      let districtGmv = 0;

      for (const f of d.farmers) {
        for (const s of f.sellIntents) {
          for (const m of s.matches) {
            if (m.transaction) {
              districtTxnCount++;
              if (m.transaction.status === TransactionStatus.COMPLETED) {
                const price = m.transaction.agreedPrice || 4000;
                districtGmv += (m.transaction.quantityKg / 100) * price;
              }
            }
          }
        }
      }

      return {
        districtName: d.name,
        farmerCount: d._count.farmers,
        transactionCount: districtTxnCount,
        gmv: Math.round(districtGmv),
      };
    });

    return {
      totalFarmers,
      totalFarmersDelta: recentFarmers,
      advisoriesDelivered: advisoriesCount,
      activeSellIntents: activeIntentsCount,
      gmvClosed: Math.round(gmvClosed),
      funnel,
      topDistricts: topDistricts.sort((a, b) => b.farmerCount - a.farmerCount),
    };
  }

  async getAnalytics(districtId?: string, dateRangeDays = 30) {
    const since = new Date(Date.now() - dateRangeDays * 24 * 60 * 60 * 1000);

    const [transactions, advisories, sellIntents] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          createdAt: { gte: since },
          match: districtId
            ? { sellIntent: { farmer: { districtId } } }
            : undefined,
        },
        include: {
          match: { include: { sellIntent: { include: { crop: true, farmer: { include: { district: true } } } } } },
        },
      }),
      prisma.advisory.findMany({
        where: {
          createdAt: { gte: since },
          farmer: districtId ? { districtId } : undefined,
        },
        include: { crop: true },
      }),
      prisma.sellIntent.findMany({
        where: {
          createdAt: { gte: since },
          farmer: districtId ? { districtId } : undefined,
        },
        include: { crop: true },
      }),
    ]);

    return {
      dateRangeDays,
      districtId,
      transactionsCount: transactions.length,
      advisoriesCount: advisories.length,
      sellIntentsCount: sellIntents.length,
      transactions,
      advisories,
    };
  }

  async getSystemHealth(): Promise<SystemHealthStatus> {
    const startTime = Date.now();
    let dbConnected = false;
    let dbLatencyMs = 0;

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
      dbLatencyMs = Date.now() - startTime;
    } catch {
      dbConnected = false;
    }

    const redis = getRedisClient();
    let redisConnected = false;
    try {
      const pong = await redis.ping();
      redisConnected = pong === 'PONG';
    } catch {
      redisConnected = false;
    }

    const queueStatuses = [];
    for (const [key, name] of Object.entries(QUEUE_NAMES)) {
      try {
        const q: any = getQueue(name);
        const [waiting, active, failed, completed] = await Promise.all([
          q.getWaitingCount ? q.getWaitingCount() : 0,
          q.getActiveCount ? q.getActiveCount() : 0,
          q.getFailedCount ? q.getFailedCount() : 0,
          q.getCompletedCount ? q.getCompletedCount() : 0,
        ]);

        queueStatuses.push({
          name,
          waiting,
          active,
          failed,
          completed,
          status: failed > 5 ? ('FAILED' as const) : ('ACTIVE' as const),
        });
      } catch {
        queueStatuses.push({
          name,
          waiting: 0,
          active: 0,
          failed: 0,
          completed: 0,
          status: 'IDLE' as const,
        });
      }
    }

    const isHealthy = dbConnected && (redisConnected || isRedisInMemory());

    return {
      status: isHealthy ? 'HEALTHY' : 'DEGRADED',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: {
        connected: dbConnected,
        latencyMs: dbLatencyMs,
      },
      redis: {
        connected: redisConnected || isRedisInMemory(),
        mode: isRedisInMemory() ? 'in-memory-fallback' : 'redis',
      },
      queues: queueStatuses,
    };
  }
}

export const adminService = new AdminService();

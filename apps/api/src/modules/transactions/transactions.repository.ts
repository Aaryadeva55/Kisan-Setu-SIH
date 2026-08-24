import { prisma } from '../../infra/prisma.js';
import { TransactionStatus } from '@kisan-setu/types';

export class TransactionsRepository {
  async findById(id: string) {
    return prisma.transaction.findUnique({
      where: { id },
      include: {
        match: {
          include: {
            sellIntent: {
              include: {
                crop: true,
                farmer: { include: { user: true, district: true } },
              },
            },
            buyerRequirement: {
              include: {
                crop: true,
                buyer: { include: { user: true } },
              },
            },
          },
        },
        history: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async findByMatchId(matchId: string) {
    return prisma.transaction.findUnique({
      where: { matchId },
    });
  }

  async listTransactions(filters: {
    status?: TransactionStatus;
    buyerId?: string;
    farmerId?: string;
    fpoId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;

    const where: any = {
      deletedAt: null,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.buyerId) {
      where.match = {
        buyerRequirement: {
          buyer: {
            OR: [{ id: filters.buyerId }, { userId: filters.buyerId }],
          },
        },
      };
    }

    if (filters.farmerId) {
      where.match = {
        sellIntent: {
          farmer: {
            OR: [{ id: filters.farmerId }, { userId: filters.farmerId }],
          },
        },
      };
    }

    if (filters.fpoId) {
      where.match = {
        sellIntent: {
          farmer: {
            fpoMemberships: {
              some: {
                fpo: {
                  OR: [{ id: filters.fpoId }, { userId: filters.fpoId }],
                },
              },
            },
          },
        },
      };
    }

    if (filters.search) {
      where.OR = [
        { match: { sellIntent: { farmer: { fullName: { contains: filters.search, mode: 'insensitive' } } } } },
        { match: { buyerRequirement: { buyer: { companyName: { contains: filters.search, mode: 'insensitive' } } } } },
        { match: { sellIntent: { crop: { name: { contains: filters.search, mode: 'insensitive' } } } } },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        include: {
          match: {
            include: {
              sellIntent: {
                include: {
                  crop: true,
                  farmer: { include: { user: true, district: true } },
                },
              },
              buyerRequirement: {
                include: {
                  crop: true,
                  buyer: { include: { user: true } },
                },
              },
            },
          },
          history: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { total, data };
  }

  async getRecentTransactions(limit = 10) {
    return prisma.transaction.findMany({
      where: { deletedAt: null },
      include: {
        match: {
          include: {
            sellIntent: {
              include: {
                crop: true,
                farmer: { include: { district: true } },
              },
            },
            buyerRequirement: {
              include: {
                buyer: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const transactionsRepository = new TransactionsRepository();

import { prisma } from '../../infra/prisma.js';

export class FarmersRepository {
  async listAll(districtId?: string, search?: string, page = 1, pageSize = 20) {
    const where: any = {};
    if (districtId) {
      where.districtId = districtId;
    }
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { user: { phone: { contains: search } } },
        { village: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.farmerProfile.count({ where }),
      prisma.farmerProfile.findMany({
        where,
        include: {
          user: true,
          district: true,
          fpoMemberships: { include: { fpo: true } },
          _count: {
            select: { advisories: true, sellIntents: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { total, data };
  }

  async findById(id: string) {
    return prisma.farmerProfile.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
      include: {
        user: true,
        district: true,
        fpoMemberships: { include: { fpo: true } },
        sellIntents: { include: { crop: true }, orderBy: { createdAt: 'desc' } },
        advisories: { include: { crop: true }, orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
  }

  async getAdvisories(farmerId: string) {
    return prisma.advisory.findMany({
      where: {
        OR: [{ farmerId }, { farmer: { userId: farmerId } }],
      },
      include: { crop: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSellIntents(farmerId: string) {
    return prisma.sellIntent.findMany({
      where: {
        OR: [{ farmerId }, { farmer: { userId: farmerId } }],
      },
      include: {
        crop: true,
        matches: {
          include: {
            buyerRequirement: { include: { buyer: true } },
            transaction: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSellIntent(data: {
    farmerId: string;
    cropId: string;
    quantityKg: number;
    expectedPrice?: number;
    harvestDate?: Date;
  }) {
    return prisma.sellIntent.create({
      data: {
        farmerId: data.farmerId,
        cropId: data.cropId,
        quantityKg: data.quantityKg,
        expectedPrice: data.expectedPrice,
        harvestDate: data.harvestDate,
        status: 'OPEN',
      },
      include: { crop: true, farmer: true },
    });
  }
}

export const farmersRepository = new FarmersRepository();

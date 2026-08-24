import { prisma } from '../../infra/prisma.js';

export class BuyersRepository {
  async listAllBuyers(search?: string, page = 1, pageSize = 20) {
    const where: any = {};
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { buyerType: { contains: search, mode: 'insensitive' } },
        { user: { phone: { contains: search } } },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.buyer.count({ where }),
      prisma.buyer.findMany({
        where,
        include: {
          user: true,
          requirements: {
            where: { deletedAt: null },
            include: { crop: true },
          },
          _count: {
            select: { requirements: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { total, data };
  }

  async findBuyerByUserId(userId: string) {
    return prisma.buyer.findUnique({
      where: { userId },
      include: { user: true },
    });
  }

  async findBuyerById(id: string) {
    return prisma.buyer.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
      include: { user: true, requirements: { include: { crop: true } } },
    });
  }

  async createRequirement(data: {
    buyerId: string;
    cropId: string;
    quantityKg: number;
    maxPrice?: number;
    minQuality?: string;
    districtId?: string;
    radiusKm?: number;
  }) {
    return prisma.buyerRequirement.create({
      data: {
        buyerId: data.buyerId,
        cropId: data.cropId,
        quantityKg: data.quantityKg,
        maxPrice: data.maxPrice,
        minQuality: data.minQuality,
        districtId: data.districtId,
        radiusKm: data.radiusKm,
        isActive: true,
      },
      include: { crop: true, buyer: true },
    });
  }

  async listRequirements(buyerId?: string, cropId?: string, isActive?: boolean) {
    return prisma.buyerRequirement.findMany({
      where: {
        buyerId: buyerId || undefined,
        cropId: cropId || undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        deletedAt: null,
      },
      include: {
        crop: true,
        buyer: { include: { user: true } },
        _count: { select: { matches: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findRequirementById(id: string) {
    return prisma.buyerRequirement.findUnique({
      where: { id },
      include: { crop: true, buyer: true },
    });
  }

  async updateRequirement(
    id: string,
    data: {
      quantityKg?: number;
      maxPrice?: number;
      minQuality?: string;
      districtId?: string;
      radiusKm?: number;
      isActive?: boolean;
    }
  ) {
    return prisma.buyerRequirement.update({
      where: { id },
      data,
      include: { crop: true, buyer: true },
    });
  }

  async softDeleteRequirement(id: string) {
    return prisma.buyerRequirement.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}

export const buyersRepository = new BuyersRepository();

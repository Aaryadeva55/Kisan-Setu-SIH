import { prisma } from '../../infra/prisma.js';

export class FPORepository {
  async listAll(search?: string, page = 1, pageSize = 20) {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { regNumber: { contains: search } },
        { user: { phone: { contains: search } } },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.fPO.count({ where }),
      prisma.fPO.findMany({
        where,
        include: {
          user: true,
          memberships: {
            include: {
              farmer: {
                include: {
                  district: true,
                  sellIntents: { where: { status: 'OPEN' } },
                },
              },
            },
          },
          _count: { select: { memberships: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { total, data };
  }

  async findById(id: string) {
    return prisma.fPO.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
      include: {
        user: true,
        memberships: {
          include: {
            farmer: {
              include: {
                user: true,
                district: true,
                sellIntents: { include: { crop: true } },
                advisories: { include: { crop: true }, take: 1, orderBy: { createdAt: 'desc' } },
              },
            },
          },
        },
      },
    });
  }

  async getMemberFarmers(fpoId: string) {
    const memberships = await prisma.fPOMembership.findMany({
      where: {
        OR: [{ fpoId }, { fpo: { userId: fpoId } }],
      },
      include: {
        farmer: {
          include: {
            user: true,
            district: true,
            sellIntents: { include: { crop: true } },
            advisories: { include: { crop: true }, take: 1, orderBy: { createdAt: 'desc' } },
          },
        },
      },
    });

    return memberships.map((m) => m.farmer);
  }

  async getDemandForFPO(fpoId: string) {
    const fpo = await this.findById(fpoId);
    if (!fpo) return [];

    // Find crops grown by member farmers
    const memberCropIds = fpo.memberships.flatMap((m) =>
      m.farmer.sellIntents.map((s) => s.cropId)
    );

    return prisma.buyerRequirement.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        cropId: memberCropIds.length > 0 ? { in: memberCropIds } : undefined,
      },
      include: {
        crop: true,
        buyer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const fpoRepository = new FPORepository();

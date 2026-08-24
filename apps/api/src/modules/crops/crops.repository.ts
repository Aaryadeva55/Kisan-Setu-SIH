import { prisma } from '../../infra/prisma.js';

export class CropsRepository {
  async listAll(category?: string) {
    return prisma.crop.findMany({
      where: category ? { category: { equals: category, mode: 'insensitive' } } : undefined,
      include: {
        seasons: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return prisma.crop.findUnique({
      where: { id },
      include: { seasons: true },
    });
  }

  async findByName(name: string) {
    return prisma.crop.findUnique({
      where: { name },
      include: { seasons: true },
    });
  }

  async getSeasonsForCrop(cropId: string) {
    return prisma.cropSeason.findMany({
      where: { cropId },
    });
  }
}

export const cropsRepository = new CropsRepository();

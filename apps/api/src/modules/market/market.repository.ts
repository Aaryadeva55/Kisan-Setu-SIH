import { prisma } from '../../infra/prisma.js';

export class MarketRepository {
  async getLatestPrice(cropId: string, districtId?: string, mandiId?: string) {
    return prisma.mandiPrice.findFirst({
      where: {
        cropId,
        mandiId: mandiId || undefined,
        mandi: districtId ? { districtId } : undefined,
      },
      orderBy: { priceDate: 'desc' },
      include: {
        mandi: { include: { district: true } },
        crop: true,
      },
    });
  }

  async getPriceHistory(cropId: string, mandiId?: string, districtId?: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return prisma.mandiPrice.findMany({
      where: {
        cropId,
        mandiId: mandiId || undefined,
        mandi: districtId ? { districtId } : undefined,
        priceDate: { gte: since },
      },
      orderBy: { priceDate: 'asc' },
      include: {
        mandi: { include: { district: true } },
        crop: true,
      },
    });
  }

  async listMandisByDistrict(districtId: string) {
    return prisma.mandi.findMany({
      where: { districtId },
      include: { district: true },
    });
  }
}

export const marketRepository = new MarketRepository();

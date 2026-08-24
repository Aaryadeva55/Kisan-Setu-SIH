import { prisma } from '../../infra/prisma.js';

export class RecommendationRepository {
  async getFarmerProfile(farmerId: string) {
    return prisma.farmerProfile.findFirst({
      where: {
        OR: [
          { id: farmerId },
          { userId: farmerId },
        ],
      },
      include: {
        district: true,
        user: true,
      },
    });
  }

  async getDistrictRainfallLast30d(districtId: string): Promise<number> {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const records = await prisma.weatherData.findMany({
      where: {
        districtId,
        forecast: false,
        date: { gte: since },
      },
      select: { rainfallMm: true },
    });

    return records.reduce((sum, r) => sum + (r.rainfallMm || 0), 0);
  }

  async getOpenSellIntentsCount(cropId: string, districtId: string): Promise<number> {
    return prisma.sellIntent.count({
      where: {
        cropId,
        status: 'OPEN',
        farmer: {
          districtId,
        },
      },
    });
  }

  async saveAdvisory(data: {
    farmerId: string;
    cropId: string;
    suitabilityScore: number;
    reason: string;
    ruleTrace: any;
  }) {
    return prisma.advisory.create({
      data: {
        farmerId: data.farmerId,
        cropId: data.cropId,
        suitabilityScore: data.suitabilityScore,
        reason: data.reason,
        ruleTrace: data.ruleTrace,
      },
      include: {
        crop: true,
      },
    });
  }

  async getLatestAdvisories(farmerId: string, limit = 5) {
    return prisma.advisory.findMany({
      where: {
        OR: [{ farmerId }, { farmer: { userId: farmerId } }],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        crop: true,
      },
    });
  }
}

export const recommendationRepository = new RecommendationRepository();

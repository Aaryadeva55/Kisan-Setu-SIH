import { prisma } from '../../infra/prisma.js';

export class WeatherRepository {
  async getLatestObserved(districtId: string) {
    return prisma.weatherData.findFirst({
      where: {
        districtId,
        forecast: false,
      },
      orderBy: { date: 'desc' },
      include: { district: true },
    });
  }

  async getUpcomingForecast(districtId: string, days = 5) {
    const now = new Date();
    return prisma.weatherData.findMany({
      where: {
        districtId,
        forecast: true,
        date: { gte: now },
      },
      orderBy: { date: 'asc' },
      take: days,
    });
  }

  async getHistory(districtId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return prisma.weatherData.findMany({
      where: {
        districtId,
        forecast: false,
        date: { gte: since },
      },
      orderBy: { date: 'asc' },
    });
  }

  async getDistrictByIdOrName(identifier: string) {
    return prisma.district.findFirst({
      where: {
        OR: [
          { id: identifier },
          { name: { equals: identifier, mode: 'insensitive' } },
        ],
      },
    });
  }
}

export const weatherRepository = new WeatherRepository();

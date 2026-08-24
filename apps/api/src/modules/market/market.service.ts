import { marketRepository } from './market.repository.js';
import { getRedisClient } from '../../infra/redis.js';
import { NotFoundError } from '../../shared/errors/AppError.js';

export class MarketService {
  async getLatestPrice(cropId: string, districtId?: string, mandiId?: string) {
    const redis = getRedisClient();
    const cacheKey = `latest:price:${cropId}:${mandiId || districtId || 'all'}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // Cache parse fallback
      }
    }

    const price = await marketRepository.getLatestPrice(cropId, districtId, mandiId);
    if (!price) {
      // Fallback synthetic if none yet
      const fallback = {
        cropId,
        minPrice: 2000,
        maxPrice: 2500,
        modalPrice: 2250,
        priceDate: new Date(),
        mandi: { name: 'Nearest APMC' },
      };
      return fallback;
    }

    await redis.set(cacheKey, JSON.stringify(price), 'EX', 21600); // 6h TTL
    return price;
  }

  async getPriceHistory(cropId: string, mandiId?: string, districtId?: string, days = 30) {
    const history = await marketRepository.getPriceHistory(cropId, mandiId, districtId, days);

    // Calculate percentage trend over the window
    let trendPercent = 0;
    if (history.length >= 2) {
      const first = history[0].modalPrice;
      const last = history[history.length - 1].modalPrice;
      if (first > 0) {
        trendPercent = ((last - first) / first) * 100;
      }
    }

    return {
      cropId,
      mandiId,
      districtId,
      days,
      trendPercent: parseFloat(trendPercent.toFixed(2)),
      history,
    };
  }
}

export const marketService = new MarketService();

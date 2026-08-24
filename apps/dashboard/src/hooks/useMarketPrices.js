import { useQuery } from '@tanstack/react-query';
import { marketApi } from '../api/market.api';

export function useLatestMarketPrices() {
  return useQuery({
    queryKey: ['market-prices-latest'],
    queryFn: () => marketApi.getLatestPrices(),
  });
}

export function useMarketPriceHistory(cropId, mandiId) {
  return useQuery({
    queryKey: ['market-price-history', cropId, mandiId],
    queryFn: () => marketApi.getPriceHistory(cropId, mandiId),
  });
}

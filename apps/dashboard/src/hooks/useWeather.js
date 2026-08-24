import { useQuery } from '@tanstack/react-query';
import { weatherApi } from '../api/weather.api';

export function useWeather(districtId = 'dist_nsk') {
  return useQuery({
    queryKey: ['weather', districtId],
    queryFn: () => weatherApi.getLatest(districtId),
  });
}

export function useWeatherHistory(districtId = 'dist_nsk') {
  return useQuery({
    queryKey: ['weather-history', districtId],
    queryFn: () => weatherApi.getHistory(districtId),
  });
}

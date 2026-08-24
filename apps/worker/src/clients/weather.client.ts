import { config } from '@kisan-setu/config';
import pino from 'pino';

const logger = pino({ name: 'worker-weather-client' });

export interface RawWeatherDataRecord {
  districtName: string;
  date: Date;
  tempMinC: number;
  tempMaxC: number;
  rainfallMm: number;
  humidity: number;
  forecast: boolean;
}

export class WeatherApiClient {
  async fetchDistrictWeather(districtName: string): Promise<RawWeatherDataRecord[]> {
    if (config.DEMO_MODE || config.WEATHER_API_KEY === 'replace_me' || config.WEATHER_API_KEY === 'demo_weather_api_key') {
      const now = new Date();
      const records: RawWeatherDataRecord[] = [
        {
          districtName,
          date: now,
          tempMinC: 22.4,
          tempMaxC: 33.1,
          rainfallMm: 45.2,
          humidity: 68,
          forecast: false,
        },
      ];

      for (let i = 1; i <= 3; i++) {
        const forecastDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
        records.push({
          districtName,
          date: forecastDate,
          tempMinC: 21.5 + i * 0.5,
          tempMaxC: 32.0 + i * 0.8,
          rainfallMm: Math.max(0, 15.0 - i * 4),
          humidity: 65 - i * 3,
          forecast: true,
        });
      }

      return records;
    }

    try {
      const url = `${config.WEATHER_API_BASE_URL}/forecast?district=${encodeURIComponent(districtName)}&key=${config.WEATHER_API_KEY}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Weather API HTTP error: ${res.status}`);
      }
      const data = (await res.json()) as any;
      return (data.daily || []).map((item: any) => ({
        districtName,
        date: new Date(item.date),
        tempMinC: item.temp_min,
        tempMaxC: item.temp_max,
        rainfallMm: item.rainfall,
        humidity: item.humidity,
        forecast: Boolean(item.is_forecast),
      }));
    } catch (err) {
      logger.error({ err, districtName }, 'Weather API request failed');
      throw err;
    }
  }
}

export const weatherApiClient = new WeatherApiClient();

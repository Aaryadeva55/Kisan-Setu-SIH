import { config } from '../../config/env.js';
import { logger } from '../../shared/logger/pino.js';

export interface RawMandiPriceRecord {
  id: string;
  state: string;
  district: string;
  mandiName: string;
  cropName: string;
  min: number;
  max: number;
  modal: number;
  date: Date;
}

export class MandiApiClient {
  async fetchLatest(): Promise<RawMandiPriceRecord[]> {
    if (config.DEMO_MODE || config.MANDI_API_KEY === 'replace_me' || config.MANDI_API_KEY === 'demo_mandi_api_key') {
      logger.info('DEMO_MODE: Returning synthetic resilient Mandi price records');
      return [
        {
          id: `gov_mandi_${Date.now()}_1`,
          state: 'Maharashtra',
          district: 'Nashik',
          mandiName: 'Lasalgaon',
          cropName: 'Onion',
          min: 1600,
          max: 2400,
          modal: 2100,
          date: new Date(),
        },
        {
          id: `gov_mandi_${Date.now()}_2`,
          state: 'Maharashtra',
          district: 'Nashik',
          mandiName: 'Pimpalgaon',
          cropName: 'Tomato',
          min: 1200,
          max: 1900,
          modal: 1600,
          date: new Date(),
        },
        {
          id: `gov_mandi_${Date.now()}_3`,
          state: 'Maharashtra',
          district: 'Pune',
          mandiName: 'Pune APMC',
          cropName: 'Soybean',
          min: 4200,
          max: 4850,
          modal: 4600,
          date: new Date(),
        },
      ];
    }

    try {
      const url = `${config.MANDI_API_BASE_URL}?api-key=${config.MANDI_API_KEY}&format=json&limit=50`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Mandi API HTTP error: ${res.status}`);
      }
      const data = (await res.json()) as any;
      const records: RawMandiPriceRecord[] = (data.records || []).map((r: any) => ({
        id: r.id || `mandi_${r.market}_${r.commodity}_${r.arrival_date}`,
        state: r.state || 'Maharashtra',
        district: r.district || 'Nashik',
        mandiName: r.market || 'Nashik APMC',
        cropName: r.commodity || 'Soybean',
        min: parseFloat(r.min_price || '0'),
        max: parseFloat(r.max_price || '0'),
        modal: parseFloat(r.modal_price || '0'),
        date: new Date(r.arrival_date || Date.now()),
      }));
      return records;
    } catch (err) {
      logger.error({ err }, 'Mandi API request failed');
      throw err;
    }
  }
}

export const mandiApiClient = new MandiApiClient();

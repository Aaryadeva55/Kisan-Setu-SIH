"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mandiApiClient = exports.MandiApiClient = void 0;
const env_js_1 = require("../../config/env.js");
const pino_js_1 = require("../../shared/logger/pino.js");
class MandiApiClient {
    async fetchLatest() {
        if (env_js_1.config.DEMO_MODE || env_js_1.config.MANDI_API_KEY === 'replace_me' || env_js_1.config.MANDI_API_KEY === 'demo_mandi_api_key') {
            pino_js_1.logger.info('DEMO_MODE: Returning synthetic resilient Mandi price records');
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
            const url = `${env_js_1.config.MANDI_API_BASE_URL}?api-key=${env_js_1.config.MANDI_API_KEY}&format=json&limit=50`;
            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`Mandi API HTTP error: ${res.status}`);
            }
            const data = (await res.json());
            const records = (data.records || []).map((r) => ({
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
        }
        catch (err) {
            pino_js_1.logger.error({ err }, 'Mandi API request failed');
            throw err;
        }
    }
}
exports.MandiApiClient = MandiApiClient;
exports.mandiApiClient = new MandiApiClient();
//# sourceMappingURL=mandi.client.js.map
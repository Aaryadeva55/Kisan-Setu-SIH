"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.weatherApiClient = exports.WeatherApiClient = void 0;
const env_js_1 = require("../../config/env.js");
const pino_js_1 = require("../../shared/logger/pino.js");
class WeatherApiClient {
    async fetchDistrictWeather(districtName) {
        if (env_js_1.config.DEMO_MODE || env_js_1.config.WEATHER_API_KEY === 'replace_me' || env_js_1.config.WEATHER_API_KEY === 'demo_weather_api_key') {
            pino_js_1.logger.info({ districtName }, 'DEMO_MODE: Returning synthetic resilient Weather data');
            const now = new Date();
            const records = [];
            // Current observed
            records.push({
                districtName,
                date: now,
                tempMinC: 22.4,
                tempMaxC: 33.1,
                rainfallMm: 45.2,
                humidity: 68,
                forecast: false,
            });
            // Next 3 days forecast
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
            const url = `${env_js_1.config.WEATHER_API_BASE_URL}/forecast?district=${encodeURIComponent(districtName)}&key=${env_js_1.config.WEATHER_API_KEY}`;
            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`Weather API HTTP error: ${res.status}`);
            }
            const data = (await res.json());
            return (data.daily || []).map((item) => ({
                districtName,
                date: new Date(item.date),
                tempMinC: item.temp_min,
                tempMaxC: item.temp_max,
                rainfallMm: item.rainfall,
                humidity: item.humidity,
                forecast: Boolean(item.is_forecast),
            }));
        }
        catch (err) {
            pino_js_1.logger.error({ err, districtName }, 'Weather API request failed');
            throw err;
        }
    }
}
exports.WeatherApiClient = WeatherApiClient;
exports.weatherApiClient = new WeatherApiClient();
//# sourceMappingURL=weather.client.js.map
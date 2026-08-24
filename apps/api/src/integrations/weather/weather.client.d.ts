export interface RawWeatherDataRecord {
    districtName: string;
    date: Date;
    tempMinC: number;
    tempMaxC: number;
    rainfallMm: number;
    humidity: number;
    forecast: boolean;
}
export declare class WeatherApiClient {
    fetchDistrictWeather(districtName: string): Promise<RawWeatherDataRecord[]>;
}
export declare const weatherApiClient: WeatherApiClient;
//# sourceMappingURL=weather.client.d.ts.map
import { Request, Response, NextFunction } from 'express';
import { weatherService } from './weather.service.js';

export class WeatherController {
  async getLatest(req: Request, res: Response, next: NextFunction) {
    try {
      const { districtId } = req.params;
      const weather = await weatherService.getLatestWeather(districtId);
      return res.status(200).json(weather);
    } catch (err) {
      next(err);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { districtId } = req.params;
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
      const history = await weatherService.getWeatherHistory(districtId, days);
      return res.status(200).json(history);
    } catch (err) {
      next(err);
    }
  }
}

export const weatherController = new WeatherController();

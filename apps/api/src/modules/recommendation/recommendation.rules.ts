import { RuleResult } from '@kisan-setu/types';

export interface RuleEvaluationContext {
  farmer: {
    id: string;
    districtId: string;
    landSizeAcres?: number | null;
  };
  crop: {
    id: string;
    name: string;
    waterReq?: string | null;
    seasons?: Array<{
      season: string;
      sowStart: number;
      sowEnd: number;
      harvestStart: number;
      harvestEnd: number;
    }>;
  };
  weather: {
    rainfallLast30dMm: number;
    tempMaxC?: number;
    tempMinC?: number;
  };
  market: {
    priceTrendPercent30d: number;
    latestModalPrice?: number;
  };
  districtOversupplyCount: number;
}

export interface RecommendationRule {
  id: string;
  name: string;
  evaluate: (ctx: RuleEvaluationContext) => RuleResult;
}

export const RULES: RecommendationRule[] = [
  {
    id: 'low_rainfall_high_water_crop',
    name: 'Rainfall vs Crop Water Requirement',
    evaluate: (ctx) => {
      const isHighWater = ctx.crop.waterReq?.toUpperCase() === 'HIGH';
      const isLowRainfall = ctx.weather.rainfallLast30dMm < 50;

      if (isHighWater && isLowRainfall) {
        return {
          ruleId: 'low_rainfall_high_water_crop',
          ruleName: 'Low Rainfall with High Water Requirement',
          applies: true,
          delta: -25,
          reasonText: `Recent rainfall in your area is low (${ctx.weather.rainfallLast30dMm.toFixed(1)}mm), and ${ctx.crop.name} typically needs high water supply.`,
        };
      }

      if (!isHighWater && isLowRainfall) {
        return {
          ruleId: 'low_rainfall_low_water_crop',
          ruleName: 'Low Rainfall Suitable Crop',
          applies: true,
          delta: 15,
          reasonText: `${ctx.crop.name} has moderate/low water requirements, suitable for current rainfall levels.`,
        };
      }

      return {
        ruleId: 'low_rainfall_high_water_crop',
        ruleName: 'Water Requirement Evaluation',
        applies: false,
        delta: 0,
        reasonText: '',
      };
    },
  },
  {
    id: 'season_match',
    name: 'Sowing Window Match',
    evaluate: (ctx) => {
      const currentMonth = new Date().getMonth() + 1; // 1-12
      const matchedSeason = ctx.crop.seasons?.find((s) => {
        if (s.sowStart <= s.sowEnd) {
          return currentMonth >= s.sowStart && currentMonth <= s.sowEnd;
        }
        // Rollover year window (e.g. Nov-Feb)
        return currentMonth >= s.sowStart || currentMonth <= s.sowEnd;
      });

      if (matchedSeason) {
        return {
          ruleId: 'season_match',
          ruleName: 'Optimal Sowing Window',
          applies: true,
          delta: 20,
          reasonText: `This is the optimal sowing window (${matchedSeason.season}) for ${ctx.crop.name} in your region.`,
          metadata: { season: matchedSeason.season },
        };
      }

      return {
        ruleId: 'season_match',
        ruleName: 'Off-Season Sowing',
        applies: true,
        delta: -15,
        reasonText: `Current month is outside the ideal sowing window for ${ctx.crop.name}.`,
      };
    },
  },
  {
    id: 'rising_price_trend',
    name: 'Market Price Trend Signal',
    evaluate: (ctx) => {
      const trend = ctx.market.priceTrendPercent30d;
      if (trend > 5) {
        return {
          ruleId: 'rising_price_trend',
          ruleName: 'Rising Mandi Price Trend',
          applies: true,
          delta: 15,
          reasonText: `${ctx.crop.name} prices in your nearest mandi have been trending upward (+${trend.toFixed(1)}%).`,
          metadata: { trendPercent: trend },
        };
      } else if (trend < -10) {
        return {
          ruleId: 'falling_price_trend',
          ruleName: 'Falling Mandi Price Trend',
          applies: true,
          delta: -10,
          reasonText: `${ctx.crop.name} market prices have recently declined (${trend.toFixed(1)}%).`,
          metadata: { trendPercent: trend },
        };
      }

      return {
        ruleId: 'rising_price_trend',
        ruleName: 'Stable Market Price',
        applies: true,
        delta: 5,
        reasonText: `${ctx.crop.name} market prices have remained stable in recent weeks.`,
      };
    },
  },
  {
    id: 'oversupply_signal',
    name: 'Local District Oversupply Signal',
    evaluate: (ctx) => {
      if (ctx.districtOversupplyCount >= 5) {
        return {
          ruleId: 'oversupply_signal',
          ruleName: 'High Local Sowing Saturation',
          applies: true,
          delta: -10,
          reasonText: `Several farmers nearby (${ctx.districtOversupplyCount}) are already growing ${ctx.crop.name}, which may increase local supply at harvest.`,
          metadata: { localSellersCount: ctx.districtOversupplyCount },
        };
      }

      return {
        ruleId: 'oversupply_signal',
        ruleName: 'Balanced Local Supply',
        applies: false,
        delta: 0,
        reasonText: '',
      };
    },
  },
];

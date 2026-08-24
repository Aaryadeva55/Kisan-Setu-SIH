"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeLocationScore = computeLocationScore;
exports.computeQuantityScore = computeQuantityScore;
exports.computePriceScore = computePriceScore;
exports.computeTimingScore = computeTimingScore;
exports.scoreMatchPair = scoreMatchPair;
const shared_1 = require("@kisan-setu/shared");
function computeLocationScore(farmerDistrictId, buyerDistrictId, radiusKm, farmerCoords, mandiCoords) {
    if (!buyerDistrictId && !radiusKm) {
        return 0.8; // State-level open matching
    }
    if (buyerDistrictId && farmerDistrictId === buyerDistrictId) {
        return 1.0; // Same district is 100%
    }
    if (radiusKm && farmerCoords?.lat && mandiCoords?.lat) {
        const dist = (0, shared_1.calculateDistanceKm)(farmerCoords.lat, farmerCoords.lng, mandiCoords.lat, mandiCoords.lng);
        if (dist != null) {
            if (dist <= radiusKm) {
                return (0, shared_1.clamp)(1 - dist / (radiusKm * 1.5), 0.3, 1.0);
            }
            return 0.2; // Outside requested radius
        }
    }
    // Neighboring district default
    return 0.6;
}
function computeQuantityScore(intentKg, reqKg) {
    if (reqKg <= 0)
        return 0.5;
    const diffRatio = Math.abs(intentKg - reqKg) / reqKg;
    return (0, shared_1.clamp)(1 - diffRatio, 0.1, 1.0);
}
function computePriceScore(expectedPrice, maxPrice) {
    if (!maxPrice || !expectedPrice) {
        return 0.6; // Neutral acceptable score
    }
    if (expectedPrice <= maxPrice) {
        return 1.0;
    }
    const excessRatio = (expectedPrice - maxPrice) / maxPrice;
    return (0, shared_1.clamp)(1 - excessRatio * 2, 0.0, 1.0);
}
function computeTimingScore(harvestDate, neededByDate) {
    if (!harvestDate || !neededByDate) {
        return 0.7;
    }
    const diffDays = Math.abs((new Date(neededByDate).getTime() - new Date(harvestDate).getTime()) / (1000 * 3600 * 24));
    if (diffDays <= 7)
        return 1.0;
    if (diffDays <= 21)
        return 0.8;
    if (diffDays <= 45)
        return 0.5;
    return 0.2;
}
function scoreMatchPair(intent, req) {
    if (intent.cropId !== req.cropId) {
        return {
            score: 0,
            breakdown: {
                locationScore: 0,
                quantityScore: 0,
                priceScore: 0,
                qualityScore: 0,
                timingScore: 0,
                baseScore: 0,
            },
        };
    }
    const farmerDistrictId = intent.farmer?.districtId || intent.districtId;
    const locationScore = computeLocationScore(farmerDistrictId, req.districtId, req.radiusKm, { lat: intent.farmer?.latitude, lng: intent.farmer?.longitude });
    const quantityScore = computeQuantityScore(intent.quantityKg, req.quantityKg);
    const priceScore = computePriceScore(intent.expectedPrice, req.maxPrice);
    const qualityScore = req.minQuality ? 0.9 : 1.0;
    const timingScore = computeTimingScore(intent.harvestDate, req.neededByDate);
    const baseScore = 1.0;
    // Weighted composition (from Section 15 of backend.md)
    const compositeScore = 0.20 * locationScore +
        0.15 * quantityScore +
        0.15 * priceScore +
        0.10 * qualityScore +
        0.10 * timingScore +
        0.30 * baseScore;
    const finalScore = parseFloat((0, shared_1.clamp)(compositeScore, 0, 1).toFixed(2));
    return {
        score: finalScore,
        breakdown: {
            locationScore: parseFloat(locationScore.toFixed(2)),
            quantityScore: parseFloat(quantityScore.toFixed(2)),
            priceScore: parseFloat(priceScore.toFixed(2)),
            qualityScore: parseFloat(qualityScore.toFixed(2)),
            timingScore: parseFloat(timingScore.toFixed(2)),
            baseScore: 1.0,
        },
    };
}
//# sourceMappingURL=matching.calculator.js.map
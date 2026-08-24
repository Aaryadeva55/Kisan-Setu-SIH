"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchingService = exports.MatchingService = void 0;
const matching_repository_js_1 = require("./matching.repository.js");
const matching_calculator_js_1 = require("./matching.calculator.js");
const AppError_js_1 = require("../../shared/errors/AppError.js");
const pino_js_1 = require("../../shared/logger/pino.js");
class MatchingService {
    async computeMatchScore(intent, requirement) {
        return (0, matching_calculator_js_1.scoreMatchPair)(intent, requirement);
    }
    async runMatchingForSellIntent(sellIntentId) {
        const intent = await matching_repository_js_1.matchingRepository.getSellIntentById(sellIntentId);
        if (!intent) {
            throw new AppError_js_1.NotFoundError('SellIntent');
        }
        const requirements = await matching_repository_js_1.matchingRepository.findMatchingRequirementsForIntent(intent.cropId);
        const matches = [];
        for (const req of requirements) {
            const matchResult = (0, matching_calculator_js_1.scoreMatchPair)(intent, req);
            if (matchResult.score >= 0.4) {
                const match = await matching_repository_js_1.matchingRepository.upsertMatch({
                    sellIntentId: intent.id,
                    buyerRequirementId: req.id,
                    score: matchResult.score,
                    scoreBreakdown: matchResult.breakdown,
                });
                matches.push(match);
            }
        }
        pino_js_1.logger.info({ sellIntentId, candidatesGenerated: matches.length }, 'Matching scan completed for SellIntent');
        return matches;
    }
    async runMatchingForRequirement(requirementId) {
        const req = await matching_repository_js_1.matchingRepository.getBuyerRequirementById(requirementId);
        if (!req) {
            throw new AppError_js_1.NotFoundError('BuyerRequirement');
        }
        const intents = await matching_repository_js_1.matchingRepository.findMatchingIntentsForRequirement(req.cropId);
        const matches = [];
        for (const intent of intents) {
            const matchResult = (0, matching_calculator_js_1.scoreMatchPair)(intent, req);
            if (matchResult.score >= 0.4) {
                const match = await matching_repository_js_1.matchingRepository.upsertMatch({
                    sellIntentId: intent.id,
                    buyerRequirementId: req.id,
                    score: matchResult.score,
                    scoreBreakdown: matchResult.breakdown,
                });
                matches.push(match);
            }
        }
        pino_js_1.logger.info({ requirementId, candidatesGenerated: matches.length }, 'Matching scan completed for BuyerRequirement');
        return matches;
    }
    async getCandidates(sellIntentId) {
        return matching_repository_js_1.matchingRepository.getCandidatesForSellIntent(sellIntentId, 0.4);
    }
}
exports.MatchingService = MatchingService;
exports.matchingService = new MatchingService();
//# sourceMappingURL=matching.service.js.map
import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { clamp, calculateDistanceKm } from '@kisan-setu/shared';
import pino from 'pino';

const logger = pino({ name: 'matching-worker' });
const prisma = new PrismaClient();

function computeScore(intent: any, req: any) {
  if (intent.cropId !== req.cropId) return 0;
  const sameDistrict = intent.farmer?.districtId === req.districtId;
  const locScore = sameDistrict ? 1.0 : 0.6;
  const qtyDiff = Math.abs(intent.quantityKg - req.quantityKg) / req.quantityKg;
  const qtyScore = clamp(1 - qtyDiff, 0.1, 1.0);
  const priceScore = req.maxPrice ? clamp(1 - (intent.expectedPrice - req.maxPrice) / req.maxPrice, 0, 1) : 0.6;

  return 0.20 * locScore + 0.15 * qtyScore + 0.15 * priceScore + 0.10 * 1.0 + 0.10 * 0.8 + 0.30 * 1.0;
}

export async function matchingProcessor(job: Job) {
  const { sellIntentId, buyerRequirementId } = job.data;
  logger.info({ jobId: job.id, sellIntentId, buyerRequirementId }, 'Processing matching job');

  let generated = 0;

  if (sellIntentId) {
    const intent = await prisma.sellIntent.findUnique({
      where: { id: sellIntentId },
      include: { farmer: true },
    });
    if (intent) {
      const requirements = await prisma.buyerRequirement.findMany({
        where: { cropId: intent.cropId, isActive: true, deletedAt: null },
      });

      for (const req of requirements) {
        const score = computeScore(intent, req);
        if (score >= 0.4) {
          await prisma.match.upsert({
            where: {
              sellIntentId_buyerRequirementId: {
                sellIntentId: intent.id,
                buyerRequirementId: req.id,
              },
            },
            update: { score: parseFloat(score.toFixed(2)) },
            create: {
              sellIntentId: intent.id,
              buyerRequirementId: req.id,
              score: parseFloat(score.toFixed(2)),
              scoreBreakdown: { score },
            },
          });
          generated++;
        }
      }
    }
  }

  return { matchesGenerated: generated };
}

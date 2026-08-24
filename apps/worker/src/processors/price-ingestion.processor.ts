import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { mandiApiClient } from '../clients/mandi.client.js';
import { getRedisClient } from '../clients/redis.js';
import pino from 'pino';

const logger = pino({ name: 'price-ingestion' });
const prisma = new PrismaClient();

export async function priceIngestionProcessor(job: Job) {
  logger.info({ jobId: job.id }, 'Starting scheduled Mandi Price ingestion job');

  const jobLog = await prisma.dataIngestionJob.create({
    data: {
      jobType: 'PRICE_INGESTION',
      status: 'RUNNING',
      startedAt: new Date(),
    },
  });

  try {
    const records = await mandiApiClient.fetchLatest();
    let recordsOk = 0;
    const redis = getRedisClient();

    for (const record of records) {
      try {
        const district = await prisma.district.findFirst({
          where: { name: { equals: record.district, mode: 'insensitive' } },
        });
        if (!district) continue;

        let mandi = await prisma.mandi.findFirst({
          where: {
            name: { equals: record.mandiName, mode: 'insensitive' },
            districtId: district.id,
          },
        });

        if (!mandi) {
          mandi = await prisma.mandi.create({
            data: {
              name: record.mandiName,
              districtId: district.id,
            },
          });
        }

        let crop = await prisma.crop.findFirst({
          where: { name: { equals: record.cropName, mode: 'insensitive' } },
        });

        if (!crop) {
          crop = await prisma.crop.create({
            data: {
              name: record.cropName,
            },
          });
        }

        await prisma.mandiPrice.upsert({
          where: {
            mandiId_cropId_priceDate: {
              mandiId: mandi.id,
              cropId: crop.id,
              priceDate: record.date,
            },
          },
          update: {
            minPrice: record.min,
            maxPrice: record.max,
            modalPrice: record.modal,
          },
          create: {
            mandiId: mandi.id,
            cropId: crop.id,
            priceDate: record.date,
            minPrice: record.min,
            maxPrice: record.max,
            modalPrice: record.modal,
            sourceRef: record.id,
          },
        });

        await redis.set(
          `latest:price:${crop.id}:${mandi.id}`,
          JSON.stringify({
            minPrice: record.min,
            maxPrice: record.max,
            modalPrice: record.modal,
            priceDate: record.date,
            mandi: { name: mandi.name },
            crop: { name: crop.name },
          }),
          'EX',
          21600
        );

        recordsOk++;
      } catch (innerErr) {
        logger.warn({ record, err: innerErr }, 'Skipped invalid price record');
      }
    }

    await prisma.dataIngestionJob.update({
      where: { id: jobLog.id },
      data: {
        status: 'SUCCESS',
        recordsIn: records.length,
        recordsOk,
        finishedAt: new Date(),
      },
    });

    logger.info({ recordsIn: records.length, recordsOk }, 'Mandi Price ingestion completed successfully');
  } catch (err: any) {
    logger.error({ err: err.message }, 'Mandi Price ingestion job failed');
    await prisma.dataIngestionJob.update({
      where: { id: jobLog.id },
      data: {
        status: 'FAILED',
        error: String(err?.message || err),
        finishedAt: new Date(),
      },
    });
    throw err;
  }
}

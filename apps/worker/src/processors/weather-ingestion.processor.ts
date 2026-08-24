import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { weatherApiClient } from '../clients/weather.client.js';
import { getRedisClient } from '../clients/redis.js';
import pino from 'pino';

const logger = pino({ name: 'weather-ingestion' });
const prisma = new PrismaClient();

export async function weatherIngestionProcessor(job: Job) {
  logger.info({ jobId: job.id }, 'Starting scheduled Weather ingestion job');

  const jobLog = await prisma.dataIngestionJob.create({
    data: {
      jobType: 'WEATHER_INGESTION',
      status: 'RUNNING',
      startedAt: new Date(),
    },
  });

  try {
    const districts = await prisma.district.findMany();
    let recordsOk = 0;
    const redis = getRedisClient();

    for (const district of districts) {
      try {
        const weatherRecords = await weatherApiClient.fetchDistrictWeather(district.name);

        for (const w of weatherRecords) {
          await prisma.weatherData.upsert({
            where: {
              districtId_date_forecast: {
                districtId: district.id,
                date: w.date,
                forecast: w.forecast,
              },
            },
            update: {
              tempMinC: w.tempMinC,
              tempMaxC: w.tempMaxC,
              rainfallMm: w.rainfallMm,
              humidity: w.humidity,
            },
            create: {
              districtId: district.id,
              date: w.date,
              tempMinC: w.tempMinC,
              tempMaxC: w.tempMaxC,
              rainfallMm: w.rainfallMm,
              humidity: w.humidity,
              forecast: w.forecast,
            },
          });
          recordsOk++;
        }

        const latestObserved = weatherRecords.find((r) => !r.forecast);
        if (latestObserved) {
          await redis.set(
            `latest:weather:${district.id}`,
            JSON.stringify({
              district: { id: district.id, name: district.name },
              current: latestObserved,
              forecast: weatherRecords.filter((r) => r.forecast),
            }),
            'EX',
            21600
          );
        }
      } catch (innerErr) {
        logger.warn({ district: district.name, err: innerErr }, 'Skipping district weather error');
      }
    }

    await prisma.dataIngestionJob.update({
      where: { id: jobLog.id },
      data: {
        status: 'SUCCESS',
        recordsIn: districts.length * 4,
        recordsOk,
        finishedAt: new Date(),
      },
    });

    logger.info({ recordsOk }, 'Weather ingestion completed successfully');
  } catch (err: any) {
    logger.error({ err: err.message }, 'Weather ingestion job failed');
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

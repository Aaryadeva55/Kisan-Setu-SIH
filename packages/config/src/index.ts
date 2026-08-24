import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1).default('postgresql://user:password@localhost:5432/kisan_setu'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  
  JWT_ACCESS_SECRET: z.string().min(8).default('kisan_setu_jwt_access_super_secret_key_2026'),
  JWT_REFRESH_SECRET: z.string().min(8).default('kisan_setu_jwt_refresh_super_secret_key_2026'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  WHATSAPP_PHONE_NUMBER_ID: z.string().default('demo_phone_id'),
  WHATSAPP_ACCESS_TOKEN: z.string().default('demo_access_token'),
  WHATSAPP_APP_SECRET: z.string().default('demo_app_secret'),
  WHATSAPP_VERIFY_TOKEN: z.string().default('kisan_setu_webhook_verify_token_2026'),

  TWILIO_ACCOUNT_SID: z.string().default('demo_twilio_sid'),
  TWILIO_AUTH_TOKEN: z.string().default('demo_twilio_token'),
  TWILIO_PHONE_NUMBER: z.string().default('+919876543210'),

  WEATHER_API_KEY: z.string().default('demo_weather_api_key'),
  WEATHER_API_BASE_URL: z.string().default('https://api.example-imd.gov.in'),

  MANDI_API_KEY: z.string().default('demo_mandi_api_key'),
  MANDI_API_BASE_URL: z.string().default('https://api.data.gov.in/resource/xxxx'),

  CORS_ALLOWED_ORIGIN: z.string().default('http://localhost:5173,http://localhost:3000'),
  DEMO_MODE: z.coerce.boolean().default(true),
  SEED_DEMO_DATA: z.coerce.boolean().default(true),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function loadEnv(envInput: NodeJS.ProcessEnv = process.env): EnvConfig {
  const result = envSchema.safeParse(envInput);
  if (!result.success) {
    console.error('❌ Invalid environment configuration:', result.error.format());
    throw new Error('Environment variable validation failed');
  }
  return result.data;
}

export const config: EnvConfig = loadEnv();


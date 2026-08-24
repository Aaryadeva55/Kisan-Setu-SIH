import dotenv from 'dotenv';
import { loadEnv, EnvConfig } from '@kisan-setu/config';

dotenv.config();

export const config: EnvConfig = loadEnv(process.env);

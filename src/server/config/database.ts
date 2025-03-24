import * as dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string(),
});

export function getQBankUrl(): string {
  const config = envSchema.parse(process.env);
  return config.DATABASE_URL;
}
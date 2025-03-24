import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string(),
});

export function getQBankUrl(): string {
  const config = envSchema.parse(process.env);
  return config.DATABASE_URL;
}

// Add this to process.env for Prisma
process.env.DATABASE_URL = getQBankUrl();
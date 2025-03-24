import { z } from 'zod';

const dbConfigSchema = z.object({
  QBANK_DB_HOST: z.string(),
  QBANK_DB_USER: z.string(),
  QBANK_DB_PASSWORD: z.string(),
  QBANK_DB_NAME: z.string(),
  QBANK_DB_PORT: z.string().transform(Number).default('3306'),
});

export function getQBankUrl(): string {
  const config = dbConfigSchema.parse(process.env);
  return `mysql://${config.QBANK_DB_USER}:${config.QBANK_DB_PASSWORD}@${config.QBANK_DB_HOST}:${config.QBANK_DB_PORT}/${config.QBANK_DB_NAME}`;
}

// Add this to process.env for Prisma
process.env.QBANK_DB_URL = getQBankUrl();
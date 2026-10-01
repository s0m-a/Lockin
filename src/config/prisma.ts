import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function checkDatabaseConnection(): Promise<void> {
  await prisma.$connect();
  console.log('Prisma database connection OK');
}

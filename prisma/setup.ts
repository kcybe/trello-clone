import { PrismaClient } from '@prisma/client';

// Create a global Prisma client for testing
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const testPrisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = testPrisma;
}

export default testPrisma;
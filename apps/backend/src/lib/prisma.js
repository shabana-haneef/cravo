import { PrismaClient } from '@prisma/client';

// Shared Prisma instance to prevent multiple connection pools
const prisma = new PrismaClient();

export default prisma;

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const refreshTokens = await prisma.refreshToken.findMany({
      include: {
        user: {
          select: {
            email: true,
          }
        }
      }
    });
    console.log("REFRESH TOKENS:", JSON.stringify(refreshTokens, null, 2));
  } catch (err) {
    console.error("DB Query failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

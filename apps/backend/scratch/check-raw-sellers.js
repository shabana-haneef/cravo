import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const rawSellers = await prisma.$queryRawUnsafe('SELECT * FROM "Seller"');
    console.log("RAW SELLERS COUNT:", rawSellers.length);
    console.log("RAW SELLERS:", JSON.stringify(rawSellers, null, 2));

    const rawShops = await prisma.$queryRawUnsafe('SELECT * FROM "Shop"');
    console.log("RAW SHOPS COUNT:", rawShops.length);
    console.log("RAW SHOPS:", JSON.stringify(rawShops, null, 2));
  } catch (err) {
    console.error("Raw SQL Query failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

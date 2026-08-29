import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const sellers = await prisma.seller.findMany();
    console.log("SELLERS:", JSON.stringify(sellers, null, 2));

    const bankAccounts = await prisma.bankAccount.findMany();
    console.log("BANK ACCOUNTS:", JSON.stringify(bankAccounts, null, 2));

    const documents = await prisma.sellerDocument.findMany();
    console.log("DOCUMENTS:", JSON.stringify(documents, null, 2));

    const shops = await prisma.shop.findMany();
    console.log("SHOPS:", JSON.stringify(shops, null, 2));
  } catch (err) {
    console.error("DB Query failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

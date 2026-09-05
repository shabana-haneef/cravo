import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const docs = await prisma.sellerDocument.findMany({
    where: { type: 'FSSAI_LICENSE' },
    orderBy: { createdAt: 'desc' },
    take: 1
  });
  console.log(docs);
}

main().catch(console.error).finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Checking database...");
  const products = await prisma.product.findMany({
    where: {
      name: {
        contains: "Ord"
      }
    }
  });

  console.log("Found products containing 'Ord':", products.map(p => ({ id: p.id, name: p.name, status: p.status })));

  const categories = await prisma.category.findMany({
    where: {
      name: {
        contains: "Ord"
      }
    }
  });
  console.log("Found categories containing 'Ord':", categories.map(c => ({ id: c.id, name: c.name })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Set to false ONLY when you are 100% sure you want to delete the listed items
const DRY_RUN = true; 

async function main() {
  console.log(`--- Starting Cleanup (${DRY_RUN ? 'DRY RUN' : 'ACTUAL DELETION'}) ---`);

  // 1. Find all suspected test products
  const suspectedProducts = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: 'Ord ', mode: 'insensitive' } },
        { name: { endsWith: ' Ord', mode: 'insensitive' } },
        { name: 'Product 1 Ord' },
        { name: 'Product 2 Ord' }
      ]
    },
    select: { id: true, name: true }
  });

  console.log('\nSuspected Test Products Found:');
  suspectedProducts.forEach(p => console.log(`- ${p.name} (ID: ${p.id})`));

  // 2. Find all suspected test categories
  const suspectedCategories = await prisma.category.findMany({
    where: {
      OR: [
        { name: { contains: 'Ord ', mode: 'insensitive' } },
        { name: { endsWith: ' Ord', mode: 'insensitive' } },
        { name: 'Category Ord' }
      ]
    },
    select: { id: true, name: true }
  });

  console.log('\nSuspected Test Categories Found:');
  suspectedCategories.forEach(c => console.log(`- ${c.name} (ID: ${c.id})`));

  // 3. Execution Phase
  if (DRY_RUN) {
    console.log('\n⚠️ DRY RUN ENABLED. No data was actually deleted.');
    console.log('If this list looks completely correct and safe, change DRY_RUN = false in the script and run it again.');
  } else {
    // Actually delete the items we found
    const productIds = suspectedProducts.map(p => p.id);
    const categoryIds = suspectedCategories.map(c => c.id);

    if (productIds.length > 0) {
      await prisma.product.deleteMany({ where: { id: { in: productIds } } });
      console.log(`\n✅ Actually deleted ${productIds.length} products.`);
    }
    
    if (categoryIds.length > 0) {
      await prisma.category.deleteMany({ where: { id: { in: categoryIds } } });
      console.log(`✅ Actually deleted ${categoryIds.length} categories.`);
    }
  }

  console.log('\nDone.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

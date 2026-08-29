import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Searching for test products...");
  const products = await prisma.product.findMany({
    where: {
      name: {
        in: ["Product 1 Ord", "Product 2 Ord"]
      }
    }
  });

  console.log(`Found ${products.length} products to delete.`);

  for (const product of products) {
    console.log(`Deleting product: ${product.name} (${product.id})`);
    
    // Delete relations
    await prisma.cartItem.deleteMany({ where: { productId: product.id } });
    await prisma.wishlistItem.deleteMany({ where: { productId: product.id } });
    await prisma.orderItem.deleteMany({ where: { productId: product.id } });
    
    // Delete product (cascades to variants, images, inventory)
    await prisma.product.delete({ where: { id: product.id } });
  }

  console.log("Searching for test category 'Category Ord'...");
  const categories = await prisma.category.findMany({
    where: {
      name: "Category Ord"
    }
  });

  console.log(`Found ${categories.length} categories to delete.`);
  for (const category of categories) {
    console.log(`Deleting category: ${category.name} (${category.id})`);
    // Delete category
    await prisma.category.delete({ where: { id: category.id } });
  }

  console.log("Cleanup complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

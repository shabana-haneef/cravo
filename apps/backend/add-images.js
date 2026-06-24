import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding multiple images to products...');
  
  // Find products that only have 1 image
  const products = await prisma.product.findMany({
    include: {
      images: true,
    }
  });

  const extraImages = [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1515023115689-589c33041d3c?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=600'
  ];

  let count = 0;
  for (const product of products) {
    if (product.images.length === 1) {
      await prisma.productImage.createMany({
        data: [
          { productId: product.id, imageUrl: extraImages[0], publicId: `extra1-${product.id}`, sortOrder: 1 },
          { productId: product.id, imageUrl: extraImages[1], publicId: `extra2-${product.id}`, sortOrder: 2 },
          { productId: product.id, imageUrl: extraImages[2], publicId: `extra3-${product.id}`, sortOrder: 3 },
        ]
      });
      count++;
      console.log(`Added extra images to product: ${product.name}`);
    }
  }

  console.log(`Added multiple images to ${count} products successfully.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

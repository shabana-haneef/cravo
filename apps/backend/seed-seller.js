import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed script...');
  
  const email = 'testseller@gmail.com';
  const password = '12345678a@q';
  
  // 1. Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  
  // 2. Create or find User
  let user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'SELLER',
        isEmailVerified: true,
      }
    });
    console.log(`Created user ${email} with id ${user.id}`);
  } else {
    console.log(`User ${email} already exists.`);
  }

  // 3. Create Profile
  let profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        userId: user.id,
        fullName: 'Test Seller',
        phone: '9876543210'
      }
    });
    console.log(`Created profile for ${email}`);
  }

  // 4. Create Seller
  let seller = await prisma.seller.findUnique({ where: { userId: user.id } });
  if (!seller) {
    seller = await prisma.seller.create({
      data: {
        userId: user.id,
        bio: 'A trusted seller of organic fruits.',
        status: 'APPROVED'
      }
    });
    console.log(`Created seller profile for ${email}`);
  }

  // 5. Create Shop
  let shop = await prisma.shop.findUnique({ where: { sellerId: seller.id } });
  if (!shop) {
    shop = await prisma.shop.create({
      data: {
        sellerId: seller.id,
        name: 'Test Seller Shop',
        slug: 'test-seller-shop',
        description: 'A shop created for testing purposes.',
        status: 'ACTIVE', shopType: 'FARMER'
      }
    });
    console.log(`Created shop Test Seller Shop`);
  }

  // 6. Create Category if needed
  let category = await prisma.category.findUnique({ where: { slug: 'organic-fruits' } });
  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'Organic Fruits',
        slug: 'organic-fruits'
      }
    });
    console.log(`Created category Organic Fruits`);
  }

  // 7. Create 10 Products with multiple images
  for (let i = 11; i <= 20; i++) {
    const productName = `Test Organic Apple Variant ${i}`;
    const slug = `test-organic-apple-variant-${i}`;
    
    let product = await prisma.product.findUnique({ where: { slug } });
    if (!product) {
      product = await prisma.product.create({
        data: {
          shopId: shop.id,
          categoryId: category.id,
          name: productName,
          slug: slug,
          shortDescription: 'Fresh and juicy organic apple.',
          status: 'APPROVED',
          isFeatured: true,
          variants: {
            create: {
              name: '1 Kg',
              sku: `TEST-APP-${i}-1KG`,
              price: 150 + (i * 10),
              inventory: {
                create: {
                  availableStock: 50,
                  lowStockThreshold: 10
                }
              }
            }
          },
          images: {
            createMany: {
              data: [
                { imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6fac6?auto=format&fit=crop&q=80&w=600', publicId: `test-img1-${i}`, sortOrder: 0 },
                { imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=600', publicId: `test-img2-${i}`, sortOrder: 1 },
                { imageUrl: 'https://images.unsplash.com/photo-1567306301408-9b74779a11af?auto=format&fit=crop&q=80&w=600', publicId: `test-img3-${i}`, sortOrder: 2 },
                { imageUrl: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&q=80&w=600', publicId: `test-img4-${i}`, sortOrder: 3 }
              ]
            }
          }
        }
      });
      console.log(`Created product: ${product.name}`);
    } else {
      console.log(`Product ${slug} already exists.`);
    }
  }

  console.log('Seed completed successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

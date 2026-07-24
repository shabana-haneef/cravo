import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { generateAccessToken } from '../src/shared/utils/jwt.js';

describe('Inventory Management API', () => {
  let seller1Token;
  let seller2Token;
  let seller1Id;
  let seller2Id;
  let variantId;
  let productId;
  let shopId;

  beforeAll(async () => {
    const timestamp = Date.now();
    const seller1 = await prisma.user.create({ data: { email: `seller1-inv-${timestamp}@example.com`, role: 'SELLER', isEmailVerified: true, status: 'ACTIVE' }});
    const seller2 = await prisma.user.create({ data: { email: `seller2-inv-${timestamp}@example.com`, role: 'SELLER', isEmailVerified: true, status: 'ACTIVE' }});
    seller1Id = seller1.id;
    seller2Id = seller2.id;

    const sellerProfile1 = await prisma.seller.create({ data: { userId: seller1.id, status: 'APPROVED' } });
    const sellerProfile2 = await prisma.seller.create({ data: { userId: seller2.id, status: 'APPROVED' } });

    seller1Token = generateAccessToken({ id: seller1.id, role: seller1.role });
    seller2Token = generateAccessToken({ id: seller2.id, role: seller2.role });

    // 2. Create Shop for Seller 1
    const shop = await prisma.shop.create({
      data: {
        sellerId: sellerProfile1.id,
        name: 'Seller 1 Inv Shop',
        slug: `seller-1-inv-shop-${timestamp}`,
        description: 'Testing inventory',
        shopType: 'OTHER'
      }
    });
    shopId = shop.id;

    // 3. Create Category and Product for Seller 1
    const category = await prisma.category.create({
      data: {
        name: 'Test Category',
        slug: `test-cat-${timestamp}`
      }
    });

    const product = await prisma.product.create({
      data: {
        shopId: shop.id,
        categoryId: category.id,
        name: 'Test Inv Product',
        slug: `test-inv-product-${timestamp}`,
        status: 'APPROVED'
      }
    });
    productId = product.id;

    // 4. Create Variant with initial stock 10
    const variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        name: 'Variant 1',
        sku: 'TEST-SKU-1',
        price: 100,
        inventory: {
          create: {
            availableStock: 10
          }
        }
      }
    });
    variantId = variant.id;
  });

  afterAll(async () => {
    try {
      await prisma.inventory.deleteMany({ where: { productVariantId: variantId } });
      await prisma.productVariant.deleteMany({ where: { id: variantId } });
      await prisma.product.deleteMany({ where: { id: productId } });
      await prisma.shop.deleteMany({ where: { id: shopId } });
      await prisma.user.deleteMany({ where: { id: { in: [seller1Id, seller2Id] } } });
    } catch (e) {
      console.log('Cleanup error', e.message);
    }
  });

  it('should increase stock correctly', async () => {
    const res = await request(app)
      .patch(`/api/v1/inventory/${variantId}`)
      .set('Authorization', `Bearer ${seller1Token}`)
      .send({ quantity: 5, reason: 'Restock' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.inventory.availableStock).toBe(15);
  });

  it('should prevent negative stock values', async () => {
    // Current stock is 15. We try to remove 20.
    const res = await request(app)
      .patch(`/api/v1/inventory/${variantId}`)
      .set('Authorization', `Bearer ${seller1Token}`)
      .send({ quantity: -20, reason: 'Damage' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Insufficient/i);
  });

  it('should prevent non-owners from modifying stock', async () => {
    // Seller 2 tries to modify Seller 1's product variant
    const res = await request(app)
      .patch(`/api/v1/inventory/${variantId}`)
      .set('Authorization', `Bearer ${seller2Token}`)
      .send({ quantity: 10, reason: 'Stealing stock' });

    expect([403, 404]).toContain(res.statusCode);
  });

  it('should handle concurrent stock decreases safely', async () => {
    // Current stock is 15. We will fire 3 requests at the same time to decrease by 5.
    // All 3 should succeed and leave stock at 0.
    const req1 = request(app).patch(`/api/v1/inventory/${variantId}`).set('Authorization', `Bearer ${seller1Token}`).send({ quantity: -5 });
    const req2 = request(app).patch(`/api/v1/inventory/${variantId}`).set('Authorization', `Bearer ${seller1Token}`).send({ quantity: -5 });
    const req3 = request(app).patch(`/api/v1/inventory/${variantId}`).set('Authorization', `Bearer ${seller1Token}`).send({ quantity: -5 });

    const responses = await Promise.all([req1, req2, req3]);
    
    responses.forEach(res => {
      expect(res.statusCode).toBe(200);
    });

    // Check final stock
    const finalCheck = await request(app)
      .get(`/api/v1/inventory/${variantId}`)
      .set('Authorization', `Bearer ${seller1Token}`);

    expect(finalCheck.statusCode).toBe(200);
    expect(finalCheck.body.data.inventory.availableStock).toBe(0);
  });
});

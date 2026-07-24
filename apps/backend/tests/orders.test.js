import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/lib/prisma.js';
import { generateAccessToken } from '../src/shared/utils/jwt.js';

describe('Cart & Order Financials API', () => {
  let buyerToken, seller1Token, seller2Token;
  let buyerId, seller1Id, seller2Id;
  let shop1Id, shop2Id;
  let productId1, productId2;
  let variantId1, variantId2;
  let categoryId;
  let testAddressId;
  const timestamp = Date.now();

  beforeAll(async () => {
    // 1. Create Users
    const buyer = await prisma.user.create({ data: { email: `buyer-ord-${timestamp}@example.com`, role: 'CUSTOMER', isEmailVerified: true, status: 'ACTIVE' }});
    const seller1 = await prisma.user.create({ data: { email: `seller1-ord-${timestamp}@example.com`, role: 'SELLER', isEmailVerified: true, status: 'ACTIVE' }});
    const seller2 = await prisma.user.create({ data: { email: `seller2-ord-${timestamp}@example.com`, role: 'SELLER', isEmailVerified: true, status: 'ACTIVE' }});

    buyerId = buyer.id;
    seller1Id = seller1.id;
    seller2Id = seller2.id;
    buyerToken = generateAccessToken({ id: buyer.id, role: buyer.role });
    seller1Token = generateAccessToken({ id: seller1.id, role: seller1.role });
    seller2Token = generateAccessToken({ id: seller2.id, role: seller2.role });

    const sellerProfile1 = await prisma.seller.create({ data: { userId: seller1.id } });
    const sellerProfile2 = await prisma.seller.create({ data: { userId: seller2.id } });

    // 2. Create Shops
    const shop1 = await prisma.shop.create({
      data: { sellerId: sellerProfile1.id, name: 'Shop 1 Ord', slug: `shop-1-ord-${timestamp}`, shopType: 'OTHER' }
    });
    shop1Id = shop1.id;

    const shop2 = await prisma.shop.create({
      data: { sellerId: sellerProfile2.id, name: 'Shop 2 Ord', slug: `shop-2-ord-${timestamp}`, shopType: 'OTHER' }
    });
    shop2Id = shop2.id;

    // 3. Create Category
    const category = await prisma.category.create({
      data: { name: 'Category Ord', slug: `category-ord-${timestamp}` }
    });
    categoryId = category.id;

    // 4. Create Products & Variants
    const product1 = await prisma.product.create({
      data: { shopId: shop1Id, categoryId: categoryId, name: 'Product 1 Ord', slug: `prod-1-ord-${timestamp}`, status: 'APPROVED' }
    });
    productId1 = product1.id;

    const variant1 = await prisma.productVariant.create({
      data: {
        productId: productId1,
        name: 'Variant 1 Ord',
        sku: `SKU-1-${timestamp}`,
        price: 150,
        inventory: { create: { availableStock: 20 } }
      }
    });
    variantId1 = variant1.id;

    const product2 = await prisma.product.create({
      data: { shopId: shop2Id, categoryId: categoryId, name: 'Product 2 Ord', slug: `prod-2-ord-${timestamp}`, status: 'APPROVED' }
    });
    productId2 = product2.id;

    const variant2 = await prisma.productVariant.create({
      data: {
        productId: productId2,
        name: 'Variant 2 Ord',
        sku: `SKU-2-${timestamp}`,
        price: 200,
        inventory: { create: { availableStock: 20 } }
      }
    });
    variantId2 = variant2.id;
  });

  afterAll(async () => {
    try {
      // Cleanup orders
      await prisma.orderItem.deleteMany({ where: { productVariantId: { in: [variantId1, variantId2] } } });
      await prisma.order.deleteMany({ where: { customerId: buyerId } });
      
      if (testAddressId) {
        await prisma.address.deleteMany({ where: { id: testAddressId } });
      }

      await prisma.cartItem.deleteMany({ where: { productVariantId: { in: [variantId1, variantId2] } } });
      await prisma.cart.deleteMany({ where: { userId: buyerId } });
      
      await prisma.inventory.deleteMany({ where: { productVariantId: { in: [variantId1, variantId2] } } });
      await prisma.productVariant.deleteMany({ where: { id: { in: [variantId1, variantId2] } } });
      await prisma.product.deleteMany({ where: { id: { in: [productId1, productId2] } } });
      await prisma.category.deleteMany({ where: { id: categoryId } });
      await prisma.shop.deleteMany({ where: { id: { in: [shop1Id, shop2Id] } } });
      await prisma.seller.deleteMany({ where: { userId: { in: [seller1Id, seller2Id] } } });
      await prisma.user.deleteMany({ where: { id: { in: [buyerId, seller1Id, seller2Id] } } });
    } catch (e) {
      console.log('Cleanup error', e);
    }
  });

  it('should add item to cart and calculate correct totals', async () => {
    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productVariantId: variantId1, quantity: 2 });

    expect(res.statusCode).toBe(200);
    // 2 * 150 = 300
    expect(res.body.data.cart.summary.subtotal).toBe(300);
  });

  it('should enforce single-seller cart restriction', async () => {
    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productVariantId: variantId2, quantity: 1 });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/different shop/i);
  });

  it('should calculate correct totals on checkout and create order', async () => {
    // 1. Create a dummy address for checkout
    const address = await prisma.address.create({
      data: {
        userId: buyerId,
        fullName: 'Test Buyer',
        phone: '1234567890',
        addressLine1: '123 Main St',
        city: 'Kochi',
        state: 'Kerala',
        postalCode: '682001'
      }
    });
    testAddressId = address.id;

    const res = await request(app)
      .post('/api/v1/orders/checkout')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ addressId: address.id });

    expect(res.statusCode).toBe(201);
    expect(Number(res.body.data.order.subtotal)).toBe(300);
    expect(res.body.data.order.status).toBe('PENDING_PAYMENT');
  });
});

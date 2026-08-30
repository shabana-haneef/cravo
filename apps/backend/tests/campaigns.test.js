import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('Campaigns API', () => {
  let sellerUser;
  let sellerShop;
  let accessToken;

  beforeAll(async () => {
    // 1. Create a mock seller
    const email = 'seller_campaign_test@example.com';
    sellerUser = await prisma.user.create({
      data: {
        email,
        passwordHash: 'hashedpassword',
        role: 'SELLER',
        isEmailVerified: true,
        profile: {
          create: {
            fullName: 'Campaign Tester'
          }
        }
      }
    });

    const seller = await prisma.seller.create({
      data: {
        userId: sellerUser.id,
        businessName: 'Campaign Test Business',
        pickupAddress: 'Test Address',
        pickupCity: 'Kochi',
        pickupState: 'Kerala',
        pickupPincode: '682001',
        pickupPhone: '9876543210',
        status: 'APPROVED'
      }
    });

    // 2. Create a shop for the seller
    sellerShop = await prisma.shop.create({
      data: {
        sellerId: seller.id,
        name: 'Campaign Test Shop',
        slug: `campaign-test-shop-${Date.now()}`,
        description: 'Test shop for campaigns',
        shopType: 'GROCERY',
        status: 'ACTIVE'
      }
    });

    // 3. Login to get token
    const { generateAccessToken } = await import('../src/shared/utils/jwt.js');
    accessToken = generateAccessToken({ id: sellerUser.id, role: sellerUser.role });
  });

  afterAll(async () => {
    if (sellerShop) {
      await prisma.shop.delete({ where: { id: sellerShop.id } });
    }
    if (sellerUser) {
      await prisma.user.delete({ where: { id: sellerUser.id } });
    }
  });

  it('should not allow creating a campaign without required fields', async () => {
    const res = await request(app)
      .post('/api/v1/campaigns/discount')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        // Missing required fields like discount, etc.
        name: 'Invalid Campaign' 
      });
    
    expect(res.statusCode).toBe(400);
  });

  it('should prevent unauthorized users from creating campaigns', async () => {
    const res = await request(app)
      .post('/api/v1/campaigns/discount')
      .send({
        name: 'No Auth Campaign',
        discount: 20
      });
    
    expect(res.statusCode).toBe(401);
  });
});

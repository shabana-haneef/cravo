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
        firstName: 'Campaign',
        lastName: 'Tester',
        role: 'SELLER',
        isEmailVerified: true
      }
    });

    // 2. Create a shop for the seller
    sellerShop = await prisma.shop.create({
      data: {
        name: 'Campaign Test Shop',
        description: 'Test shop for campaigns',
        ownerId: sellerUser.id,
        isApproved: true,
        verificationStatus: 'VERIFIED'
      }
    });

    // 3. Login to get token (bypass bcrypt by just generating a token if possible, or use the app login if we know password)
    // Actually, since we created it directly, we can just use authService to generate a token
    const { authService } = await import('../src/modules/auth/services/auth.service.js');
    const tokenData = authService.generateTokens(sellerUser.id, sellerUser.role);
    accessToken = tokenData.accessToken;
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
      .post('/api/v1/campaigns')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        // Missing required fields like type, targetId, budget
        name: 'Invalid Campaign' 
      });
    
    expect(res.statusCode).toBe(400);
  });

  it('should prevent unauthorized users from creating campaigns', async () => {
    const res = await request(app)
      .post('/api/v1/campaigns')
      .send({
        name: 'No Auth Campaign',
        type: 'STORE_PROMOTION',
        budget: 1000,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString()
      });
    
    expect(res.statusCode).toBe(401);
  });
});

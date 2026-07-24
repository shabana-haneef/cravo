import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { generateAccessToken } from '../src/shared/utils/jwt.js';

describe('Authorization & Role Protection API', () => {
  let customerToken;
  let sellerToken;
  let adminToken;
  let users = [];

  beforeAll(async () => {
    // Create actual users in the test database
    const customer = await prisma.user.create({ data: { email: 'customer-authz@example.com', role: 'CUSTOMER', isEmailVerified: true, status: 'ACTIVE' }});
    const seller = await prisma.user.create({ data: { email: 'seller-authz@example.com', role: 'SELLER', isEmailVerified: true, status: 'ACTIVE' }});
    const admin = await prisma.user.create({ data: { email: 'admin-authz@example.com', role: 'ADMIN', isEmailVerified: true, status: 'ACTIVE' }});

    users = [customer.id, seller.id, admin.id];

    customerToken = generateAccessToken({ id: customer.id, role: customer.role });
    sellerToken = generateAccessToken({ id: seller.id, role: seller.role });
    adminToken = generateAccessToken({ id: admin.id, role: admin.role });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: users } } });
  });

  it('should deny unauthenticated requests to protected endpoints (401)', async () => {
    // Attempting to hit an admin endpoint without any token
    const res = await request(app).get('/api/v1/admin/dashboard/stats');
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/Not authorized/i);
  });

  it('should deny a CUSTOMER from accessing SELLER endpoints (403)', async () => {
    // Assuming /api/v1/sellers/dashboard is protected for sellers
    // We'll hit an endpoint that requires SELLER
    const res = await request(app)
      .post('/api/v1/products') // Requires SELLER or ADMIN
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ name: 'Test Product' });
      
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/permission/i);
  });

  it('should deny a CUSTOMER from accessing ADMIN endpoints (403)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard/stats')
      .set('Authorization', `Bearer ${customerToken}`);
      
    expect(res.statusCode).toBe(403);
  });

  it('should deny a SELLER from accessing ADMIN endpoints (403)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard/stats')
      .set('Authorization', `Bearer ${sellerToken}`);
      
    expect(res.statusCode).toBe(403);
  });

  it('should allow ADMIN to access ADMIN endpoints', async () => {
    // Mock the actual controller so we don't need real DB data for the dashboard stats
    const res = await request(app)
      .get('/api/v1/admin/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);
      
    // It might return 200, or a 500 if the DB is empty, but definitely NOT a 401 or 403
    expect(res.statusCode).not.toBe(401);
    expect(res.statusCode).not.toBe(403);
  });
});

import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

import { emailService } from '../src/modules/auth/services/email.service.js';

describe('Authentication API', () => {
  beforeAll(() => {
    // Spy and mock email service to prevent real API calls
    jest.spyOn(emailService, 'sendVerificationEmail').mockResolvedValue(true);
    jest.spyOn(emailService, 'sendPasswordResetEmail').mockResolvedValue(true);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  const testUser = {
    email: 'test@example.com',
    password: 'Password123'
  };

  afterAll(async () => {
    // Cleanup test user
    await prisma.user.deleteMany({ where: { email: testUser.email } });
  });

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);
    
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeNull();
  });

  it('should not register user with existing email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);
    
    expect(res.statusCode).toBe(400);
  });

  it('should login the user', async () => {
    // Manually verify user in DB so login works
    await prisma.user.update({
      where: { email: testUser.email },
      data: { isEmailVerified: true }
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.body.data.accessToken).toBeDefined();
  });
});

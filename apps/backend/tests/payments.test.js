import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/lib/prisma.js';
import crypto from 'crypto';
import { env } from '../src/config/env.js';
import { jest } from '@jest/globals';
import { razorpayService } from '../src/modules/payments/services/razorpay.service.js';

// Setup mock secrets for the test
env.RAZORPAY_KEY_SECRET = env.RAZORPAY_KEY_SECRET || 'test_secret';
env.RAZORPAY_WEBHOOK_SECRET = env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';

import { generateAccessToken } from '../src/shared/utils/jwt.js';

describe('Payment & Webhooks API', () => {
  let customerToken;
  let customerId;
  let testOrderId;
  let testPaymentId;
  let sellerId;
  let razorpayOrderId = 'order_test123';
  const timestamp = Date.now();

  beforeAll(async () => {
    // 1. Create a customer
    const customer = await prisma.user.create({
      data: {
        email: `payment_customer_${timestamp}@test.com`,
        role: 'CUSTOMER',
        isEmailVerified: true,
        status: 'ACTIVE'
      }
    });
    customerId = customer.id;
    customerToken = generateAccessToken({ id: customer.id, role: customer.role });

    // 2. Setup a shop for order
    const seller = await prisma.user.create({
      data: {
        email: `payment_seller_${timestamp}@test.com`,
        role: 'SELLER',
        isEmailVerified: true,
        status: 'ACTIVE'
      }
    });
    sellerId = seller.id;
    const sellerProfile = await prisma.seller.create({ data: { userId: sellerId } });

    const shop = await prisma.shop.create({
      data: {
        name: 'Payment Test Shop',
        slug: 'payment-test-shop-' + Date.now(),
        sellerId: sellerProfile.id,
        shopType: 'OTHER'
      }
    });

    // 3. Create Address
    const address = await prisma.address.create({
      data: {
        userId: customerId,
        fullName: 'Test Customer',
        phone: '9876543210',
        addressLine1: 'Test St',
        city: 'Kochi',
        state: 'Kerala',
        postalCode: '682001'
      }
    });

    // 4. Create an order with PENDING_PAYMENT status
    const order = await prisma.order.create({
      data: {
        orderNumber: 'ORD-PAY-123',
        customerId,
        shopId: shop.id,
        addressId: address.id,
        subtotal: 500,
        deliveryCharge: 40,
        grandTotal: 550,
        status: 'PENDING_PAYMENT'
      }
    });
    testOrderId = order.id;

    // 5. Create a payment record in PENDING status
    const payment = await prisma.payment.create({
      data: {
        orderId: testOrderId,
        razorpayOrderId: razorpayOrderId,
        amount: 550,
        status: 'PENDING'
      }
    });
    testPaymentId = payment.id;
  });

  afterAll(async () => {
    await prisma.payment.deleteMany({ where: { order: { customerId } } });
    await prisma.orderItem.deleteMany({ where: { order: { customerId } } });
    await prisma.order.deleteMany({ where: { customerId } });
    await prisma.address.deleteMany({ where: { userId: customerId } });
    await prisma.shop.deleteMany({ where: { seller: { userId: sellerId } } });
    await prisma.seller.deleteMany({ where: { userId: sellerId } });
    await prisma.user.deleteMany({
      where: { id: { in: [customerId, sellerId] } }
    });
    await prisma.$disconnect();
  });

  it('should reject invalid Razorpay signatures on verify', async () => {
    const res = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        razorpayOrderId: razorpayOrderId,
        razorpayPaymentId: 'pay_test123',
        razorpaySignature: 'invalid_signature_hash'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Invalid payment signature');
  });

  it('should successfully verify payment with valid signature', async () => {
    // Generate valid signature
    const razorpayPaymentId = 'pay_test123';
    const bodyText = razorpayOrderId + '|' + razorpayPaymentId;
    const validSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(bodyText)
      .digest('hex');

    // Mock the getPayment call from razorpay to avoid hitting the actual API
    jest.spyOn(razorpayService, 'getPayment').mockResolvedValueOnce({
      amount: 55000, // in paise
      currency: 'INR',
      order_id: razorpayOrderId,
      status: 'captured'
    });

    const res = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        razorpayOrderId: razorpayOrderId,
        razorpayPaymentId: razorpayPaymentId,
        razorpaySignature: validSignature
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.success).toBe(true);
    expect(res.body.data.orderId).toBe(testOrderId);

    // Verify DB update
    const updatedPayment = await prisma.payment.findUnique({ where: { id: testPaymentId } });
    expect(updatedPayment.status).toBe('SUCCESS');
    expect(updatedPayment.razorpayPaymentId).toBe(razorpayPaymentId);

    const updatedOrder = await prisma.order.findUnique({ where: { id: testOrderId } });
    expect(updatedOrder.status).toBe('PLACED');
    jest.restoreAllMocks();
  });

  it('should reject invalid webhook signature', async () => {
    const payload = {
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_123', order_id: 'order_123', amount: 55000, currency: 'INR' } } }
    };

    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .set('x-razorpay-signature', 'invalid_signature')
      .send(payload);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Invalid webhook signature');
  });

  it('should handle duplicate webhook calls gracefully (idempotency)', async () => {
    const dNow = Date.now();
    // Create another pending order and payment
    const order2 = await prisma.order.create({
      data: {
        orderNumber: 'ORD-PAY-456-' + dNow,
        customerId,
        shopId: (await prisma.shop.findFirst({ where: { name: 'Payment Test Shop' } })).id,
        addressId: (await prisma.address.findFirst({ where: { userId: customerId } })).id,
        subtotal: 500,
        deliveryCharge: 40,
        grandTotal: 550,
        status: 'PENDING_PAYMENT'
      }
    });
    
    const payment2 = await prisma.payment.create({
      data: {
        orderId: order2.id,
        razorpayOrderId: 'order_test456_' + dNow,
        amount: 550,
        status: 'PENDING'
      }
    });

    const payload = {
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_test456_' + dNow, order_id: 'order_test456_' + dNow, amount: 55000, currency: 'INR' } } }
    };
    
    const validSignature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    // First Webhook Call
    const res1 = await request(app)
      .post('/api/v1/payments/webhook')
      .set('x-razorpay-signature', validSignature)
      .send(payload);

    expect(res1.statusCode).toBe(200);

    const updatedPayment = await prisma.payment.findUnique({ where: { id: payment2.id } });
    expect(updatedPayment.status).toBe('SUCCESS');

    // Second Webhook Call (Duplicate)
    const res2 = await request(app)
      .post('/api/v1/payments/webhook')
      .set('x-razorpay-signature', validSignature)
      .send(payload);

    expect(res2.statusCode).toBe(200); // Idempotent success

    // Ensure status is still SUCCESS and no errors were thrown
    const checkedPayment = await prisma.payment.findUnique({ where: { id: payment2.id } });
    expect(checkedPayment.status).toBe('SUCCESS');
    
    // Cleanup
    await prisma.payment.deleteMany({ where: { id: payment2.id } });
    await prisma.order.deleteMany({ where: { id: order2.id } });
  });
});

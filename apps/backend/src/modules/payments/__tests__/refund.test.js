import { jest } from '@jest/globals';

const mockPrisma = {
  $transaction: jest.fn(),
  $queryRaw: jest.fn(),
  refund: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    aggregate: jest.fn()
  }
};

const mockRazorpayService = {
  createRefund: jest.fn(),
  verifyWebhookSignature: jest.fn().mockReturnValue(true)
};

const mockPaymentRepository = {
  findByRazorpayPaymentId: jest.fn()
};

await jest.unstable_mockModule('../../../lib/prisma.js', () => ({
  default: mockPrisma
}));

await jest.unstable_mockModule('../services/razorpay.service.js', () => ({
  razorpayService: mockRazorpayService
}));

await jest.unstable_mockModule('../repositories/payment.repository.js', () => ({
  paymentRepository: mockPaymentRepository
}));

// Import AFTER mocking
const { refundService } = await import('../services/refund.service.js');
const { paymentService } = await import('../services/payment.service.js');
const { AppError } = await import('../../../shared/errors/AppError.js');

describe('Razorpay Refund Architecture - Phase 1 Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. initiateRefund', () => {
    const mockPayment = {
      id: 'pay_123',
      orderId: 'ord_123',
      status: 'SUCCESS',
      razorpayPaymentId: 'rzp_pay_123'
    };

    it('should successfully initiate a new refund and return PENDING state', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        // Mock $queryRaw FOR UPDATE lock
        mockPrisma.$queryRaw = jest.fn().mockResolvedValue([mockPayment]);
        
        mockPrisma.refund.findFirst.mockResolvedValue(null);
        mockPrisma.refund.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
        
        const pendingRefund = { id: 'ref_local_1', status: 'PENDING' };
        mockPrisma.refund.create.mockResolvedValue(pendingRefund);
        
        mockRazorpayService.createRefund.mockResolvedValue({ id: 'rzp_ref_123' });
        
        mockPrisma.refund.update.mockResolvedValue({ ...pendingRefund, razorpayRefundId: 'rzp_ref_123' });

        return await callback(mockPrisma);
      });

      const result = await refundService.initiateRefund('pay_123', 100, 'Return', 'idem-123');
      
      expect(result.razorpayRefundId).toBe('rzp_ref_123');
      expect(mockRazorpayService.createRefund).toHaveBeenCalledWith('rzp_pay_123', 100, 'idem-123', 'idem-123');
    });

    it('should enforce idempotency by returning existing refund without calling Razorpay', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        mockPrisma.$queryRaw = jest.fn().mockResolvedValue([mockPayment]);
        const existingRefund = { id: 'ref_local_1', status: 'PENDING', receipt: 'idem-123' };
        mockPrisma.refund.findFirst.mockResolvedValue(existingRefund);

        return await callback(mockPrisma);
      });

      const result = await refundService.initiateRefund('pay_123', 100, 'Return', 'idem-123');
      
      expect(result).toEqual({ id: 'ref_local_1', status: 'PENDING', receipt: 'idem-123' });
      expect(mockRazorpayService.createRefund).not.toHaveBeenCalled();
    });

    it('should handle API failure gracefully, leaving refund in PENDING state', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        mockPrisma.$queryRaw = jest.fn().mockResolvedValue([mockPayment]);
        mockPrisma.refund.findFirst.mockResolvedValue(null);
        mockPrisma.refund.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
        
        const pendingRefund = { id: 'ref_local_1', status: 'PENDING' };
        mockPrisma.refund.create.mockResolvedValue(pendingRefund);
        
        mockRazorpayService.createRefund.mockRejectedValue(new Error('Network Timeout'));
        
        mockPrisma.refund.update.mockResolvedValue({ ...pendingRefund, error: 'Network Timeout' });

        return await callback(mockPrisma);
      });

      const result = await refundService.initiateRefund('pay_123', 100, 'Return', 'idem-123');
      
      expect(result.status).toBe('PENDING');
      expect(result.error).toBe('Network Timeout');
    });

    describe('Amount Validation', () => {
      it('should succeed when refund is within remaining balance', async () => {
        mockPrisma.$transaction.mockImplementation(async (callback) => {
          mockPrisma.$queryRaw = jest.fn().mockResolvedValue([{ ...mockPayment, amount: 500 }]);
          mockPrisma.refund.findFirst.mockResolvedValue(null);
          // 200 already refunded
          mockPrisma.refund.aggregate.mockResolvedValue({ _sum: { amount: 200 } });
          mockPrisma.refund.create.mockResolvedValue({ id: 'ref_2', status: 'PENDING' });
          mockRazorpayService.createRefund.mockResolvedValue({ id: 'rzp_ref_2' });
          mockPrisma.refund.update.mockResolvedValue({ id: 'ref_2', status: 'PENDING', razorpayRefundId: 'rzp_ref_2' });
          return await callback(mockPrisma);
        });

        // Requesting 100 out of remaining 300
        const result = await refundService.initiateRefund('pay_123', 100, 'Return', 'idem-2');
        expect(result.razorpayRefundId).toBe('rzp_ref_2');
      });

      it('should succeed when refund is exactly equal to remaining balance', async () => {
        mockPrisma.$transaction.mockImplementation(async (callback) => {
          mockPrisma.$queryRaw = jest.fn().mockResolvedValue([{ ...mockPayment, amount: 500 }]);
          mockPrisma.refund.findFirst.mockResolvedValue(null);
          mockPrisma.refund.aggregate.mockResolvedValue({ _sum: { amount: 300 } });
          mockPrisma.refund.create.mockResolvedValue({ id: 'ref_3', status: 'PENDING' });
          mockRazorpayService.createRefund.mockResolvedValue({ id: 'rzp_ref_3' });
          mockPrisma.refund.update.mockResolvedValue({ id: 'ref_3', status: 'PENDING', razorpayRefundId: 'rzp_ref_3' });
          return await callback(mockPrisma);
        });

        // Requesting exactly 200 (the remaining balance)
        const result = await refundService.initiateRefund('pay_123', 200, 'Return', 'idem-3');
        expect(result.razorpayRefundId).toBe('rzp_ref_3');
      });

      it('should reject when refund exceeds remaining balance', async () => {
        mockPrisma.$transaction.mockImplementation(async (callback) => {
          mockPrisma.$queryRaw = jest.fn().mockResolvedValue([{ ...mockPayment, amount: 500 }]);
          mockPrisma.refund.findFirst.mockResolvedValue(null);
          mockPrisma.refund.aggregate.mockResolvedValue({ _sum: { amount: 400 } });
          return await callback(mockPrisma);
        });

        // Requesting 200, but only 100 remains
        await expect(refundService.initiateRefund('pay_123', 200, 'Return', 'idem-4'))
          .rejects.toThrow('Refund amount exceeds allowable balance. Maximum refundable: 100');
      });

      it('should correctly sum multiple pending/processed refunds and reject excess', async () => {
        mockPrisma.$transaction.mockImplementation(async (callback) => {
          mockPrisma.$queryRaw = jest.fn().mockResolvedValue([{ ...mockPayment, amount: 1000 }]);
          mockPrisma.refund.findFirst.mockResolvedValue(null);
          // Sum of PENDING and PROCESSED is 900
          mockPrisma.refund.aggregate.mockResolvedValue({ _sum: { amount: 900 } });
          return await callback(mockPrisma);
        });

        // Attempting to refund 150 when only 100 is left
        await expect(refundService.initiateRefund('pay_123', 150, 'Return', 'idem-5'))
          .rejects.toThrow('Refund amount exceeds allowable balance. Maximum refundable: 100');
      });
    });
  });

  describe('2. handleWebhook (refund.* events)', () => {
    it('should map refund.processed to PROCESSED state safely', async () => {
      const webhookBody = {
        event: 'refund.processed',
        payload: {
          refund: {
            entity: { id: 'rzp_ref_123', payment_id: 'rzp_pay_123', receipt: 'idem-123', amount: 10000 }
          }
        }
      };

      mockPaymentRepository.findByRazorpayPaymentId.mockResolvedValue({ id: 'pay_123', orderId: 'ord_123' });
      
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        mockPrisma.refund.findUnique.mockResolvedValue({ id: 'ref_local_1', status: 'PENDING', razorpayRefundId: 'rzp_ref_123' });
        
        return await callback(mockPrisma);
      });

      await paymentService.handleWebhook('raw', webhookBody, 'sig', 'event-1');
      
      expect(mockPrisma.refund.update).toHaveBeenCalledWith({
        where: { id: 'ref_local_1' },
        data: { razorpayRefundId: 'rzp_ref_123', status: 'PROCESSED' }
      });
    });

    it('should ignore duplicate or out-of-order webhooks (PROCESSED -> PENDING)', async () => {
      const webhookBody = {
        event: 'refund.created', // PENDING event
        payload: {
          refund: {
            entity: { id: 'rzp_ref_123', payment_id: 'rzp_pay_123', receipt: 'idem-123', amount: 10000 }
          }
        }
      };

      mockPaymentRepository.findByRazorpayPaymentId.mockResolvedValue({ id: 'pay_123', orderId: 'ord_123' });
      
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        // Simulate local record is already PROCESSED
        mockPrisma.refund.findUnique.mockResolvedValue({ id: 'ref_local_1', status: 'PROCESSED', razorpayRefundId: 'rzp_ref_123' });
        
        return await callback(mockPrisma);
      });

      await paymentService.handleWebhook('raw', webhookBody, 'sig', 'event-1');
      
      // Update should NOT be called
      expect(mockPrisma.refund.update).not.toHaveBeenCalled();
    });

    it('should use fallback receipt lookup for API/Webhook race conditions', async () => {
      const webhookBody = {
        event: 'refund.created',
        payload: {
          refund: {
            entity: { id: 'rzp_ref_123', payment_id: 'rzp_pay_123', receipt: 'idem-123', amount: 10000 }
          }
        }
      };

      mockPaymentRepository.findByRazorpayPaymentId.mockResolvedValue({ id: 'pay_123', orderId: 'ord_123' });
      
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        // razorpayRefundId lookup fails (API hasn't saved it yet)
        mockPrisma.refund.findUnique.mockResolvedValue(null);
        
        // receipt fallback lookup succeeds
        mockPrisma.refund.findFirst.mockResolvedValue({ id: 'ref_local_1', status: 'PENDING', receipt: 'idem-123' });
        
        return await callback(mockPrisma);
      });

      await paymentService.handleWebhook('raw', webhookBody, 'sig', 'event-1');
      
      // Should attach razorpayRefundId
      expect(mockPrisma.refund.update).toHaveBeenCalledWith({
        where: { id: 'ref_local_1' },
        data: { razorpayRefundId: 'rzp_ref_123', status: 'PENDING' }
      });
    });
  });
});

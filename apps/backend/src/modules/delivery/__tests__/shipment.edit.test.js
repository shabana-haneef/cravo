import { jest } from '@jest/globals';
import axios from 'axios';
import { AppError } from '../../../shared/errors/AppError.js';

// Setup environment
process.env.DELHIVERY_API_TOKEN = 'test_delhivery_token_edit';
process.env.DELHIVERY_ENV = 'prod';

// Mock Redis
const mockRedis = {
  isOpen: true,
  get: jest.fn(),
  setEx: jest.fn(),
  on: jest.fn(),
  duplicate: jest.fn().mockReturnValue({ on: jest.fn() })
};

await jest.unstable_mockModule('../../../config/redis.js', () => ({
  redis: mockRedis,
  pubClient: mockRedis,
  subClient: mockRedis
}));

// Mock logger
await jest.unstable_mockModule('../../../shared/services/logger.js', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Mock prisma
const mockPrisma = {
  delivery: {
    findFirst: jest.fn(),
    update: jest.fn()
  },
  address: {
    update: jest.fn().mockResolvedValue({})
  },
  order: {
    update: jest.fn().mockResolvedValue({})
  },
  orderShipmentLog: {
    create: jest.fn().mockResolvedValue({})
  },
  deliveryTrackingEvent: {
    create: jest.fn().mockResolvedValue({})
  },
  integrationLog: {
    create: jest.fn().mockResolvedValue({})
  }
};

await jest.unstable_mockModule('../../../lib/prisma.js', () => ({
  default: mockPrisma
}));

await jest.unstable_mockModule('../../../config/prisma.js', () => ({
  default: mockPrisma
}));

// Import services after mocks
const { delhiveryShipmentService } = await import('../services/delhiveryShipmentService.js');
const { delhiveryService } = await import('../services/delhiveryService.js');
const { deliveryService } = await import('../services/delivery.service.js');

describe('Delhivery Shipment Updation / Edit API (POST /api/p/edit)', () => {
  let axiosPostSpy;
  let checkServiceabilitySpy;

  const mockDelivery = {
    id: 'del_123',
    orderId: 'ord_123',
    trackingNumber: '56047210000571',
    delhiveryShipmentId: 'ORD_123',
    status: 'BOOKED',
    shippingLabelUrl: 'https://cdn.delhivery.com/label_old.pdf',
    order: {
      id: 'ord_123',
      orderNumber: 'ORD-2026-001',
      addressId: 'addr_123',
      shipmentLogs: [],
      address: {
        id: 'addr_123',
        fullName: 'Original Name',
        phone: '9876543210',
        addressLine1: 'Old Address',
        postalCode: '680001',
        city: 'Thrissur',
        state: 'Kerala'
      },
      shop: {
        id: 'shop_1',
        seller: {
          id: 'seller_1',
          userId: 'user_seller_1'
        }
      },
      items: [
        { productVariant: { weight: 500 }, quantity: 1 }
      ]
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    axiosPostSpy = jest.spyOn(axios.Axios.prototype, 'post');
    checkServiceabilitySpy = jest.spyOn(delhiveryService, 'checkServiceability');
  });

  afterEach(() => {
    axiosPostSpy?.mockRestore();
    checkServiceabilitySpy?.mockRestore();
  });

  describe('1. Field Allowlist & COD Rejection', () => {
    it('STRICTLY rejects COD updates and does not call Delhivery', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValueOnce(mockDelivery);

      await expect(
        deliveryService.updateShipment('del_123', { cod: 500 }, { id: 'user_seller_1', role: 'SELLER' })
      ).rejects.toThrow('Cravo does not support COD');

      expect(axiosPostSpy).not.toHaveBeenCalled();
    });

    it('rejects unsupported/arbitrary fields in delhiveryShipmentService', async () => {
      await expect(
        delhiveryShipmentService.editShipment('56047210000571', { cod: 500, randomField: 'test' })
      ).rejects.toThrow('Unsupported field(s) in shipment edit');

      expect(axiosPostSpy).not.toHaveBeenCalled();
    });

    it('rejects empty update payloads', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValueOnce(mockDelivery);

      await expect(
        deliveryService.updateShipment('del_123', {}, { id: 'user_seller_1', role: 'SELLER' })
      ).rejects.toThrow('At least one editable field must be provided');

      expect(axiosPostSpy).not.toHaveBeenCalled();
    });

    it('only forwards allowed fields to Delhivery (no cod, no unauthorized data)', async () => {
      axiosPostSpy.mockResolvedValueOnce({
        status: 200,
        data: { status: true, remark: 'updated successfully' }
      });

      const res = await delhiveryShipmentService.editShipment('56047210000571', {
        name: 'Jane Doe',
        phone: '9876543211',
        weight: '600'
      });

      expect(res.success).toBe(true);
      expect(axiosPostSpy).toHaveBeenCalledWith(
        '/api/p/edit',
        {
          waybill: '56047210000571',
          name: 'Jane Doe',
          phone: '9876543211',
          weight: '600'
        },
        expect.objectContaining({
          headers: expect.objectContaining({ 'Content-Type': 'application/json' })
        })
      );
    });
  });

  describe('2. Input Validations', () => {
    beforeEach(() => {
      mockPrisma.delivery.findFirst.mockResolvedValue(mockDelivery);
    });

    it('rejects invalid phone numbers', async () => {
      await expect(
        deliveryService.updateShipment('del_123', { phone: '123' }, { id: 'user_seller_1', role: 'SELLER' })
      ).rejects.toThrow('Please provide a valid 10-digit phone number');

      await expect(
        deliveryService.updateShipment('del_123', { phone: 'not_a_phone' }, { id: 'user_seller_1', role: 'SELLER' })
      ).rejects.toThrow('Please provide a valid 10-digit phone number');
    });

    it('rejects invalid weight (negative, zero, NaN)', async () => {
      await expect(
        deliveryService.updateShipment('del_123', { weight: -100 }, { id: 'user_seller_1', role: 'SELLER' })
      ).rejects.toThrow('Shipment weight must be a positive number');

      await expect(
        deliveryService.updateShipment('del_123', { weight: 0 }, { id: 'user_seller_1', role: 'SELLER' })
      ).rejects.toThrow('Shipment weight must be a positive number');

      await expect(
        deliveryService.updateShipment('del_123', { weight: 'abc' }, { id: 'user_seller_1', role: 'SELLER' })
      ).rejects.toThrow('Shipment weight must be a positive number');
    });

    it('rejects invalid dimensions (zero or negative)', async () => {
      await expect(
        deliveryService.updateShipment('del_123', { shipment_length: -5 }, { id: 'user_seller_1', role: 'SELLER' })
      ).rejects.toThrow('Shipment dimension shipment_length must be a positive number');

      await expect(
        deliveryService.updateShipment('del_123', { shipment_height: 0 }, { id: 'user_seller_1', role: 'SELLER' })
      ).rejects.toThrow('Shipment dimension shipment_height must be a positive number');
    });

    it('rejects invalid pincode formats', async () => {
      await expect(
        deliveryService.updateShipment('del_123', { pin: '012345' }, { id: 'user_seller_1', role: 'SELLER' })
      ).rejects.toThrow('Please provide a valid 6-digit Indian pincode');

      await expect(
        deliveryService.updateShipment('del_123', { pin: '12345' }, { id: 'user_seller_1', role: 'SELLER' })
      ).rejects.toThrow('Please provide a valid 6-digit Indian pincode');
    });

  });

  describe('3. Destination Serviceability Re-Check', () => {
    beforeEach(() => {
      mockPrisma.delivery.findFirst.mockResolvedValue(mockDelivery);
    });

    it('triggers B2C serviceability check on destination pincode change and rejects if unserviceable', async () => {
      checkServiceabilitySpy.mockResolvedValueOnce({ serviceable: false });

      await expect(
        deliveryService.updateShipment('del_123', { pin: '682001' }, { id: 'user_seller_1', role: 'SELLER' })
      ).rejects.toThrow('Destination pincode 682001 is not serviceable by Delhivery');

      expect(checkServiceabilitySpy).toHaveBeenCalledWith('682001', { productType: 'B2C' });
      expect(axiosPostSpy).not.toHaveBeenCalled();
    });

    it('triggers Heavy serviceability check if shipment is heavy (>= 10kg)', async () => {
      const heavyDelivery = {
        ...mockDelivery,
        order: {
          ...mockDelivery.order,
          items: [{ productVariant: { weight: 15000 }, quantity: 1 }] // 15kg
        }
      };
      mockPrisma.delivery.findFirst.mockResolvedValueOnce(heavyDelivery);
      checkServiceabilitySpy.mockResolvedValueOnce({ serviceable: true });
      axiosPostSpy.mockResolvedValueOnce({ status: 200, data: { status: true } });

      const res = await deliveryService.updateShipment(
        'del_123',
        { pin: '682001' },
        { id: 'user_seller_1', role: 'SELLER' }
      );

      expect(res.success).toBe(true);
      expect(checkServiceabilitySpy).toHaveBeenCalledWith('682001', { productType: 'Heavy' });
    });
  });

  describe('4. Delivery State Restrictions', () => {
    it.each([
      'CREATED',
      'BOOKED',
      'PICKUP_SCHEDULED',
      'READY_FOR_PICKUP',
      'FAILED'
    ])('allows update in pre-pickup state: %s', async (status) => {
      mockPrisma.delivery.findFirst.mockResolvedValueOnce({
        ...mockDelivery,
        status
      });
      axiosPostSpy.mockResolvedValueOnce({ status: 200, data: { status: true } });

      const res = await deliveryService.updateShipment(
        'del_123',
        { name: 'New Name' },
        { id: 'user_seller_1', role: 'SELLER' }
      );

      expect(res.success).toBe(true);
    });

    it.each([
      'PICKED_UP',
      'IN_TRANSIT',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'RETURNED',
      'RTO',
      'CANCELLED'
    ])('blocks update in non-editable/post-pickup state: %s', async (status) => {
      mockPrisma.delivery.findFirst.mockResolvedValueOnce({
        ...mockDelivery,
        status
      });

      await expect(
        deliveryService.updateShipment('del_123', { name: 'New Name' }, { id: 'user_seller_1', role: 'SELLER' })
      ).rejects.toThrow(`Cannot edit shipment in ${status} state. Edits are only permitted before courier pickup.`);

      expect(axiosPostSpy).not.toHaveBeenCalled();
    });
  });

  describe('5. Ownership & Authorization Checks', () => {
    it('allows ADMIN to edit any shipment', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValueOnce(mockDelivery);
      axiosPostSpy.mockResolvedValueOnce({ status: 200, data: { status: true } });

      const res = await deliveryService.updateShipment(
        'del_123',
        { name: 'Admin Edited Name' },
        { id: 'admin_user', role: 'ADMIN' }
      );

      expect(res.success).toBe(true);
    });

    it('allows owning SELLER to edit their own shipment', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValueOnce(mockDelivery);
      axiosPostSpy.mockResolvedValueOnce({ status: 200, data: { status: true } });

      const res = await deliveryService.updateShipment(
        'del_123',
        { name: 'Seller Edited Name' },
        { id: 'user_seller_1', role: 'SELLER' }
      );

      expect(res.success).toBe(true);
    });

    it('rejects another SELLER attempting to edit someone else shipment (403)', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValueOnce(mockDelivery);

      await expect(
        deliveryService.updateShipment(
          'del_123',
          { name: 'Malicious Edit' },
          { id: 'user_seller_999', role: 'SELLER', sellerId: 'seller_999' }
        )
      ).rejects.toThrow('You do not have permission to edit this shipment');

      expect(axiosPostSpy).not.toHaveBeenCalled();
    });

    it('rejects CUSTOMER attempting to edit shipment (403)', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValueOnce(mockDelivery);

      await expect(
        deliveryService.updateShipment(
          'del_123',
          { name: 'Customer Edit' },
          { id: 'customer_1', role: 'CUSTOMER' }
        )
      ).rejects.toThrow('You do not have permission to edit this shipment');
    });
  });

  describe('6. Database Consistency & Audit Logging', () => {
    it('synchronizes address, invalidates shipping label, and writes audit logs on Delhivery success', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValueOnce(mockDelivery);
      checkServiceabilitySpy.mockResolvedValueOnce({ serviceable: true });
      axiosPostSpy.mockResolvedValueOnce({ status: 200, data: { status: true, remark: 'updated' } });

      const result = await deliveryService.updateShipment(
        'del_123',
        {
          name: 'Updated Recipient',
          address: 'New Street 456',
          pin: '680002',
          city: 'Kochi',
          state: 'Kerala',
          phone: '9876543210'
        },
        { id: 'user_seller_1', role: 'SELLER' }
      );

      expect(result.success).toBe(true);
      expect(result.waybill).toBe('56047210000571');

      // Verifies Address was updated
      expect(mockPrisma.address.update).toHaveBeenCalledWith({
        where: { id: 'addr_123' },
        data: expect.objectContaining({
          fullName: 'Updated Recipient',
          addressLine1: 'New Street 456',
          postalCode: '680002',
          city: 'Kochi',
          state: 'Kerala',
          phone: '9876543210'
        })
      });

      // Verifies Delivery updated with label refresh
      expect(mockPrisma.delivery.update).toHaveBeenCalledWith({
        where: { id: 'del_123' },
        data: expect.objectContaining({
          updatedAt: expect.any(Date)
        })
      });

      // Verifies OrderShipmentLog
      expect(mockPrisma.orderShipmentLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId: 'ord_123',
          event: 'Shipment Edited',
          awbNumber: '56047210000571'
        })
      });

      // Verifies that DeliveryTrackingEvent is NOT created (shipment edits do not simulate delivery status transitions)
      expect(mockPrisma.deliveryTrackingEvent.create).not.toHaveBeenCalled();


      // Verifies IntegrationLog
      expect(mockPrisma.integrationLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          service: 'Delhivery',
          event: 'SHIPMENT_EDIT',
          status: 'SUCCESS'
        })
      });
    });

    it('does NOT modify database if Delhivery rejects the edit (400 / error)', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValueOnce(mockDelivery);
      axiosPostSpy.mockRejectedValueOnce({
        response: { status: 400, data: { error: 'Invalid waybill state at Delhivery' } },
        message: 'Request failed with status code 400'
      });

      await expect(
        deliveryService.updateShipment(
          'del_123',
          { name: 'Failed Name' },
          { id: 'user_seller_1', role: 'SELLER' }
        )
      ).rejects.toThrow('Delhivery Shipment Edit error: Invalid waybill state at Delhivery');

      expect(mockPrisma.address.update).not.toHaveBeenCalled();
      expect(mockPrisma.delivery.update).not.toHaveBeenCalled();
      expect(mockPrisma.orderShipmentLog.create).not.toHaveBeenCalled();
    });

    it('does NOT modify database if Delhivery times out, and records ambiguous timeout log', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValueOnce(mockDelivery);
      const timeoutErr = new Error('timeout of 5000ms exceeded');
      timeoutErr.code = 'ECONNABORTED';
      axiosPostSpy.mockRejectedValueOnce(timeoutErr);

      await expect(
        deliveryService.updateShipment(
          'del_123',
          { name: 'Timeout Name' },
          { id: 'user_seller_1', role: 'SELLER' }
        )
      ).rejects.toThrow('Delhivery Shipment Edit error: timeout of 5000ms exceeded');

      expect(mockPrisma.address.update).not.toHaveBeenCalled();
      expect(mockPrisma.delivery.update).not.toHaveBeenCalled();
      expect(mockPrisma.integrationLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          service: 'Delhivery',
          event: 'SHIPMENT_EDIT',
          status: 'AMBIGUOUS_TIMEOUT'
        })
      });
    });

    it('reconciles and alerts when Delhivery succeeds but local DB update fails', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValueOnce(mockDelivery);
      axiosPostSpy.mockResolvedValueOnce({ status: 200, data: { status: true } });
      mockPrisma.delivery.update.mockRejectedValueOnce(new Error('Postgres connection severed'));

      let caughtErr = null;
      try {
        await deliveryService.updateShipment(
          'del_123',
          { name: 'Updated Recipient' },
          { id: 'user_seller_1', role: 'SELLER' }
        );
      } catch (err) {
        caughtErr = err;
      }

      expect(caughtErr).not.toBeNull();
      expect(caughtErr.errorCode).toBe('POST_DELHIVERY_DB_SYNC_FAILED');
      expect(caughtErr.meta?.updatedOnDelhivery).toBe(true);
      expect(caughtErr.meta?.waybill).toBe('56047210000571');

      // Verifies that a reconciliation integration log was written
      expect(mockPrisma.integrationLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          service: 'Delhivery',
          event: 'SHIPMENT_EDIT_DB_FAILED',
          status: 'NEEDS_RECONCILIATION'
        })
      });
    });
  });

  describe('8. Address-Only Updates & Pincode Reuse', () => {
    beforeEach(() => {
      mockPrisma.delivery.findFirst.mockResolvedValue(mockDelivery);
    });

    it('uses existing destination pincode for serviceability when address/city/state changes without a new pin', async () => {
      checkServiceabilitySpy.mockResolvedValueOnce({ serviceable: true });
      axiosPostSpy.mockResolvedValueOnce({ status: 200, data: { status: true } });

      const res = await deliveryService.updateShipment(
        'del_123',
        { address: 'New Street Lane 4' },
        { id: 'user_seller_1', role: 'SELLER' }
      );

      expect(res.success).toBe(true);
      // Existing pincode in mockDelivery is 680001
      expect(checkServiceabilitySpy).toHaveBeenCalledWith('680001', { productType: 'B2C' });
    });


    it('rejects address change if existing destination pincode is missing or invalid without calling Delhivery serviceability', async () => {
      const deliveryWithBadPin = {
        ...mockDelivery,
        order: {
          ...mockDelivery.order,
          address: {
            ...mockDelivery.order.address,
            postalCode: '000000' // Invalid Indian PIN
          }
        }
      };
      mockPrisma.delivery.findFirst.mockResolvedValueOnce(deliveryWithBadPin);

      await expect(
        deliveryService.updateShipment(
          'del_123',
          { city: 'Mumbai' },
          { id: 'user_seller_1', role: 'SELLER' }
        )
      ).rejects.toThrow('A valid 6-digit destination pincode is required for address updates');

      expect(checkServiceabilitySpy).not.toHaveBeenCalled();
      expect(axiosPostSpy).not.toHaveBeenCalled();
    });
  });
});


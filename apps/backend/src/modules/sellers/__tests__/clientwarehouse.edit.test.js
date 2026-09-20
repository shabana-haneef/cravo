import { jest } from '@jest/globals';
import { AppError } from '../../../shared/errors/AppError.js';

const mockRedis = {
  isOpen: true,
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  zRemRangeByScore: jest.fn().mockResolvedValue(1),
  zCard: jest.fn().mockResolvedValue(0),
  zAdd: jest.fn().mockResolvedValue(1),
  expire: jest.fn().mockResolvedValue(1),
};

const mockPrisma = {
  seller: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  integrationLog: {
    create: jest.fn().mockResolvedValue({}),
  },
  $transaction: jest.fn()
};

const mockDelhiveryShipmentService = {
  editClientWarehouse: jest.fn()
};

await jest.unstable_mockModule('../../../config/redis.js', () => ({
  redis: mockRedis,
  pubClient: mockRedis,
  subClient: mockRedis
}));

await jest.unstable_mockModule('../../../lib/prisma.js', () => ({
  default: mockPrisma
}));

await jest.unstable_mockModule('../../delivery/services/delhiveryShipmentService.js', () => ({
  delhiveryShipmentService: mockDelhiveryShipmentService
}));

const { sellerService } = await import('../services/seller.service.js');

describe('Delhivery Client Warehouse Updation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSeller = {
    id: 'seller_123',
    userId: 'user_123',
    pickupLocationName: 'Cravo Artisans',
    delhiveryRegistrationStatus: 'REGISTERED'
  };

  it('rejects update if pincode is missing or invalid', async () => {
    mockPrisma.seller.findUnique.mockResolvedValue(mockSeller);
    await expect(sellerService.editPickupLocation('user_123', { address: 'new address' }, '1.1.1.1'))
      .rejects.toThrow(/valid 6-digit pincode is required/);
    
    await expect(sellerService.editPickupLocation('user_123', { pincode: '123' }, '1.1.1.1'))
      .rejects.toThrow(/valid 6-digit pincode is required/);
  });

  it('successfully updates warehouse and local DB on Delhivery success', async () => {
    mockPrisma.seller.findUnique.mockResolvedValue(mockSeller);
    mockDelhiveryShipmentService.editClientWarehouse.mockResolvedValue({ success: true });
    mockRedis.set.mockResolvedValue('OK'); // Lock acquired

    await sellerService.editPickupLocation('user_123', { pincode: '110001', streetAddress: 'New Addr' }, '1.1.1.1');

    expect(mockDelhiveryShipmentService.editClientWarehouse).toHaveBeenCalledWith(
      mockSeller, 
      { pincode: '110001', streetAddress: 'New Addr' }, 
      '1.1.1.1'
    );
    expect(mockPrisma.seller.update).toHaveBeenCalledWith({
      where: { id: mockSeller.id },
      data: { pickupPincode: '110001', pickupAddress: 'New Addr' }
    });
    expect(mockRedis.del).toHaveBeenCalled(); // Lock released
  });

  it('logs NEEDS_RECONCILIATION if Delhivery succeeds but local DB fails', async () => {
    mockPrisma.seller.findUnique.mockResolvedValue(mockSeller);
    mockDelhiveryShipmentService.editClientWarehouse.mockResolvedValue({ success: true });
    mockPrisma.seller.update.mockRejectedValue(new Error('DB Connection Error'));
    
    await expect(sellerService.editPickupLocation('user_123', { pincode: '110001' }, '1.1.1.1'))
      .rejects.toThrow(/failed to sync locally/);

    expect(mockPrisma.integrationLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: 'NEEDS_RECONCILIATION',
        event: 'CLIENT_WAREHOUSE_UPDATE'
      })
    }));
  });

  it('logs AMBIGUOUS_TIMEOUT and does not touch DB if Delhivery times out', async () => {
    mockPrisma.seller.findUnique.mockResolvedValue(mockSeller);
    const timeoutError = new AppError('Delhivery Warehouse Edit timed out', 504, 'AMBIGUOUS_TIMEOUT');
    mockDelhiveryShipmentService.editClientWarehouse.mockRejectedValue(timeoutError);
    
    await expect(sellerService.editPickupLocation('user_123', { pincode: '110001' }, '1.1.1.1'))
      .rejects.toThrow(/timed out/);

    expect(mockPrisma.seller.update).not.toHaveBeenCalled();
    expect(mockPrisma.integrationLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: 'AMBIGUOUS_TIMEOUT',
        event: 'CLIENT_WAREHOUSE_UPDATE'
      })
    }));
  });

  it('fails with CONCURRENT_OPERATION if lock cannot be acquired', async () => {
    mockPrisma.seller.findUnique.mockResolvedValue(mockSeller);
    mockRedis.set.mockResolvedValue(null); // Lock failed to acquire

    await expect(sellerService.editPickupLocation('user_123', { pincode: '110001' }, '1.1.1.1'))
      .rejects.toThrow('Warehouse edit operation is already in progress');

    expect(mockDelhiveryShipmentService.editClientWarehouse).not.toHaveBeenCalled();
  });

  it('enforces immutability of pickupLocationName in updateStoreProfile', async () => {
    const mockTxSeller = { ...mockSeller };
    const mockTx = {
      seller: { findUnique: jest.fn().mockResolvedValue(mockTxSeller), update: jest.fn() },
      shop: { update: jest.fn() }
    };
    mockPrisma.$transaction.mockImplementation(async (cb) => cb(mockTx));

    await expect(sellerService.updateStoreProfile('user_123', { locationName: 'New Name' }))
      .rejects.toThrow(/Cannot change pickup location name/);

    expect(mockTx.seller.update).not.toHaveBeenCalled();
  });
});

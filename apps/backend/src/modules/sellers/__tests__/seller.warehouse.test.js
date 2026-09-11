import { jest } from '@jest/globals';

const mockPrisma = {
  seller: {
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn()
  }
};

const mockDelhiveryService = {
  createClientWarehouse: jest.fn(),
};

await jest.unstable_mockModule('../../../lib/prisma.js', () => ({
  default: mockPrisma
}));

await jest.unstable_mockModule('../../delivery/services/delhivery.service.js', () => ({
  delhiveryService: mockDelhiveryService
}));

// Import services AFTER mocking
const { sellerService } = await import('../services/seller.service.js');
const { AppError } = await import('../../../shared/errors/AppError.js');

describe('sellerService - Delhivery Warehouse Creation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw an error if seller does not exist', async () => {
    mockPrisma.seller.findUnique.mockResolvedValue(null);
    await expect(sellerService.createDelhiveryWarehouse('sel_1')).rejects.toThrow(AppError);
    await expect(sellerService.createDelhiveryWarehouse('sel_1')).rejects.toThrow('Seller not found');
  });

  it('should throw an error if seller is not APPROVED', async () => {
    mockPrisma.seller.findUnique.mockResolvedValue({ status: 'PENDING' });
    await expect(sellerService.createDelhiveryWarehouse('sel_1')).rejects.toThrow('Seller must be approved to create a warehouse');
  });

  it('should create warehouse successfully when seller is approved', async () => {
    const mockSeller = {
      id: 'sel_123',
      businessName: 'Super Mart',
      status: 'APPROVED',
      pickupLocationName: 'SuperMart_WH',
      pickupAddress: '123 Main St',
      pickupCity: 'Mumbai',
      pickupState: 'MH',
      pickupPincode: '400001',
      pickupCountry: 'India',
      pickupPhone: '9876543210',
      supportEmail: 'contact@supermart.com',
      returnAddressSameAsPickup: true,
      user: {
        email: 'user@test.com',
        phone: '1234567890'
      }
    };

    mockPrisma.seller.findUnique.mockResolvedValue(mockSeller);
    
    mockDelhiveryService.createClientWarehouse.mockResolvedValue({
      success: true,
      data: { success: true, message: 'Warehouse created' }
    });

    mockPrisma.seller.update.mockResolvedValue({ ...mockSeller, delhiveryWarehouseName: 'SuperMart_WH' });

    const result = await sellerService.createDelhiveryWarehouse('sel_123');

    expect(mockDelhiveryService.createClientWarehouse).toHaveBeenCalledWith({
      name: 'SuperMart_WH',
      email: 'contact@supermart.com',
      phone: '9876543210',
      address: '123 Main St',
      city: 'Mumbai',
      country: 'India',
      pin: '400001',
      return_address: '123 Main St',
      return_pin: '400001',
      return_city: 'Mumbai',
      return_state: 'MH',
      return_country: 'India'
    });

    expect(mockPrisma.seller.update).toHaveBeenCalledWith({
      where: { id: 'sel_123' },
      data: {
        delhiveryWarehouseName: 'SuperMart_WH',
        delhiveryRegistrationStatus: 'REGISTERED'
      }
    });

    expect(result.delhiveryWarehouseName).toBe('SuperMart_WH');
  });

  it('should handle API failure from Delhivery', async () => {
    mockPrisma.seller.findUnique.mockResolvedValue({
      id: 'sel_123',
      businessName: 'Super Mart',
      status: 'APPROVED',
      user: {}
    });

    mockDelhiveryService.createClientWarehouse.mockResolvedValue({
      success: false,
      data: { success: false, error: 'Name already exists' }
    });

    await expect(sellerService.createDelhiveryWarehouse('sel_123')).rejects.toThrow('Failed to create warehouse at Delhivery');
  });
});

import { addressRepository } from '../repositories/address.repository.js';
import prisma from '../../../lib/prisma.js';
import { AppError } from '../../../shared/errors/AppError.js';

export const addressService = {
  /**
   * Creates a new address and handles default address toggling inside a transaction
   */
  async createAddress(userId, data) {
    if (data.isDefault) {
      // Transaction: Atomically create the new address and unset others
      return prisma.$transaction(async (tx) => {
        const newAddress = await addressRepository.create({ ...data, userId }, tx);
        await addressRepository.unsetOtherDefaultAddresses(userId, newAddress.id, tx);
        return newAddress;
      });
    } else {
      return addressRepository.create({ ...data, userId });
    }
  },

  async getAddresses(userId) {
    return addressRepository.findByUserId(userId);
  },

  async getAddressById(userId, addressId) {
    // IDOR Protection: Must match both addressId and userId
    const address = await addressRepository.findByIdAndUserId(addressId, userId);
    if (!address) {
      throw new AppError("Address not found or you do not have permission to view it", 404);
    }
    return address;
  },

  async updateAddress(userId, addressId, data) {
    // IDOR Protection
    const address = await addressRepository.findByIdAndUserId(addressId, userId);
    if (!address) {
      throw new AppError("Address not found", 404);
    }

    if (data.isDefault) {
      // Transaction: Update this address to default and unset all others
      return prisma.$transaction(async (tx) => {
        const updated = await addressRepository.update(addressId, data, tx);
        await addressRepository.unsetOtherDefaultAddresses(userId, updated.id, tx);
        return updated;
      });
    } else {
      return addressRepository.update(addressId, data);
    }
  },

  async deleteAddress(userId, addressId) {
    // IDOR Protection
    const address = await addressRepository.findByIdAndUserId(addressId, userId);
    if (!address) {
      throw new AppError("Address not found", 404);
    }

    return addressRepository.delete(addressId);
  }
};

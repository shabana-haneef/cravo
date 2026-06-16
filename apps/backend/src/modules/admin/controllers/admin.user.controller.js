import { userRepository } from '../../users/repositories/user.repository.js';
import { successResponse, errorResponse } from '../../../shared/responses/apiResponse.js';
import { logger } from '../../../shared/services/logger.js';
import prisma from '../../../lib/prisma.js';
import { z } from 'zod';

const updateRoleSchema = z.object({
  role: z.enum(['CUSTOMER', 'SELLER', 'ADMIN'])
});

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
});

export const adminUserController = {
  async listUsers(req, res, next) {
    try {
      const users = await userRepository.findAll();
      return successResponse(res, 'Users retrieved successfully', { users });
    } catch (error) {
      next(error);
    }
  },

  async updateUserRole(req, res, next) {
    try {
      const parsed = updateRoleSchema.safeParse(req.body);
      if (!parsed.success) return errorResponse(res, parsed.error.errors[0].message, 400);

      const user = await userRepository.update(req.params.id, { role: parsed.data.role });
      
      logger.info({ adminId: req.user.id, targetUserId: user.id, newRole: user.role }, 'User role updated by admin');
      
      // Exclude passwordHash before returning
      const { passwordHash, ...safeUser } = user;
      return successResponse(res, 'User role updated successfully', { user: safeUser });
    } catch (error) {
      next(error);
    }
  },

  async updateUserStatus(req, res, next) {
    try {
      const parsed = updateStatusSchema.safeParse(req.body);
      if (!parsed.success) return errorResponse(res, parsed.error.errors[0].message, 400);

      const targetStatus = parsed.data.status;
      const userId = req.params.id;

      const user = await prisma.$transaction(async (tx) => {
        // Update user status
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: { status: targetStatus },
          include: { seller: { include: { shop: true } } }
        });

        if (updatedUser.role === 'SELLER' && updatedUser.seller) {
          const sellerStatus = targetStatus === 'ACTIVE' 
            ? 'APPROVED' 
            : targetStatus === 'SUSPENDED' 
              ? 'SUSPENDED' 
              : 'REJECTED';

          const shopStatus = targetStatus === 'ACTIVE' 
            ? 'ACTIVE' 
            : targetStatus === 'SUSPENDED' 
              ? 'SUSPENDED' 
              : 'INACTIVE';

          // Update Seller record status
          await tx.seller.update({
            where: { id: updatedUser.seller.id },
            data: { status: sellerStatus }
          });

          // Update Shop record status if exists
          if (updatedUser.seller.shop) {
            await tx.shop.update({
              where: { id: updatedUser.seller.shop.id },
              data: { status: shopStatus }
            });
          }
        }

        return updatedUser;
      });

      logger.info({ adminId: req.user.id, targetUserId: user.id, newStatus: user.status }, 'User status updated by admin with seller/shop cascade');
      
      const { passwordHash, ...safeUser } = user;
      return successResponse(res, 'User status updated successfully', { user: safeUser });
    } catch (error) {
      next(error);
    }
  }
};

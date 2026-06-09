import { userRepository } from '../../users/repositories/user.repository.js';
import { successResponse, errorResponse } from '../../../shared/responses/apiResponse.js';
import { logger } from '../../../shared/services/logger.js';
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

      const user = await userRepository.update(req.params.id, { status: parsed.data.status });
      
      logger.info({ adminId: req.user.id, targetUserId: user.id, newStatus: user.status }, 'User status updated by admin');
      
      const { passwordHash, ...safeUser } = user;
      return successResponse(res, 'User status updated successfully', { user: safeUser });
    } catch (error) {
      next(error);
    }
  }
};

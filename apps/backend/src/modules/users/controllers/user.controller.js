import { profileService } from '../services/profile.service.js';
import { profileSchema } from '../validators/profile.validation.js';
import { successResponse, errorResponse } from '../../../shared/responses/apiResponse.js';
import { logger } from '../../../shared/services/logger.js';

export const userController = {
  async getMe(req, res, next) {
    try {
      const data = await profileService.getProfile(req.user.id);
      return successResponse(res, 'Profile retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const parsed = profileSchema.safeParse(req.body);
      if (!parsed.success) {
        return errorResponse(res, parsed.error.errors[0].message, 400);
      }

      const updatedProfile = await profileService.updateProfile(req.user.id, parsed.data);
      logger.info({ userId: req.user.id }, 'User profile updated');
      
      return successResponse(res, 'Profile updated successfully', { profile: updatedProfile });
    } catch (error) {
      next(error);
    }
  }
};

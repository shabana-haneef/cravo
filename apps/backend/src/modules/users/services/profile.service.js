import { userRepository } from '../repositories/user.repository.js';
import { profileRepository } from '../repositories/profile.repository.js';
import { AppError } from '../../../shared/errors/AppError.js';

export const profileService = {
  /**
   * Aggregates the base User record with the extended Profile record
   */
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    const profile = await profileRepository.findByUserId(userId);

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      profile: profile || null
    };
  },

  /**
   * Upserts the user profile
   */
  async updateProfile(userId, profileData) {
    return profileRepository.upsertProfile(userId, profileData);
  }
};

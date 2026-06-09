import prisma from '../../../lib/prisma.js';
import { successResponse } from '../../../shared/responses/apiResponse.js';
import { AppError } from '../../../shared/errors/AppError.js';

import { cloudinaryService } from '../../../shared/services/cloudinary.service.js';

export const adAdminController = {
  /**
   * Create an Ad Package (e.g., "7 Days Basic Banner")
   */
  async createPackage(req, res, next) {
    try {
      const { name, price, durationDays, features } = req.body;
      const adPackage = await prisma.adPackage.create({
        data: { 
          name, 
          price: parseFloat(price), 
          durationDays: parseInt(durationDays),
          features: Array.isArray(features) ? features : (features ? features.split(',').map(f => f.trim()) : [])
        }
      });
      return successResponse(res, 'Ad Package created', adPackage, 201);
    } catch (error) {
      next(error);
    }
  },

  async updatePackage(req, res, next) {
    try {
      const { id } = req.params;
      const { name, price, durationDays, features } = req.body;
      const adPackage = await prisma.adPackage.update({
        where: { id },
        data: { 
          name, 
          price: parseFloat(price), 
          durationDays: parseInt(durationDays),
          features: Array.isArray(features) ? features : (features ? features.split(',').map(f => f.trim()) : [])
        }
      });
      return successResponse(res, 'Ad Package updated', adPackage);
    } catch (error) {
      next(error);
    }
  },

  async deletePackage(req, res, next) {
    try {
      const { id } = req.params;
      await prisma.adPackage.delete({ where: { id } });
      return successResponse(res, 'Ad Package deleted');
    } catch (error) {
      next(error);
    }
  },

  /**
   * List all Ad Packages
   */
  async listPackages(req, res, next) {
    try {
      const packages = await prisma.adPackage.findMany({
        orderBy: { price: 'asc' }
      });
      return successResponse(res, 'Packages retrieved', packages);
    } catch (error) {
      next(error);
    }
  },

  /**
   * List all Advertisements (Seller + Admin ads)
   */
  async listAllAds(req, res, next) {
    try {
      const ads = await prisma.advertisement.findMany({
        include: {
          seller: { include: { user: { select: { email: true, profile: true } } } },
          package: true,
          payment: true
        },
        orderBy: { createdAt: 'desc' }
      });
      return successResponse(res, 'Ads retrieved', ads);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Approve a pending advertisement
   */
  async approveAd(req, res, next) {
    try {
      const { id } = req.params;
      const ad = await prisma.advertisement.findUnique({
        where: { id },
        include: { package: true }
      });
      
      if (!ad) throw new AppError("Advertisement not found", 404);
      if (ad.status !== 'PENDING_APPROVAL') throw new AppError("Ad is not in pending approval state", 400);

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + (ad.package?.durationDays || 7));

      const updatedAd = await prisma.advertisement.update({
        where: { id },
        data: { 
          status: 'ACTIVE',
          startDate,
          endDate,
          rejectionReason: null
        }
      });
      
      return successResponse(res, 'Ad approved and activated', updatedAd);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Reject a pending advertisement
   */
  async rejectAd(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      if (!reason) throw new AppError("Rejection reason is required", 400);

      const updatedAd = await prisma.advertisement.update({
        where: { id },
        data: { 
          status: 'REJECTED',
          rejectionReason: reason
        }
      });
      
      return successResponse(res, 'Ad rejected', updatedAd);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Admin creating their own Free Ad
   */
  async createAdminFreeAd(req, res, next) {
    try {
      const { title, targetUrl, durationDays } = req.body;
      let imageUrl = req.body.imageUrl;

      if (req.file) {
        const uploadResult = await cloudinaryService.uploadBuffer(req.file.buffer, 'advertisements');
        imageUrl = uploadResult.secure_url;
      }

      if (!imageUrl) {
        throw new AppError("Image file or URL is required", 400);
      }
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + parseInt(durationDays || 30)); // default 30 days for admin ad

      const ad = await prisma.advertisement.create({
        data: {
          title,
          imageUrl,
          targetUrl,
          status: 'ACTIVE',
          startDate,
          endDate
        }
      });
      
      return successResponse(res, 'Admin free ad created and activated', ad, 201);
    } catch (error) {
      next(error);
    }
  }
};

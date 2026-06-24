import { delhiveryService } from '../services/delhiveryService.js';
import { logger } from '../shared/services/logger.js';

export const delhiveryController = {
  /**
   * GET /api/delhivery/test
   * Tests connection to Delhivery API and returns clean response.
   */
  async testConnection(req, res, next) {
    try {
      logger.info('Executing Delhivery connection test request.');
      const connected = await delhiveryService.testConnection();

      if (connected) {
        return res.status(200).json({
          success: true,
          message: 'Delhivery connection successful'
        });
      } else {
        return res.status(200).json({
          success: false,
          message: 'Delhivery connection failed'
        });
      }
    } catch (error) {
      logger.error({ err: error.message }, 'Delhivery test endpoint error.');
      return res.status(200).json({
        success: false,
        message: 'Delhivery connection failed'
      });
    }
  },

  /**
   * GET /api/delhivery/serviceability/:pincode
   * Validates pincode format, checks Delhivery serviceability, and returns clean results.
   */
  async checkServiceability(req, res, next) {
    try {
      const { pincode } = req.params;

      // Sanitize and validate pincode format (6 digits, not starting with 0)
      const sanitizedPincode = String(pincode).trim();
      const pincodeRegex = /^[1-9][0-9]{5}$/;

      if (!pincodeRegex.test(sanitizedPincode)) {
        logger.warn({ pincode }, 'Invalid pincode format provided.');
        return res.status(400).json({
          success: false,
          message: 'Invalid pincode format. Must be a 6-digit numeric code.'
        });
      }

      logger.info({ pincode: sanitizedPincode }, 'Checking Delhivery pincode serviceability.');
      const result = await delhiveryService.checkServiceability(sanitizedPincode);

      return res.status(200).json({
        success: true,
        deliverable: result.deliverable,
        pincode: sanitizedPincode
      });
    } catch (error) {
      logger.error({ err: error.message }, 'Error in Delhivery serviceability controller.');
      return res.status(500).json({
        success: false,
        message: error.message || 'An error occurred during serviceability check.'
      });
    }
  }
};

import { delhiveryService } from '../services/delhiveryService.js';
import { logger } from '../../../shared/services/logger.js';

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
   * GET /api/v1/delhivery/serviceability/:pincode
   * Supports ?productType=Heavy or ?productType=B2C (default)
   * Validates pincode & product type format, checks Delhivery serviceability, and returns clean results.
   */
  async checkServiceability(req, res, next) {
    try {
      const { pincode } = req.params;
      const productType = req.query.productType || req.query.product_type || (req.path.includes('/heavy') ? 'Heavy' : 'B2C');

      // Sanitize and validate pincode format (6 digits, not starting with 0)
      const sanitizedPincode = String(pincode || '').trim();
      const pincodeRegex = /^[1-9][0-9]{5}$/;

      if (!pincodeRegex.test(sanitizedPincode)) {
        logger.warn({ pincode }, 'Invalid pincode format provided.');
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PINCODE',
            message: 'Please provide a valid 6-digit pincode.'
          }
        });
      }

      // Validate productType parameter
      const normalizedProductType = String(productType).trim();
      if (!/^(b2c|normal|heavy)$/i.test(normalizedProductType)) {
        logger.warn({ productType }, 'Invalid product type provided.');
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PRODUCT_TYPE',
            message: "Invalid product type. Supported types are 'B2C' and 'Heavy'."
          }
        });
      }

      logger.info({ pincode: sanitizedPincode, productType: normalizedProductType }, 'Checking Delhivery pincode serviceability.');
      const result = await delhiveryService.checkServiceability(sanitizedPincode, {
        productType: normalizedProductType
      });

      return res.status(200).json({
        success: true,
        deliverable: result.deliverable,
        pincode: result.pincode,
        data: result
      });
    } catch (error) {
      logger.error({ err: error.message, code: error.code, statusCode: error.statusCode }, 'Error in Delhivery serviceability controller.');

      if (error.statusCode === 400 || error.code === 'INVALID_PINCODE' || error.code === 'INVALID_PRODUCT_TYPE') {
        return res.status(400).json({
          success: false,
          error: {
            code: error.code || 'BAD_REQUEST',
            message: error.message
          }
        });
      }

      if (error.statusCode === 503 || error.code === 'DELHIVERY_SERVICE_UNAVAILABLE') {
        return res.status(503).json({
          success: false,
          error: {
            code: 'DELHIVERY_SERVICE_UNAVAILABLE',
            message: 'Delivery availability could not be verified right now.'
          }
        });
      }

      return res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'SERVICEABILITY_ERROR',
          message: error.message || 'An error occurred during serviceability check.'
        }
      });
    }
  },

  /**
   * GET /api/v1/delhivery/shipping-cost
   * Strictly read-only Delhivery rate calculation for sellers/admins.
   */
  async calculateShippingCost(req, res, next) {
    try {
      const {
        originPincode,
        destinationPincode,
        weightGrams,
        mode = 'S'
      } = req.query;

      if (!originPincode || !destinationPincode || !weightGrams) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PARAMETERS',
            message: 'originPincode, destinationPincode, and weightGrams are required.'
          }
        });
      }

      const parsedWeight = parseInt(weightGrams, 10);

      logger.info({ originPincode, destinationPincode, weightGrams: parsedWeight, mode }, 'Delhivery rate calculation requested.');
      
      const result = await delhiveryService.calculateShippingCost({
        originPincode: String(originPincode).trim(),
        destinationPincode: String(destinationPincode).trim(),
        weightGrams: parsedWeight,
        mode: String(mode).toUpperCase(),
        paymentType: 'Pre-paid',
        shipmentStatus: 'Delivered'
      });

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error({ err: error.message, code: error.code, statusCode: error.statusCode }, 'Error in Delhivery shipping cost controller.');

      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: error.code || 'SHIPPING_COST_ERROR',
          message: error.message || 'An error occurred during shipping cost calculation.'
        }
      });
    }
  }
};

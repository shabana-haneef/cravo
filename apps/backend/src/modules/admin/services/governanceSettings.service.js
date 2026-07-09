import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../../../shared/services/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SETTINGS_FILE = path.join(__dirname, '..', '..', '..', 'config', 'governanceSettings.json');

const DEFAULT_SETTINGS = {
  requireSellerApproval: true,
  requireSellerDocumentVerification: true,
  allowSellerReapplication: true,
  requireProductApproval: true,
  reapproveAfterProductUpdate: true,
  allowProductDrafts: true,
  requireEmailVerification: true,
  blockSuspendedUsers: true,
  allowNewCustomerRegistrations: true,
  allowNewSellerApplications: true,
  allowNewProductSubmissions: true
};

import { z } from 'zod';

const governanceSettingsSchema = z.object({
  requireSellerApproval: z.boolean(),
  requireSellerDocumentVerification: z.boolean(),
  allowSellerReapplication: z.boolean(),
  requireProductApproval: z.boolean(),
  reapproveAfterProductUpdate: z.boolean(),
  allowProductDrafts: z.boolean(),
  requireEmailVerification: z.boolean(),
  blockSuspendedUsers: z.boolean(),
  allowNewCustomerRegistrations: z.boolean(),
  allowNewSellerApplications: z.boolean(),
  allowNewProductSubmissions: z.boolean()
}).strict();

export const governanceSettingsService = {
  async get() {
    try {
      const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (error) {
      if (error.code === 'ENOENT') {
        await this.save(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }
      logger.error({ err: error }, 'Failed to read governance settings file');
      return DEFAULT_SETTINGS;
    }
  },

  async save(settings) {
    try {
      const parsed = governanceSettingsSchema.parse(settings);
      const dir = path.dirname(SETTINGS_FILE);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(SETTINGS_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
      return parsed;
    } catch (error) {
      logger.error({ err: error }, 'Failed to save governance settings file');
      throw error;
    }
  },

  validate(settings) {
    const parsed = governanceSettingsSchema.safeParse(settings);
    if (!parsed.success) {
      return {
        isValid: false,
        errors: parsed.error.errors.map(e => e.message)
      };
    }
    return {
      isValid: true,
      errors: []
    };
  }
};

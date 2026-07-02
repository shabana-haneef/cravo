import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

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
      console.error('Failed to read governance settings file:', error);
      return DEFAULT_SETTINGS;
    }
  },

  async save(settings) {
    try {
      const dir = path.dirname(SETTINGS_FILE);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
      return settings;
    } catch (error) {
      console.error('Failed to save governance settings file:', error);
      throw error;
    }
  },

  validate(settings) {
    // All parameters are booleans, so simple check
    const errors = [];
    const fields = Object.keys(DEFAULT_SETTINGS);

    for (const field of fields) {
      if (typeof settings[field] !== 'boolean') {
        errors.push(`Field '${field}' must be a boolean value.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

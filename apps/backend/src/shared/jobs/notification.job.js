import { createQueue, createWorker } from '../utils/queue.manager.js';
import { logger } from '../services/logger.js';
import { emailService } from '../../modules/auth/services/email.service.js';
import prisma from '../../lib/prisma.js';

export const notificationQueue = createQueue('notifications');

// Worker implementation
const processNotification = async (job) => {
  const { userId, type, payload } = job.data;
  
  // 1. Fetch Notification Preferences
  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId }
  });

  // Default to true for everything if no preferences are found, except marketing
  const settings = prefs || {
    orderEmails: true,
    inventoryAlerts: true,
    payoutEmails: true,
    securityAlerts: true,
    marketingEmails: false
  };

  // 2. Route by type
  switch (type) {
    case 'ORDER':
      if (!settings.orderEmails) {
        logger.info({ userId, jobId: job.id }, 'Skipping order email due to preferences');
        return;
      }
      // Assuming payload has { to, subject, html } or specific email format
      // In a full implementation, you might have emailService.sendOrderEmail()
      break;
    
    case 'INVENTORY':
      if (!settings.inventoryAlerts) {
        logger.info({ userId, jobId: job.id }, 'Skipping inventory email due to preferences');
        return;
      }
      // Handle inventory email
      break;

    case 'PAYOUT':
      if (!settings.payoutEmails) {
        logger.info({ userId, jobId: job.id }, 'Skipping payout email due to preferences');
        return;
      }
      // Handle payout email
      break;

    case 'SECURITY':
      // Always send security emails, overriding preferences
      if (payload.action === 'BANK_UPDATE') {
        await emailService.sendBankAccountUpdateEmail(payload.to, payload.otp);
      }
      // other security actions
      break;

    case 'MARKETING':
      if (!settings.marketingEmails) {
        logger.info({ userId, jobId: job.id }, 'Skipping marketing email due to preferences');
        return;
      }
      break;

    default:
      logger.warn({ type }, 'Unknown notification type');
  }
};

export const notificationWorker = createWorker('notifications', processNotification, {
  concurrency: 5,
  limiter: {
    max: 10,
    duration: 1000 // 10 jobs per second max to avoid rate limits
  }
});

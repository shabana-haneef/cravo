import { Router } from 'express';
import { adminSellerController } from '../controllers/admin.seller.controller.js';
import { adminUserController } from '../controllers/admin.user.controller.js';
import { adminDashboardController } from '../controllers/admin.dashboard.controller.js';
import { categoryController } from '../../categories/controllers/category.controller.js';
import { adminProductController } from '../controllers/admin.product.controller.js';
import { systemController } from '../controllers/system.controller.js';
import { auditController } from '../controllers/audit.controller.js';
import { settingsController } from '../controllers/settings.controller.js';
import { healthController } from '../controllers/health.controller.js';
import { protect } from '../../../shared/middleware/auth.middleware.js';
import { allowRoles } from '../../../shared/middleware/role.middleware.js';

const router = Router();

// Protect all admin routes
router.use(protect);
router.use(allowRoles('ADMIN'));

// Dashboard & Settings
router.get('/dashboard/stats', adminDashboardController.getStats);
router.get('/settings', adminDashboardController.getSettings);
router.put('/settings', adminDashboardController.updateSettings);

// User Management
router.get('/users', adminUserController.listUsers);
router.patch('/users/:id/role', adminUserController.updateUserRole);
router.patch('/users/:id/status', adminUserController.updateUserStatus);


// Seller Applications
router.get('/seller-applications', adminSellerController.listApplications);
router.get('/seller-applications/:id', adminSellerController.getApplication);
router.patch('/seller-applications/:id/approve', adminSellerController.approveApplication);
router.patch('/seller-applications/:id/reject', adminSellerController.rejectApplication);
router.post('/seller-applications/:id/warehouse', adminSellerController.createWarehouse);

// Category Admin
router.post('/categories', categoryController.createCategory);
router.get('/categories', categoryController.getCategories);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// Product Review Admin
router.get('/products/pending', adminProductController.getPending);
router.patch('/products/:id/approve', adminProductController.approve);
router.patch('/products/:id/reject', adminProductController.reject);
router.delete('/products/:id', adminProductController.deleteProduct);

// Quick Actions & Diagnostics
router.post('/quick-actions/clear-cache', systemController.clearCache);
router.post('/quick-actions/backup', systemController.triggerBackup);
router.get('/quick-actions/backups', systemController.listBackups);
router.get('/quick-actions/backups/:fileName/download', systemController.downloadBackup);
router.get('/quick-actions/health', healthController.getHealth);
router.get('/audit-logs', auditController.getAuditLogs);
router.get('/audit-logs/stats', auditController.getAuditStats);
router.get('/audit-logs/export', auditController.exportAuditLogs);
router.post('/integrations/:service/test', healthController.testConnection);
router.get('/integrations/logs', healthController.getIntegrationLogs);

// Order Settings Configuration Panel
router.get('/settings/orders', settingsController.getOrderSettings);
router.put('/settings/orders', settingsController.updateOrderSettings);

// Delivery Settings Configuration Panel
router.get('/settings/delivery', settingsController.getDeliverySettings);
router.put('/settings/delivery', settingsController.updateDeliverySettings);
router.get('/settings/delivery/analytics', healthController.getDeliveryAnalytics);
router.get('/settings/delivery/integration-info', healthController.getDelhiveryIntegrationInfo);

// Governance Settings Configuration Panel
router.get('/settings/governance', settingsController.getGovernanceSettings);
router.put('/settings/governance', settingsController.updateGovernanceSettings);
router.get('/settings/governance/health', healthController.getMarketplaceHealth);

// Payment Settings Configuration Panel
router.get('/settings/payment', settingsController.getPaymentSettings);
router.put('/settings/payment', settingsController.updatePaymentSettings);
router.get('/settings/payment/health', healthController.getPaymentHealth);

// Inventory Settings Configuration Panel
router.get('/settings/inventory', settingsController.getInventorySettings);
router.put('/settings/inventory', settingsController.updateInventorySettings);
router.get('/settings/inventory/health', healthController.getInventoryHealth);

export default router;

import { Router } from 'express';
import { adminSellerController } from '../controllers/admin.seller.controller.js';
import { adminUserController } from '../controllers/admin.user.controller.js';
import { adminDashboardController } from '../controllers/admin.dashboard.controller.js';
import { categoryController } from '../../categories/controllers/category.controller.js';
import { adminProductController } from '../controllers/admin.product.controller.js';
import { quickActionsController } from '../controllers/quickActions.controller.js';
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

// Category Admin
router.post('/categories', categoryController.createCategory);
router.get('/categories', categoryController.getCategories);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// Product Review Admin
router.get('/products/pending', adminProductController.getPending);
router.patch('/products/:id/approve', adminProductController.approve);
router.patch('/products/:id/reject', adminProductController.reject);

// Quick Actions & Diagnostics
router.post('/quick-actions/clear-cache', quickActionsController.clearCache);
router.post('/quick-actions/backup', quickActionsController.triggerBackup);
router.get('/quick-actions/backups', quickActionsController.listBackups);
router.get('/quick-actions/backups/:fileName/download', quickActionsController.downloadBackup);
router.get('/quick-actions/health', quickActionsController.getHealth);
router.get('/audit-logs', quickActionsController.getAuditLogs);
router.get('/audit-logs/stats', quickActionsController.getAuditStats);
router.get('/audit-logs/export', quickActionsController.exportAuditLogs);
router.post('/integrations/:service/test', quickActionsController.testConnection);
router.get('/integrations/logs', quickActionsController.getIntegrationLogs);

// Order Settings Configuration Panel
router.get('/settings/orders', quickActionsController.getOrderSettings);
router.put('/settings/orders', quickActionsController.updateOrderSettings);

// Delivery Settings Configuration Panel
router.get('/settings/delivery', quickActionsController.getDeliverySettings);
router.put('/settings/delivery', quickActionsController.updateDeliverySettings);
router.get('/settings/delivery/analytics', quickActionsController.getDeliveryAnalytics);
router.get('/settings/delivery/integration-info', quickActionsController.getDelhiveryIntegrationInfo);

// Governance Settings Configuration Panel
router.get('/settings/governance', quickActionsController.getGovernanceSettings);
router.put('/settings/governance', quickActionsController.updateGovernanceSettings);
router.get('/settings/governance/health', quickActionsController.getMarketplaceHealth);

// Payment Settings Configuration Panel
router.get('/settings/payment', quickActionsController.getPaymentSettings);
router.put('/settings/payment', quickActionsController.updatePaymentSettings);
router.get('/settings/payment/health', quickActionsController.getPaymentHealth);

// Inventory Settings Configuration Panel
router.get('/settings/inventory', quickActionsController.getInventorySettings);
router.put('/settings/inventory', quickActionsController.updateInventorySettings);
router.get('/settings/inventory/health', quickActionsController.getInventoryHealth);

export default router;

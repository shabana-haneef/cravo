import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { protect } from '../../../shared/middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/', notificationController.list);
router.get('/unread-count', notificationController.unreadCount);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', notificationController.markRead);

export default router;

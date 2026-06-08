import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { protect } from '../../../shared/middleware/auth.middleware.js';

const router = Router();

router.use(protect); // Secure all user routes

router.get('/me', userController.getMe);
router.put('/profile', userController.updateProfile);

export default router;

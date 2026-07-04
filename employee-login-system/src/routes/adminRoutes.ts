import { Router } from 'express';
import { AdminController } from '../controllers/adminController';

const router = Router();
const adminController = new AdminController();

// Route to view notifications
router.get('/notifications', adminController.viewNotifications);

// Route to view employee work descriptions
router.get('/work-descriptions', adminController.viewWorkDescriptions);

export const adminRoutes = router;
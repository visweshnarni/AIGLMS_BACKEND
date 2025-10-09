// routes/enrollmentRoutes.js
import express from 'express';
import { protectAdmin } from '../middlewares/adminAuth.js';
import { protect } from '../middlewares/authMiddleware.js';

import {
    userRegisterFreeEvent,
    userInitiatePaidEvent,
    adminGetAllEnrollments,
    userGetEnrollments,
} from '../controllers/enrollmentController.js';

const router = express.Router();

// User registers for free event
router.post('/register/free', protect, userRegisterFreeEvent);

// User simulates paid event enrollment (would be payment callback in real flow)
router.post('/register/paid', protect, userInitiatePaidEvent);

// Admin views all enrollments
router.get('/admin', protectAdmin, adminGetAllEnrollments);

// User views their enrollments
router.get('/my', protect, userGetEnrollments);

export default router;

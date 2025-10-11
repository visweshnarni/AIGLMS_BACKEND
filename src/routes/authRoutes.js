import express from 'express';
import { signup, login, getProfile , updateProfile} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { protectAdmin } from '../middlewares/adminAuth.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);

router.put('/me', protect, updateProfile); // PUT /api/auth/me

// For admins: update profile of any user
router.put('/admin/:id', protectAdmin, updateProfile); // PUT /api/auth/admin/:id

// Protected route to get profile (requires a valid token)
router.get('/me', protect, getProfile);

export default router;
import express from 'express';
import { signup, login, getProfile } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected route to get profile (requires a valid token)
router.get('/me', protect, getProfile);

export default router;
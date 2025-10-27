import express from 'express';
import { signup, login, getProfile, updateProfile, forgotPassword, resetPassword } from '../controllers/authController.js'; // <-- Add forgotPassword, resetPassword
import { protect } from '../middlewares/authMiddleware.js';
import { protectAdmin } from '../middlewares/adminAuth.js';
import fileUpload from '../middlewares/staticFileUpload.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword); // <-- NEW ROUTE
router.put('/reset-password/:token', resetPassword); // <-- NEW ROUTE

// Protected routes
router.put('/me', protect, fileUpload, updateProfile);
router.get('/me', protect, getProfile);

// Admin routes (Example, adjust if needed)
router.put('/admin/:id', protectAdmin, fileUpload, updateProfile);

export default router;
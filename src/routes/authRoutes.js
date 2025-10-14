import express from 'express';
import { signup, login, getProfile, updateProfile } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { protectAdmin } from '../middlewares/adminAuth.js';
import fileUpload from '../middlewares/staticFileUpload.js'; // <-- ADD THIS

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// MODIFIED: Added 'fileUpload' middleware to handle the profile photo
router.put('/me', protect, fileUpload, updateProfile);

// MODIFIED: Added 'fileUpload' for admin updates as well
router.put('/admin/:id', protectAdmin, fileUpload, updateProfile);

// Protected route to get profile (no changes)
router.get('/me', protect, getProfile);

export default router;

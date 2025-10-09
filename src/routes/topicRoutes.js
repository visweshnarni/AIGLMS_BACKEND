// routes/topicRoutes.js
import express from 'express';
import { protectAdmin } from '../middlewares/adminAuth.js';
import { protect } from '../middlewares/authMiddleware.js';
import fileUpload from '../middlewares/staticFileUpload.js'; // Multer middleware supporting video & images

import {
    adminCreateTopic,
    adminUpdateTopic,
    adminDeleteTopic,
    userGetTopicsForSession,
} from '../controllers/topicController.js';

const router = express.Router();

// Admin Routes ─ secure & uses file upload middleware allowing video/image
router.post('/admin', protectAdmin, fileUpload, adminCreateTopic);
router.put('/admin/:id', protectAdmin, fileUpload, adminUpdateTopic);
router.delete('/admin/:id', protectAdmin, adminDeleteTopic);

// Public/User routes to get topic list with gated video links
router.get('/event/:eventId/session/:sessionId', protect, userGetTopicsForSession);

export default router;

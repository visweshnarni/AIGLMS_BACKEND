import express from 'express';
import { protectAdmin } from '../middlewares/adminAuth.js';
import { protect } from '../middlewares/authMiddleware.js';

import {
    adminCreateTopic,
    adminUpdateTopic,
    adminDeleteTopic,
    userGetTopicsForSession,
    adminGetAllTopics,
    adminGetTopicById,
    adminGetTopicsBySession,
    adminGetTopicsByEvent,
    userGetTopicsByEvent,
} from '../controllers/topicController.js';

const router = express.Router();

// Admin Routes — remove fileUpload middleware (not needed)
router.post('/admin', protectAdmin, adminCreateTopic);
router.put('/admin/:id', protectAdmin, adminUpdateTopic);
router.delete('/admin/:id', protectAdmin, adminDeleteTopic);

// Admin endpoints
router.get('/admin/all', protectAdmin, adminGetAllTopics);              // Get all topics
router.get('/admin/:id', protectAdmin, adminGetTopicById);              // Get topic by ID
router.get('/admin/session/:sessionId', protectAdmin, adminGetTopicsBySession); // Get by session
router.get('/admin/event/:eventId', protectAdmin, adminGetTopicsByEvent);        // Get by event

// User endpoints (protected)
router.get('/event/:eventId', protect, userGetTopicsByEvent);           // Get all topics for event (gated by status)
router.get('/event/:eventId/session/:sessionId', protect, userGetTopicsForSession); // Get topics for event+session

export default router;

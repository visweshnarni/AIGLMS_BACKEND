import express from 'express';
// We need both middlewares for admin access and user profile check
import { protectAdmin } from '../middlewares/adminAuth.js';
import { protect } from '../middlewares/authMiddleware.js'; 
import eventImageUpload from '../middlewares/staticFileUpload.js'; 
import {
    adminCreateEvent,
    adminGetAllEvents,
    adminUpdateEvent,
    adminDeleteEvent,
    userGetActiveEvents,
    userGetEventDetails,
} from '../controllers/eventController.js';

const router = express.Router();

// =======================================================
// 1. ADMIN MANAGEMENT ROUTES (PROTECTED)
// =======================================================

// POST: Create New Event (Handles image upload via 'image' field)
router.post('/admin', protectAdmin, eventImageUpload, adminCreateEvent); 

// GET: Admin - Get all events (including DRAFTs)
router.get('/admin', protectAdmin, adminGetAllEvents);

// PUT/DELETE: Update or Delete a specific event
router.route('/admin/:id')
    .put(protectAdmin, eventImageUpload, adminUpdateEvent) // <-- NOW CORRECTLY INCLUDES eventImageUpload
    .delete(protectAdmin, adminDeleteEvent);


// =======================================================
// 2. PUBLIC & USER ACCESS ROUTES
// =======================================================

// GET: Public - Get a list of all ACTIVE events for browsing
router.get('/public', userGetActiveEvents);

// GET: Detailed Event View
// Uses 'protect' to optionally load user data (for enrollment check)
router.get('/:id', protect, userGetEventDetails);


export default router;

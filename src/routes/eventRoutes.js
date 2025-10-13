import express from 'express';
// Middlewares
import { protectAdmin } from '../middlewares/adminAuth.js';
import { protect } from '../middlewares/authMiddleware.js';
import eventImageUpload from '../middlewares/staticFileUpload.js';
// Controllers
import {
    adminCreateEvent,
    adminGetAllEvents,
    adminUpdateEvent,
    adminDeleteEvent,
    userGetActiveEvents,
    userGetEventDetails, // The old, simple details endpoint
    userGetPublicEventDetails, // The new, comprehensive details endpoint
    userGetActiveFreeEvents,
    userGetActivePaidEvents,
    userGetRegisteredEvents
} from '../controllers/eventController.js';

const router = express.Router();

// =======================================================
// 1. ADMIN MANAGEMENT ROUTES
// =======================================================
router.route('/admin')
    .post(protectAdmin, eventImageUpload, adminCreateEvent)
    .get(protectAdmin, adminGetAllEvents);

router.route('/admin/:id')
    .put(protectAdmin, eventImageUpload, adminUpdateEvent)
    .delete(protectAdmin, adminDeleteEvent);

// =======================================================
// 2. PUBLIC & USER ACCESS ROUTES
// =======================================================

// GET: Public - List of FREE active events with sorting
router.get('/public/free', userGetActiveFreeEvents);

// GET: Public - List of PAID active events with sorting
router.get('/public/paid', userGetActivePaidEvents);

// NEW: Get comprehensive details for a single event, including sessions and topics
// The 'protect' middleware makes user authentication optional.
router.get('/public/details/:id', protect, userGetPublicEventDetails);

router.get('/registered', protect, userGetRegisteredEvents);


// OLD/DEPRECATED: Simple event details endpoint
router.get('/:id', protect, userGetEventDetails);


export default router;


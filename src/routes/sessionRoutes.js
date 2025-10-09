// routes/sessionRoutes.js
import express from 'express';
import { protectAdmin } from '../middlewares/adminAuth.js';
import {
    adminCreateSession,
    adminUpdateSession,
    adminDeleteSession,
    getEventSessions,
    getSessionDetails
} from '../controllers/sessionController.js';

const router = express.Router();

// --------- ADMIN (protected) ---------------
router.post('/admin', protectAdmin, adminCreateSession);
router.put('/admin/:id', protectAdmin, adminUpdateSession);
router.delete('/admin/:id', protectAdmin, adminDeleteSession);

// ---------- PUBLIC/USER --------------------
// All sessions for an event (eventId param)
router.get('/event/:eventId', getEventSessions);

// Single session details
router.get('/:id', getSessionDetails);

export default router;

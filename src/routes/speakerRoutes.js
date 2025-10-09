// routes/speakerRoutes.js
import express from 'express';
import { protectAdmin } from '../middlewares/adminAuth.js';
import { protect } from '../middlewares/authMiddleware.js';
import speakerImageUpload from '../middlewares/staticFileUpload.js';
import {
    adminCreateSpeaker,
    adminUpdateSpeaker,
    adminDeleteSpeaker,
    userGetAllSpeakers,
    userGetSpeakerDetails,
} from '../controllers/speakerController.js';

const router = express.Router();

// Admin-only routes
router.post('/admin', protectAdmin, speakerImageUpload, adminCreateSpeaker);
router.put('/admin/:id', protectAdmin, speakerImageUpload, adminUpdateSpeaker);
router.delete('/admin/:id', protectAdmin, adminDeleteSpeaker);

// Public & user routes
router.get('/public', userGetAllSpeakers);
router.get('/:id', userGetSpeakerDetails);

export default router;

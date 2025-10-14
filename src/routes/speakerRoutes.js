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
    userGetSpeakerDetailsWithVideos
} from '../controllers/speakerController.js';

const router = express.Router();

// Admin-only routes
router.post('/admin', protectAdmin, speakerImageUpload, adminCreateSpeaker);
router.put('/admin/:id', protectAdmin, speakerImageUpload, adminUpdateSpeaker);
router.delete('/admin/:id', protectAdmin, adminDeleteSpeaker);

// Public & user routes
router.get('/public', userGetAllSpeakers);
router.get('/:id', userGetSpeakerDetails);

// NEW: GET Detailed speaker profile with videos (requires user login)
router.get('/details/:id', protect, userGetSpeakerDetailsWithVideos);

export default router;

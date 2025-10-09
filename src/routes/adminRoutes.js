import express from 'express';

import { adminLogin, getAdminProfile } from '../controllers/adminController.js';
import { protectAdmin } from '../middlewares/adminAuth.js';

const router = express.Router();

router.post('/login', adminLogin);

router.get('/me', protectAdmin, getAdminProfile);

router.get('/dashboard', protectAdmin, (req, res) => {
  res.json({ success: true, message: 'Welcome to the Admin Dashboard!' });
});
export default router;

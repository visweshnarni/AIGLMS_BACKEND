import express from 'express';
import { protectAdmin } from '../middlewares/adminAuth.js';
import { protect } from '../middlewares/authMiddleware.js';
import {
    adminGetAllPayments,
    adminGetPaymentById,
    adminUpdatePayment,
    adminDeletePayment,
    userGetPayments,
} from '../controllers/paymentController.js';

const router = express.Router();

router.get('/my-payments', protect, userGetPayments); // user route comes FIRST

// Admin-only routes
router.get('/', protectAdmin, adminGetAllPayments);
router.get('/:id', protectAdmin, adminGetPaymentById); // param route comes AFTER
router.put('/:id', protectAdmin, adminUpdatePayment);
router.delete('/:id', protectAdmin, adminDeletePayment);



export default router;

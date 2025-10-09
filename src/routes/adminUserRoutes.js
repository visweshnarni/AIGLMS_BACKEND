import express from 'express';
import { protectAdmin } from '../middlewares/adminAuth.js';
import {
    adminGetAllUsers,
    adminGetUserById,
    adminUpdateUser,
    adminDeleteUser
} from '../controllers/adminUserController.js';

const router = express.Router();

router.get('/', protectAdmin, adminGetAllUsers);
router.get('/:id', protectAdmin, adminGetUserById);
router.put('/:id', protectAdmin, adminUpdateUser);
router.delete('/:id', protectAdmin, adminDeleteUser);

export default router;

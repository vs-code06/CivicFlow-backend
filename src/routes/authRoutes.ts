import express from 'express';
import { 
    register, login, logout, getMe, 
    updateProfile, updatePassword, 
    uploadAvatar, googleLogin, 
    forgotPassword, resetPassword 
} from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
import upload from '../middleware/uploadMiddleware';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// @ts-ignore
router.get('/me', protect, getMe);
// @ts-ignore
router.put('/profile', protect, updateProfile);
// @ts-ignore
router.put('/password', protect, updatePassword);
// @ts-ignore
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);

export default router;

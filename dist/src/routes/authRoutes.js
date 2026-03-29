"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const uploadMiddleware_1 = __importDefault(require("../middleware/uploadMiddleware"));
const router = express_1.default.Router();
router.post('/register', authController_1.register);
router.post('/login', authController_1.login);
router.post('/logout', authController_1.logout);
router.post('/google', authController_1.googleLogin);
router.post('/forgot-password', authController_1.forgotPassword);
router.put('/reset-password/:token', authController_1.resetPassword);
// @ts-ignore
router.get('/me', authMiddleware_1.protect, authController_1.getMe);
// @ts-ignore
router.put('/profile', authMiddleware_1.protect, authController_1.updateProfile);
// @ts-ignore
router.put('/password', authMiddleware_1.protect, authController_1.updatePassword);
// @ts-ignore
router.post('/avatar', authMiddleware_1.protect, uploadMiddleware_1.default.single('avatar'), authController_1.uploadAvatar);
exports.default = router;

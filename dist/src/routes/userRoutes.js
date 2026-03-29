"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// @ts-ignore
router.use(authMiddleware_1.protect);
// Personnel-accessible
router.get('/personnel', (0, authMiddleware_1.authorize)('admin', 'personnel'), userController_1.getPersonnel);
// @ts-ignore
router.put('/status', (0, authMiddleware_1.authorize)('personnel'), userController_1.updateStatus);
// Admin-only
router.get('/', (0, authMiddleware_1.authorize)('admin'), userController_1.getAllUsers);
router.get('/leave-requests', (0, authMiddleware_1.authorize)('admin'), userController_1.getLeaveRequests);
router.put('/:id/role', (0, authMiddleware_1.authorize)('admin'), userController_1.updateUserRole);
// @ts-ignore
router.delete('/:id', (0, authMiddleware_1.authorize)('admin'), userController_1.deleteUser);
exports.default = router;

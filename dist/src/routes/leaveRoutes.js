"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const leaveController_1 = require("../controllers/leaveController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// All leave routes require authentication
router.use(authMiddleware_1.protect);
router.route('/')
    .get(leaveController_1.getLeaveRequests) // Admin: all, Personnel: their own
    // @ts-ignore
    .post((0, authMiddleware_1.authorize)('personnel'), leaveController_1.createLeaveRequest);
router.route('/:id')
    // @ts-ignore
    .put((0, authMiddleware_1.authorize)('admin', 'personnel'), leaveController_1.updateLeaveStatus);
exports.default = router;

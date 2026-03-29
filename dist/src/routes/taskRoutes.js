"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const taskController_1 = require("../controllers/taskController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// @ts-ignore
router.use(authMiddleware_1.protect);
// Special routes first (before /:id to avoid conflicts)
router.get('/stats', (0, authMiddleware_1.authorize)('admin'), taskController_1.getTaskStats);
// @ts-ignore
router.get('/my-zone-status', (0, authMiddleware_1.authorize)('resident'), taskController_1.getResidentZoneStatus);
// @ts-ignore
router.post('/dispatch-today', (0, authMiddleware_1.authorize)('admin'), taskController_1.dispatchToday);
// Main CRUD
router.route('/')
    // @ts-ignore
    .get((0, authMiddleware_1.authorize)('admin', 'personnel'), taskController_1.getTasks)
    // @ts-ignore
    .post((0, authMiddleware_1.authorize)('admin'), taskController_1.createTask);
router.route('/:id')
    // @ts-ignore
    .get((0, authMiddleware_1.authorize)('admin', 'personnel'), taskController_1.getTaskById)
    // @ts-ignore
    .put((0, authMiddleware_1.authorize)('admin', 'personnel'), taskController_1.updateTask)
    // @ts-ignore
    .delete((0, authMiddleware_1.authorize)('admin'), taskController_1.deleteTask);
// Personnel-specific task lifecycle
// @ts-ignore
router.post('/:id/accept', (0, authMiddleware_1.authorize)('personnel'), taskController_1.acceptTask);
// @ts-ignore
router.post('/:id/start', (0, authMiddleware_1.authorize)('personnel'), taskController_1.startTask);
// @ts-ignore
router.post('/:id/complete', (0, authMiddleware_1.authorize)('personnel'), taskController_1.completeTask);
exports.default = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const complaintController_1 = require("../controllers/complaintController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// @ts-ignore
router.use(authMiddleware_1.protect);
router.get('/stats', complaintController_1.getComplaintStats);
router.route('/')
    // @ts-ignore
    .get(complaintController_1.getComplaints) // All roles (scoped by role in controller)
    // @ts-ignore
    .post((0, authMiddleware_1.authorize)('resident'), complaintController_1.createComplaint); // Only residents file complaints
router.route('/:id')
    // @ts-ignore
    .get(complaintController_1.getComplaintById)
    // @ts-ignore
    .put((0, authMiddleware_1.authorize)('admin', 'personnel'), complaintController_1.updateComplaint)
    // @ts-ignore
    .delete((0, authMiddleware_1.authorize)('resident'), complaintController_1.deleteComplaint); // Resident can cancel own pending
exports.default = router;

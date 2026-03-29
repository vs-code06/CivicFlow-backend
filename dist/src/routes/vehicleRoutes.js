"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const vehicleController_1 = require("../controllers/vehicleController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Get all (admin + personnel can view), Create (admin only)
router.route('/')
    // @ts-ignore
    .get(authMiddleware_1.protect, (0, authMiddleware_1.authorize)('admin', 'personnel'), vehicleController_1.getVehicles)
    // @ts-ignore
    .post(authMiddleware_1.protect, (0, authMiddleware_1.authorize)('admin'), vehicleController_1.createVehicle);
// Update, Delete (admin only)
router.route('/:id')
    // @ts-ignore
    .put(authMiddleware_1.protect, (0, authMiddleware_1.authorize)('admin'), vehicleController_1.updateVehicle)
    // @ts-ignore
    .delete(authMiddleware_1.protect, (0, authMiddleware_1.authorize)('admin'), vehicleController_1.deleteVehicle);
// Assign driver (admin only)
// @ts-ignore
router.route('/:id/assign').put(authMiddleware_1.protect, (0, authMiddleware_1.authorize)('admin'), vehicleController_1.assignDriver);
exports.default = router;

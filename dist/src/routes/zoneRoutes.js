"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zoneController_1 = require("../controllers/zoneController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// @ts-ignore
router.use(authMiddleware_1.protect);
// GET /zones/my — resident fetches their assigned zone
// @ts-ignore
router.get('/my', (0, authMiddleware_1.authorize)('resident', 'personnel', 'admin'), zoneController_1.getMyZone);
router.route('/')
    .get(zoneController_1.getZones)
    .post((0, authMiddleware_1.authorize)('admin'), zoneController_1.createZone);
router.route('/:id')
    .get(zoneController_1.getZoneById)
    .put((0, authMiddleware_1.authorize)('admin'), zoneController_1.updateZone);
// Schedule management
router.put('/:id/schedule', (0, authMiddleware_1.authorize)('admin'), zoneController_1.updateZoneSchedule);
router.get('/:id/schedule-status', zoneController_1.getZoneScheduleStatus);
router.post('/:id/areas', (0, authMiddleware_1.authorize)('admin'), zoneController_1.addAreaToZone);
exports.default = router;

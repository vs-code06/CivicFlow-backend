"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const analyticsController_1 = require("../controllers/analyticsController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
router.use((0, authMiddleware_1.authorize)('admin'));
router.get('/trends', analyticsController_1.getCollectionTrends);
router.get('/composition', analyticsController_1.getWasteComposition);
router.get('/zone-performance', analyticsController_1.getZonePerformance);
router.get('/metrics', analyticsController_1.getOperationalMetrics);
exports.default = router;

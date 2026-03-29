"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkZoneExists = void 0;
const Zone_1 = __importDefault(require("../models/Zone"));
const checkZoneExists = async (req, res, next) => {
    try {
        const zone = await Zone_1.default.findById(req.params.id);
        if (!zone) {
            return res.status(404).json({ message: 'Zone not found' });
        }
        req.zone = zone;
        next();
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.checkZoneExists = checkZoneExists;

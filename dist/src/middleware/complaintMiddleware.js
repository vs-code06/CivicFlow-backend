"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkComplaintExists = void 0;
const Complaint_1 = __importDefault(require("../models/Complaint"));
const checkComplaintExists = async (req, res, next) => {
    try {
        const complaint = await Complaint_1.default.findById(req.params.id)
            .populate('residentId', 'name email phone avatar')
            .populate('assignedTo', 'name email');
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }
        req.complaint = complaint;
        next();
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.checkComplaintExists = checkComplaintExists;

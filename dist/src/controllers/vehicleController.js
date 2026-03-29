"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignDriver = exports.deleteVehicle = exports.updateVehicle = exports.createVehicle = exports.getVehicles = void 0;
const Vehicle_1 = __importDefault(require("../models/Vehicle"));
const User_1 = __importDefault(require("../models/User"));
const ActivityLog_1 = __importDefault(require("../models/ActivityLog"));
// @desc    Get all vehicles
const getVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle_1.default.find().populate('driverId', 'name email status');
        res.status(200).json(vehicles);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getVehicles = getVehicles;
// @desc    Create a vehicle
const createVehicle = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthenticated' });
        const { vehicleId, type, licensePlate, capacity, status, fuelLevel } = req.body;
        const existing = await Vehicle_1.default.findOne({ vehicleId });
        if (existing) {
            return res.status(400).json({ message: 'Vehicle ID already exists' });
        }
        const vehicle = await Vehicle_1.default.create({
            vehicleId,
            type,
            licensePlate,
            capacity,
            status: status === 'Active' ? 'Available' : (status || 'Available'),
            fuelLevel: fuelLevel || 100,
        });
        await ActivityLog_1.default.create({
            action: 'Vehicle Added',
            user: req.user._id,
            details: `Vehicle ${vehicleId} (${type}) added to fleet`,
            type: 'Info'
        });
        res.status(201).json(vehicle);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.createVehicle = createVehicle;
// @desc    Update a vehicle
const updateVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle_1.default.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }
        const updates = { ...req.body };
        if (!vehicle.driverId && !updates.driverId && updates.status === 'Active') {
            updates.status = 'Available';
        }
        const updated = await Vehicle_1.default.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true
        }).populate('driverId', 'name email status');
        res.status(200).json(updated);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.updateVehicle = updateVehicle;
// @desc    Delete a vehicle
const deleteVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle_1.default.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }
        if (vehicle.driverId) {
            await User_1.default.findByIdAndUpdate(vehicle.driverId, { assignedVehicle: null });
        }
        await vehicle.deleteOne();
        res.status(200).json({ message: 'Vehicle removed' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteVehicle = deleteVehicle;
// @desc    Assign a driver to a vehicle
const assignDriver = async (req, res) => {
    try {
        const { driverId } = req.body;
        const vehicle = await Vehicle_1.default.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }
        if (vehicle.driverId && String(vehicle.driverId) !== String(driverId)) {
            await User_1.default.findByIdAndUpdate(vehicle.driverId, { assignedVehicle: null });
        }
        if (driverId) {
            const driver = await User_1.default.findById(driverId);
            if (!driver) {
                return res.status(404).json({ message: 'Driver not found' });
            }
            if (driver.assignedVehicle && driver.assignedVehicle !== vehicle.vehicleId) {
                await Vehicle_1.default.findOneAndUpdate({ vehicleId: driver.assignedVehicle }, { driverId: null, status: 'Available' });
            }
            vehicle.driverId = driverId;
            vehicle.status = 'Active';
            await vehicle.save();
            await User_1.default.findByIdAndUpdate(driverId, { assignedVehicle: vehicle.vehicleId });
        }
        else {
            if (vehicle.driverId) {
                await User_1.default.findByIdAndUpdate(vehicle.driverId, { assignedVehicle: null });
            }
            vehicle.driverId = null;
            vehicle.status = 'Available';
            await vehicle.save();
        }
        const updated = await Vehicle_1.default.findById(req.params.id).populate('driverId', 'name email status');
        res.status(200).json(updated);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.assignDriver = assignDriver;

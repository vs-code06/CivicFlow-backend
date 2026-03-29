import { Request, Response } from 'express';
import Vehicle, { IVehicle } from '../models/Vehicle';
import User from '../models/User';
import ActivityLog from '../models/ActivityLog';
import { AuthRequest } from '../middleware/authMiddleware';

// @desc    Get all vehicles
export const getVehicles = async (req: Request, res: Response) => {
    try {
        const vehicles = await Vehicle.find().populate('driverId', 'name email status');
        res.status(200).json(vehicles);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a vehicle
export const createVehicle = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });

        const { vehicleId, type, licensePlate, capacity, status, fuelLevel } = req.body;

        const existing = await Vehicle.findOne({ vehicleId });
        if (existing) {
            return res.status(400).json({ message: 'Vehicle ID already exists' });
        }

        const vehicle = await Vehicle.create({
            vehicleId,
            type,
            licensePlate,
            capacity,
            status: status === 'Active' ? 'Available' : (status || 'Available'),
            fuelLevel: fuelLevel || 100,
        });

        await ActivityLog.create({
            action: 'Vehicle Added',
            user: req.user._id,
            details: `Vehicle ${vehicleId} (${type}) added to fleet`,
            type: 'Info'
        });

        res.status(201).json(vehicle);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a vehicle
export const updateVehicle = async (req: Request, res: Response) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }
        
        const updates = { ...req.body };
        if (!vehicle.driverId && !updates.driverId && updates.status === 'Active') {
            updates.status = 'Available';
        }

        const updated = await Vehicle.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true
        }).populate('driverId', 'name email status');

        res.status(200).json(updated);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a vehicle
export const deleteVehicle = async (req: Request, res: Response) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        if (vehicle.driverId) {
            await User.findByIdAndUpdate(vehicle.driverId, { assignedVehicle: null });
        }

        await vehicle.deleteOne();
        res.status(200).json({ message: 'Vehicle removed' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Assign a driver to a vehicle
export const assignDriver = async (req: Request, res: Response) => {
    try {
        const { driverId } = req.body;
        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        if (vehicle.driverId && String(vehicle.driverId) !== String(driverId)) {
            await User.findByIdAndUpdate(vehicle.driverId, { assignedVehicle: null });
        }

        if (driverId) {
            const driver = await User.findById(driverId);
            if (!driver) {
                return res.status(404).json({ message: 'Driver not found' });
            }

            if (driver.assignedVehicle && driver.assignedVehicle !== vehicle.vehicleId) {
                await Vehicle.findOneAndUpdate(
                    { vehicleId: driver.assignedVehicle },
                    { driverId: null, status: 'Available' }
                );
            }

            vehicle.driverId = driverId;
            vehicle.status = 'Active';
            await vehicle.save();

            await User.findByIdAndUpdate(driverId, { assignedVehicle: vehicle.vehicleId });
        } else {
            if (vehicle.driverId) {
                await User.findByIdAndUpdate(vehicle.driverId, { assignedVehicle: null });
            }
            vehicle.driverId = null;
            vehicle.status = 'Available';
            await vehicle.save();
        }

        const updated = await Vehicle.findById(req.params.id).populate('driverId', 'name email status');
        res.status(200).json(updated);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

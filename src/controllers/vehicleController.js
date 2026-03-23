const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

// @desc    Get all vehicles
// @route   GET /api/vehicles
// @access  Private/Admin, Personnel
const getVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find().populate('driverId', 'name email status');
        res.status(200).json(vehicles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a vehicle
// @route   POST /api/vehicles
// @access  Private/Admin
const createVehicle = async (req, res) => {
    try {
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

        const ActivityLog = require('../models/ActivityLog');
        await ActivityLog.create({
            action: 'Vehicle Added',
            user: req.user._id,
            details: `Vehicle ${vehicleId} (${type}) added to fleet`,
            type: 'Info'
        });

        res.status(201).json(vehicle);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a vehicle
// @route   PUT /api/vehicles/:id
// @access  Private/Admin
const updateVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }
        
        const updates = { ...req.body };
        // Clean up mismatching statuses based on driver presence
        if (!vehicle.driverId && !updates.driverId && updates.status === 'Active') {
            updates.status = 'Available';
        }

        const updated = await Vehicle.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true
        }).populate('driverId', 'name email status');

        res.status(200).json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private/Admin
const deleteVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        // Unassign from driver if assigned
        if (vehicle.driverId) {
            await User.findByIdAndUpdate(vehicle.driverId, { assignedVehicle: null });
        }

        await vehicle.deleteOne();
        res.status(200).json({ message: 'Vehicle removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Assign a driver to a vehicle
// @route   PUT /api/vehicles/:id/assign
// @access  Private/Admin
const assignDriver = async (req, res) => {
    try {
        const { driverId } = req.body;
        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        // Unassign previous driver if any
        if (vehicle.driverId && String(vehicle.driverId) !== String(driverId)) {
            await User.findByIdAndUpdate(vehicle.driverId, { assignedVehicle: null });
        }

        if (driverId) {
            // Assign new driver
            const driver = await User.findById(driverId);
            if (!driver) {
                return res.status(404).json({ message: 'Driver not found' });
            }

            // Unassign driver from their previous vehicle if any
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
            // Unassign
            if (vehicle.driverId) {
                await User.findByIdAndUpdate(vehicle.driverId, { assignedVehicle: null });
            }
            vehicle.driverId = null;
            vehicle.status = 'Available';
            await vehicle.save();
        }

        const updated = await Vehicle.findById(req.params.id).populate('driverId', 'name email status');
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    assignDriver
};

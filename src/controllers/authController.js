const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken, setAuthCookie } = require('../utils/token');

// ─── Register ────────────────────────────────────────────────────────────────
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email and password are required' });
        }

        const exists = await User.findOne({ email });
        if (exists) return res.status(409).json({ success: false, message: 'Email already in use' });

        const allowedRoles = ['admin', 'personnel', 'resident'];
        const userRole = allowedRoles.includes(role) ? role : 'resident';

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword, role: userRole });

        const token = signToken(user);
        setAuthCookie(res, token);

        return res.status(201).json({
            success: true,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Login ───────────────────────────────────────────────────────────────────
const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        // If role hint is provided, validate it
        if (role && user.role !== role) {
            return res.status(401).json({ success: false, message: 'Invalid credentials for this role' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const token = signToken(user);
        setAuthCookie(res, token);

        return res.json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                avatar: user.avatar,
                zoneId: user.zoneId,
                address: user.address,
                assignedVehicle: user.assignedVehicle
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Logout ──────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
    res.clearCookie('token', { path: '/' });
    return res.json({ success: true, message: 'Logged out successfully' });
};

// ─── Get Current User ─────────────────────────────────────────────────────────
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password').populate('assignedVehicle', 'vehicleId type licensePlate status');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        return res.json({ success: true, user });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Update Profile ───────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
    try {
        const { name, email, address, zoneId, notificationPreferences } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (email && email !== user.email) {
            const taken = await User.findOne({ email });
            if (taken) return res.status(409).json({ success: false, message: 'Email already in use' });
            user.email = email;
        }

        if (name) user.name = name;
        if (address !== undefined) user.address = address;
        if (zoneId !== undefined) user.zoneId = zoneId;
        if (notificationPreferences) {
            user.notificationPreferences = { ...user.notificationPreferences, ...notificationPreferences };
        }

        const updated = await user.save();
        const token = signToken(updated);
        setAuthCookie(res, token);

        return res.json({
            success: true,
            user: {
                _id: updated._id,
                name: updated.name,
                email: updated.email,
                role: updated.role,
                status: updated.status,
                avatar: updated.avatar,
                zoneId: updated.zoneId,
                address: updated.address
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Update Password ──────────────────────────────────────────────────────────
const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new password required' });
        }

        const user = await User.findById(req.user._id).select('+password');
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        return res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Upload Avatar ────────────────────────────────────────────────────────────
const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { avatar: req.file.path },
            { new: true }
        ).select('-password');

        return res.json({ success: true, avatar: user.avatar, user });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { register, login, logout, getMe, updateProfile, updatePassword, uploadAvatar };

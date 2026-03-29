import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User, { IUser } from '../models/User';
import { signToken, setAuthCookie } from '../utils/token';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail';
import { OAuth2Client } from 'google-auth-library';
import { AuthRequest } from '../middleware/authMiddleware';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Register ────────────────────────────────────────────────────────────────
export const register = async (req: Request, res: Response) => {
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
        const user = await User.create({ name, email, password: hashedPassword, role: userRole as any });

        const token = signToken(user as IUser);
        setAuthCookie(res, token);

        return res.status(201).json({
            success: true,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Login ───────────────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response) => {
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

        const isMatch = await bcrypt.compare(password, user.password!);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const token = signToken(user as IUser);
        setAuthCookie(res, token);

        return res.json({
            success: true,
            token,
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
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Logout ──────────────────────────────────────────────────────────────────
export const logout = async (req: Request, res: Response) => {
    res.clearCookie('token', { path: '/' });
    return res.json({ success: true, message: 'Logged out successfully' });
};

// ─── Get Current User ─────────────────────────────────────────────────────────
export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
        
        const user = await User.findById(req.user._id).select('-password').populate('assignedVehicle', 'vehicleId type licensePlate status');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        return res.json({ success: true, user });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Update Profile ───────────────────────────────────────────────────────────
export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });

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
        const token = signToken(updated as IUser);
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
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Update Password ──────────────────────────────────────────────────────────
export const updatePassword = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });

        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new password required' });
        }

        const user = await User.findById(req.user._id).select('+password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        
        const isMatch = await bcrypt.compare(currentPassword, user.password!);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        return res.json({ success: true, message: 'Password updated successfully' });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Upload Avatar ────────────────────────────────────────────────────────────
export const uploadAvatar = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { avatar: req.file.path },
            { new: true }
        ).select('-password');

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        return res.json({ success: true, avatar: user.avatar, user });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Google Login ─────────────────────────────────────────────────────────────
export const googleLogin = async (req: Request, res: Response) => {
    try {
        const { idToken, role } = req.body;
        if (!idToken) return res.status(400).json({ success: false, message: 'Google ID token required' });

        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        if (!payload) return res.status(400).json({ success: false, message: 'Invalid token payload' });

        const { sub, email, name, picture } = payload;
        let user = await User.findOne({ email });

        if (!user) {
            // Create user
            user = await User.create({
                name,
                email,
                googleId: sub,
                isGoogleUser: true,
                role: role || 'resident',
                avatar: picture
            });
        } else if (!user.isGoogleUser) {
            // Link Google account to existing email
            user.googleId = sub;
            user.isGoogleUser = true;
            if (!user.avatar && picture) user.avatar = picture;
            await user.save();
        }

        const token = signToken(user as IUser);
        setAuthCookie(res, token);

        return res.json({
            success: true,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
        });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Generate token (random string)
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash and set to resetPasswordToken field
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        await user.save();

        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please click the link below to reset your password:\n\n${resetUrl}`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'CivicFlow Password Reset',
                message,
                html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #10b981;">CivicFlow Password Reset</h2>
                    <p>You requested a password reset. Click the button below to set a new password. This link expires in 10 minutes.</p>
                    <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
                    <p style="margin-top: 20px; font-size: 12px; color: #666;">If you didn't request this, please ignore this email.</p>
                </div>`
            });

            res.status(200).json({ success: true, message: 'Email sent successfully' });
        } catch (err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            return res.status(500).json({ success: false, message: 'Email could not be sent' });
        }
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Reset Password ───────────────────────────────────────────────────────────
export const resetPassword = async (req: Request, res: Response) => {
    try {
        // Hash the token from URL
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.token as string).digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: new Date() }
        }).select('+password');

        if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });

        // Security check: Check if new password is same as old one (if they already have one)
        if (user.password) {
            const isSame = await bcrypt.compare(req.body.password, user.password);
            if (isSame) return res.status(400).json({ success: false, message: 'New password cannot be the same as your current password' });
        }

        // Set new password
        user.password = await bcrypt.hash(req.body.password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        const token = signToken(user as IUser);
        setAuthCookie(res, token);

        res.status(200).json({
            success: true,
            message: 'Password reset successful',
            user: { _id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

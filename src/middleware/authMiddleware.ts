import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

export interface AuthRequest extends Request {
    user?: IUser;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        let token = req.cookies.token;

        // Check Authorization header fallback
        if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'Unauthenticated' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

        // Get user from the token
        const user = await User.findById(decoded.id).select('-password').lean();

        if (!user) {
            return res.status(401).json({ message: 'Unauthenticated' });
        }

        req.user = user as any;
        next();
    } catch (error) {
        console.log(error);
        res.status(401).json({ message: 'Unauthenticated' });
    }
};

// Grant access to specific roles
export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

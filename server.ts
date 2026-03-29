import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './src/config/db';

// Routes
import authRoutes from './src/routes/authRoutes';
import taskRoutes from './src/routes/taskRoutes';
import vehicleRoutes from './src/routes/vehicleRoutes';
import userRoutes from './src/routes/userRoutes';
import zoneRoutes from './src/routes/zoneRoutes';
import complaintRoutes from './src/routes/complaintRoutes';
import leaveRoutes from './src/routes/leaveRoutes';
import dashboardRoutes from './src/routes/dashboardRoutes';
import analyticsRoutes from './src/routes/analyticsRoutes';
import chatRoutes from './src/routes/chatRoutes';

// Connect to Database
connectDB();

const app = express();

// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat', chatRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (req: Request, res: Response) => res.json({ success: true, message: 'CivicFlow API is running', version: '2.0.0' }));

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req: Request, res: Response) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('[ERROR]', err.message);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`\n🚀 CivicFlow API running on port ${PORT}`);
    console.log(`   → Auth:       /api/auth`);
    console.log(`   → Tasks:      /api/tasks`);
    console.log(`   → Vehicles:   /api/vehicles`);
    console.log(`   → Users:      /api/users`);
    console.log(`   → Zones:      /api/zones`);
    console.log(`   → Complaints: /api/complaints`);
    console.log(`   → Leaves:     /api/leaves`);
    console.log(`   → Dashboard:  /api/dashboard`);
    console.log(`   → Analytics:  /api/analytics`);
    console.log(`   → Chat:       /api/chat\n`);
});

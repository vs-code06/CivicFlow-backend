require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./src/config/db');

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
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/tasks', require('./src/routes/taskRoutes'));
app.use('/api/vehicles', require('./src/routes/vehicleRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/zones', require('./src/routes/zoneRoutes'));
app.use('/api/complaints', require('./src/routes/complaintRoutes'));
app.use('/api/leaves', require('./src/routes/leaveRoutes'));
app.use('/api/dashboard', require('./src/routes/dashboardRoutes'));
app.use('/api/analytics', require('./src/routes/analyticsRoutes'));
app.use('/api/chat', require('./src/routes/chatRoutes'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ success: true, message: 'CivicFlow API is running', version: '2.0.0' }));

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
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

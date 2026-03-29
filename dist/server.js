"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const db_1 = __importDefault(require("./src/config/db"));
// Routes
const authRoutes_1 = __importDefault(require("./src/routes/authRoutes"));
const taskRoutes_1 = __importDefault(require("./src/routes/taskRoutes"));
const vehicleRoutes_1 = __importDefault(require("./src/routes/vehicleRoutes"));
const userRoutes_1 = __importDefault(require("./src/routes/userRoutes"));
const zoneRoutes_1 = __importDefault(require("./src/routes/zoneRoutes"));
const complaintRoutes_1 = __importDefault(require("./src/routes/complaintRoutes"));
const leaveRoutes_1 = __importDefault(require("./src/routes/leaveRoutes"));
const dashboardRoutes_1 = __importDefault(require("./src/routes/dashboardRoutes"));
const analyticsRoutes_1 = __importDefault(require("./src/routes/analyticsRoutes"));
const chatRoutes_1 = __importDefault(require("./src/routes/chatRoutes"));
// Connect to Database
(0, db_1.default)();
const app = (0, express_1.default)();
// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes_1.default);
app.use('/api/tasks', taskRoutes_1.default);
app.use('/api/vehicles', vehicleRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/zones', zoneRoutes_1.default);
app.use('/api/complaints', complaintRoutes_1.default);
app.use('/api/leaves', leaveRoutes_1.default);
app.use('/api/dashboard', dashboardRoutes_1.default);
app.use('/api/analytics', analyticsRoutes_1.default);
app.use('/api/chat', chatRoutes_1.default);
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

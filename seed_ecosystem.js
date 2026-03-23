const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const bcrypt = require('bcryptjs');
const connectDB = require('./src/config/db');

// Models
const User = require('./src/models/User');
const Zone = require('./src/models/Zone');
const Task = require('./src/models/Task');
const ActivityLog = require('./src/models/ActivityLog');
const Complaint = require('./src/models/Complaint'); // Using Complaint for tickets
const Vehicle = require('./src/models/Vehicle');
const Announcement = require('./src/models/Announcement');

// Data
const { zones } = require('./src/data/zones_Seed');

dotenv.config();
connectDB();

const seedEcosystem = async () => {
    try {
        console.log('🌱 Starting Ecosystem Seeding...'.cyan.bold);

        // 1. CLEAR DATABASE
        await User.deleteMany();
        await Zone.deleteMany();
        await Task.deleteMany();
        await ActivityLog.deleteMany();
        await Complaint.deleteMany();
        await Vehicle.deleteMany();
        await Announcement.deleteMany();
        console.log('🗑️  Database Cleared'.red);

        // 2. SEED ZONES (The Foundation)
        // Using the imported 'zones' data which should have coordinates
        const createdZones = await Zone.insertMany(zones.map(z => ({
            ...z,
            healthScore: 95, // Start high
            status: 'Good',
            currentMetrics: {
                totalCollections: 120,
                perfectCollections: 115,
                contaminatedCollections: 3,
                blockedCollections: 2,
                missedCollections: 0
            },
            efficiencyHistory: [
                // Past 7 days history mock
                { date: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0], score: 92, metrics: { onTimeRate: 98, contaminationRate: 2, issuesReported: 1 } },
                { date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0], score: 94, metrics: { onTimeRate: 99, contaminationRate: 1, issuesReported: 0 } },
                { date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0], score: 91, metrics: { onTimeRate: 95, contaminationRate: 4, issuesReported: 2 } },
                { date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0], score: 96, metrics: { onTimeRate: 100, contaminationRate: 0, issuesReported: 0 } },
                { date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], score: 95, metrics: { onTimeRate: 99, contaminationRate: 1, issuesReported: 0 } },
                { date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0], score: 98, metrics: { onTimeRate: 100, contaminationRate: 0, issuesReported: 0 } },
            ]
        })));
        console.log(`✅ Seeded ${createdZones.length} Zones`.green);

        // 3. SEED VEHICLES
        const vehicles = await Vehicle.insertMany([
            { vehicleId: 'TRUCK-001', licensePlate: 'RJ-14-GC-1111', type: 'Compactor', status: 'Active', capacity: 1000, fuelLevel: 85 },
            { vehicleId: 'TRUCK-002', licensePlate: 'RJ-14-GC-2222', type: 'Compactor', status: 'Active', capacity: 1000, fuelLevel: 72 },
            { vehicleId: 'TRUCK-003', licensePlate: 'RJ-14-GC-3333', type: 'Pickup', status: 'Maintenance', capacity: 500, fuelLevel: 20 },
        ]);
        console.log(`✅ Seeded ${vehicles.length} Vehicles`.green);

        // 4. SEED USERS
        const salt = await bcrypt.genSalt(10);
        const hash = async (pwd) => await bcrypt.hash(pwd, salt);
        const commonPassword = await hash('123456');

        const users = await User.insertMany([
            {
                name: 'Admin User',
                email: 'admin@example.com',
                password: commonPassword,
                role: 'admin',
                avatar: 'https://i.pravatar.cc/150?u=admin'
            },
            {
                name: 'Rajesh Driver',
                email: 'driver1@example.com',
                password: commonPassword,
                role: 'personnel',
                status: 'On Duty',
                assignedVehicle: vehicles[0]._id,
                avatar: 'https://i.pravatar.cc/150?u=driver1'
            },
            {
                name: 'Suresh Driver',
                email: 'driver2@example.com',
                password: commonPassword,
                role: 'personnel',
                status: 'Off Duty',
                assignedVehicle: null,
                avatar: 'https://i.pravatar.cc/150?u=driver2'
            },
            {
                name: 'Priya Resident',
                email: 'resident1@example.com',
                password: commonPassword,
                role: 'resident',
                zoneId: createdZones[0]._id, // Link to first zone
                address: '123, Green Park, Industrial Zone A',
                avatar: 'https://i.pravatar.cc/150?u=res1'
            },
            {
                name: 'Amit Resident',
                email: 'resident2@example.com',
                password: commonPassword,
                role: 'resident',
                zoneId: createdZones[0]._id, // Link to first zone
                address: '45, Factory Lane, Industrial Zone A',
                avatar: 'https://i.pravatar.cc/150?u=res2'
            }
        ]);
        console.log(`✅ Seeded ${users.length} Users`.green);

        // 5. SEED TASKS (Past & Present)
        // A. Past Completed Tasks (for history)
        const pastTasks = [];
        for (let i = 1; i <= 5; i++) {
            pastTasks.push({
                ticketId: `T-OLD-${1000 + i}`,
                title: `Daily Collection - Zone A`,
                type: 'Regular',
                description: 'Routine waste collection run',
                location: createdZones[0].name,
                status: 'Completed',
                priority: 'Medium',
                assignedTo: users[1]._id, // Rajesh
                zoneId: createdZones[0]._id,
                createdAt: new Date(Date.now() - i * 86400000), // i days ago
                updatedAt: new Date(Date.now() - i * 86400000),
                collectionStatus: 'Perfect'
            });
        }
        await Task.insertMany(pastTasks);

        // B. Active Task (Today)
        const activeTask = await Task.create({
            ticketId: `T-NEW-2024`,
            title: `Morning Route - ${createdZones[0].name}`,
            type: 'Regular',
            description: 'Standard collection route. Watch for construction debris in Lane 4.',
            location: createdZones[0].name,
            status: 'In Progress', // Active status
            priority: 'High',
            assignedTo: users[1]._id, // Rajesh
            vehicleId: vehicles[0]._id,
            zoneId: createdZones[0]._id,
            estimatedTime: '2h 15m',
            targetAreaId: createdZones[0].areas[0]._id, // Specific target to test routing
            createdAt: new Date(),
        });
        console.log(`✅ Seeded Tasks (5 Past, 1 Active)`.green);

        // 6. SEED ACTIVITY LOGS
        await ActivityLog.insertMany([
            { user: users[0]._id, action: 'Task Created', details: 'Generated daily route for Zone A', type: 'Info' },
            { user: users[1]._id, action: 'Task Started', details: 'Started route T-NEW-2024', type: 'Success' },
            { user: users[1]._id, action: 'Issue Reported', details: 'Bin blocked at Sector 4', type: 'Warning' },
        ]);
        console.log(`✅ Seeded Activity Logs`.green);

        // 7. SEED ANNOUNCEMENT
        await Announcement.create({
            title: 'Holiday Schedule Update',
            content: 'Collection will be delayed by 2 hours tomorrow due to republic day parade traffic.',
            type: 'Info',
            active: true
        });
        console.log(`✅ Seeded Announcements`.green);

        console.log('✨ Ecosystem Seeding Complete! Ready for Demo.'.rainbow.bold);
        process.exit();

    } catch (err) {
        console.error(`${err}`.red.inverse);
        process.exit(1);
    }
};

seedEcosystem();

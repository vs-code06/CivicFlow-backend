const mongoose = require('mongoose');
const Task = require('../models/Task');
const connectDB = require('../config/db');
require('dotenv').config();

const check = async () => {
    try {
        await connectDB();
        const tasks = await Task.find({});
        console.log(`\n--- DB STATUS CHECK ---`);
        console.log(`Total Tasks in DB: ${tasks.length}`);

        if (tasks.length > 0) {
            console.log('Listing Tasks:');
            tasks.forEach(t => {
                console.log(`[${t.ticketId}] ${t.title} - ${t.status}`);
            });
        }

        console.log('-----------------------\n');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

check();

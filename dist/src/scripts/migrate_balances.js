"use strict";
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../../.env') }); // Resolves relative to THIS file
const migrateBalances = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');
        const users = await User.find({}).lean();
        console.log(`Found ${users.length} users. checking balances...`);
        let count = 0;
        for (const user of users) {
            if (!user.leaveBalances || user.leaveBalances.vacation === undefined) {
                await User.updateOne({ _id: user._id }, {
                    $set: {
                        leaveBalances: {
                            vacation: 20,
                            sick: 10,
                            personal: 5
                        }
                    }
                });
                count++;
            }
        }
        console.log(`Updated ${count} users with default balances.`);
        process.exit();
    }
    catch (error) {
        console.error(error);
        process.exit(1);
    }
};
migrateBalances();

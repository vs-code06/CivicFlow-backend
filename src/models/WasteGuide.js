const mongoose = require('mongoose');

const wasteGuideSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['Recycle', 'Compost', 'Hazardous', 'Trash', 'Other'],
        required: true
    },
    category: {
        type: String, // e.g. Plastic, Paper
        required: true
    },
    disposalSteps: [{
        type: String
    }],
    tip: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('WasteGuide', wasteGuideSchema);

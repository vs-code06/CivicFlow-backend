const Complaint = require('../models/Complaint');

const checkComplaintExists = async (req, res, next) => {
    try {
        const complaint = await Complaint.findById(req.params.id)
            .populate('residentId', 'name email phone avatar')
            .populate('assignedTo', 'name email');

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }
        req.complaint = complaint; 
        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { checkComplaintExists };

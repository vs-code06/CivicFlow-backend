const Zone = require('../models/Zone');

const checkZoneExists = async (req, res, next) => {
    try {
        const zone = await Zone.findById(req.params.id);
        if (!zone) {
            return res.status(404).json({ message: 'Zone not found' });
        }
        req.zone = zone; // Attach to request object
        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { checkZoneExists };

import { Request, Response, NextFunction } from 'express';
import Complaint, { IComplaint } from '../models/Complaint';

export interface ComplaintRequest extends Request {
    complaint?: IComplaint;
}

export const checkComplaintExists = async (req: ComplaintRequest, res: Response, next: NextFunction) => {
    try {
        const complaint = await Complaint.findById(req.params.id)
            .populate('residentId', 'name email phone avatar')
            .populate('assignedTo', 'name email');

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }
        req.complaint = complaint as IComplaint; 
        next();
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

import { Request, Response, NextFunction } from 'express';
import Zone, { IZone } from '../models/Zone';

export interface ZoneRequest extends Request {
    zone?: IZone;
}

export const checkZoneExists = async (req: ZoneRequest, res: Response, next: NextFunction) => {
    try {
        const zone = await Zone.findById((req as any).params.id);
        if (!zone) {
            return res.status(404).json({ message: 'Zone not found' });
        }
        req.zone = zone as IZone;
        next();
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

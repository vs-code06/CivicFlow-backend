export enum UserRole {
    ADMIN = 'admin',
    PERSONNEL = 'personnel',
    RESIDENT = 'resident'
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface AuthRequest extends Request {
    user?: any; // Will be properly typed once User model is converted
}

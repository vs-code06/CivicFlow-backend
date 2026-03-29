import jwt, { SignOptions } from "jsonwebtoken";
import { Response, CookieOptions } from "express";
import { IUser } from "../models/User";

const signToken = (user: IUser): string =>
    jwt.sign(
        { id: user._id, role: user.role }, 
        process.env.JWT_SECRET!, 
        { expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as any } as SignOptions
    );

const cookieOptions = (): CookieOptions => {
    const isProd = process.env.NODE_ENV === "production";
    return {
        httpOnly: true,
        sameSite: isProd ? "none" : "lax",
        secure: isProd,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        domain: process.env.COOKIE_DOMAIN || undefined,
        path: "/",
    };
};

const setAuthCookie = (res: Response, token: string): void => {
    res.cookie("token", token, cookieOptions());
};

export { signToken, cookieOptions, setAuthCookie };

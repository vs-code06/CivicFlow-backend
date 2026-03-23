const jwt = require("jsonwebtoken");

const signToken = (user) =>
    jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

const cookieOptions = () => {
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

const setAuthCookie = (res, token) => {
    res.cookie("token", token, cookieOptions());
};

module.exports = { signToken, cookieOptions, setAuthCookie };

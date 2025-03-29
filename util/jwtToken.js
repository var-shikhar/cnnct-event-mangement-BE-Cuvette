import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";

configDotenv();
const { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, RESET_PASSWORD_SECRET } = process.env;

// Generate Access/Refresh Token (Expires in parameterized time)
export const generateJWTToken = (user, type, time) => {
    return jwt.sign({ id: user._id }, type === 'access' ? ACCESS_TOKEN_SECRET : type === 'reset' ? RESET_PASSWORD_SECRET : REFRESH_TOKEN_SECRET, { expiresIn: time || "15m" });
};

// Verify JWT Token
export const verifyJWTToken = (token, type) => {
    const decoded = jwt.verify(token, type === 'access' ? ACCESS_TOKEN_SECRET : type === 'reset' ? RESET_PASSWORD_SECRET : REFRESH_TOKEN_SECRET);
    return decoded
};

// Check if the token is expired
export const isTokenExpired = (decodedToken) => {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    return decodedToken.exp < currentTimestamp;
};
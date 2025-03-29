import { configDotenv } from "dotenv";
import jwt from "jsonwebtoken";
import User from "../modal/user-modal.js";
import RouteCode from "../util/httpStatus.js";
import { generateJWTToken } from "../util/jwtToken.js";
import { CustomError } from "./errorMiddleware.js";

configDotenv();
const { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, NODE_ENV } = process.env;

// IsAuth Middlware for checking if the user is authenticated
const isAuth = (req, res, next) => {
    try {
        const accessToken = req.cookies.access_token;
        if (!accessToken) next(new CustomError("Something went wrong, Login again!", RouteCode.LOGOUT_REQESTED.statusCode));

        // Verify Access Token
        jwt.verify(accessToken, ACCESS_TOKEN_SECRET, async (err, decoded) => {
            if (err) {
                if (err.name === "TokenExpiredError") return await handleTokenRefresh(req, res, next);
                return next(new CustomError("Something went wrong, Login again!", RouteCode.LOGOUT_REQESTED.statusCode));
            }

            if (!decoded || !decoded.id) return next(new CustomError("Something went wrong, Login again!", RouteCode.LOGOUT_REQESTED.statusCode))
            req.user = decoded;
            return next();
        });
    } catch (error) { next(error) }
};

// Handle Token Refresh
const handleTokenRefresh = async (req, res, next) => {
    try {
        // Get the refresh token from the cookies
        const refreshToken = req.cookies.refresh_token;
        if (!refreshToken) return next(new CustomError("Something went wrong, Login again!", 440));

        // Find the user with the refresh token
        const foundUser = await User.findOne({ refresh_token: refreshToken });
        if (!foundUser) return next(new CustomError("Something went wrong, Login again!", 440));

        // Verify the refresh token
        jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, decoded) => {
            if (err) {
                res.clearCookie("access_token");
                res.clearCookie("refresh_token");
                return next(new CustomError("Session expired, please log in again", 440));
            }

            // Generate new access token
            const newAccessToken = generateJWTToken(foundUser, 'access', '1h');
            res.cookie("access_token", newAccessToken, {
                httpOnly: true, secure: NODE_ENV === "production",
                sameSite: "Lax",
                path: "/"
            });

            req.user = decoded;
            next();
        });
    } catch (error) {
        res.clearCookie("access_token");
        res.clearCookie("refresh_token");
        next(error);
    }
};

export default isAuth
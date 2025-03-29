import bcrypt from "bcryptjs";
import { configDotenv } from "dotenv";
import { CustomError } from "../middleware/errorMiddleware.js";
import User from "../modal/user-modal.js";
import RouteCode from "../util/httpStatus.js";
import { generateJWTToken } from "../util/jwtToken.js";
import getReqUser from '../util/reqUser.js';

configDotenv();

const { SALT, NODE_ENV } = process.env;

// Login Controller
const postLogin = async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new CustomError("Invalid credentials", RouteCode.CONFLICT.statusCode));
    }
    try {
        const foundUser = await User.findOne({ email });
        if (!foundUser) {
            return next(new CustomError("Invalid credentials", RouteCode.CONFLICT.statusCode));
        }

        // Check if the password is correct
        const isValidPassword = await bcrypt.compare(password, foundUser.password);
        if (!isValidPassword) {
            return next(new CustomError("Invalid credentials, email or password is incorrect", RouteCode.CONFLICT.statusCode));
        }

        // Generate JWT tokens
        const accessToken = generateJWTToken(foundUser, 'access', '2h');
        const refreshToken = generateJWTToken(foundUser, 'refresh', '7d');

        // Update refresh token in DB
        foundUser.refresh_token = refreshToken;
        await foundUser.save();

        res.cookie("access_token", accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            path: "/",
        });

        res.cookie("refresh_token", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            path: "/",
        });


        // Send successful login response to the client
        const userDetail = {
            id: foundUser._id,
            name: foundUser.firstName + ' ' + foundUser.lastName,
            email: foundUser.email,
            hasPreferences: foundUser.preferences?.length > 0,
        }
        return res.status(RouteCode.SUCCESS.statusCode).json(userDetail);
    } catch (error) {
        return next(error);
    }
};

// Register Controller
const postRegister = async (req, res, next) => {
    const { firstName, lastName, email, password, confirmPassword } = req.body;
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
        return next(new CustomError("Invalid details shared!", RouteCode.BAD_REQUEST.statusCode));
    }

    if (password !== confirmPassword) {
        return next(new CustomError("Passwords do not match!", RouteCode.BAD_REQUEST.statusCode));
    }

    try {
        const foundSimilarUser = await User.findOne({ email });
        if (foundSimilarUser) {
            return next(new CustomError("User already exists!", RouteCode.BAD_REQUEST.statusCode));
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, Number(SALT));
        const newUser = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            preferences: [],
        });

        await newUser.save();
        return res.status(RouteCode.SUCCESS.statusCode).json({ message: 'User created successfully' });
    } catch (error) {
        return next(error);
    }
};

// Logout Controller
const getLogout = async (req, res, next) => {
    try {
        // Get the refresh token from the cookies
        const refreshToken = req.cookies.refresh_token;
        if (!refreshToken) {
            return next(new CustomError("Something went wrong", RouteCode.BAD_REQUEST.statusCode));
        }

        const foundUser = await User.findOne({ refresh_token: refreshToken });
        if (!foundUser) return next(new CustomError("Something went wrong", RouteCode.BAD_REQUEST.statusCode));

        // Remove refresh token in DB
        foundUser.refresh_token = null;
        await foundUser.save();

        // Clear cookies
        res.clearCookie("access_token");
        res.clearCookie("refresh_token");
        res.status(RouteCode.SUCCESS.statusCode).json({ message: "User has Logged out successfully" });
    } catch (error) {
        return next(error);
    }
};

// Set Users Preferences
const postSetPreferences = async (req, res, next) => {
    const { userName, preferences } = req.body;
    if (!Array.isArray(preferences) || preferences.length === 0 || !userName) {
        return next(new CustomError("Invalid preferences data!", RouteCode.BAD_REQUEST.statusCode));
    }
    try {
        const foundUser = await getReqUser(req, res, next)

        // Check if the username already exists (except for the current user)
        const hasSimilarName = await User.findOne({ userName, _id: { $ne: foundUser._id } });
        if (hasSimilarName) {
            return next(new CustomError("Username already exists!", RouteCode.BAD_REQUEST.statusCode));
        }

        foundUser.userName = userName;
        foundUser.preferences = preferences;
        await foundUser.save();

        const userDetail = {
            id: foundUser._id,
            name: foundUser.firstName + ' ' + foundUser.lastName,
            email: foundUser.email,
            hasPreferences: true,
        }
        return res.status(RouteCode.SUCCESS.statusCode).json(userDetail);
    } catch (error) {
        next(error);
    }
}

// User's Profile Settings
const getUserDetail = async (req, res, next) => {
    try {
        // Get the user details via a helper function which return the current user
        const foundUser = await getReqUser(req, res, next);
        const userDetails = {
            firstName: foundUser.firstName ?? 'N/a',
            lastName: foundUser.lastName ?? 'N/a',
            email: foundUser.email ?? 'N/a',
            phone: foundUser.contact,
            password: '',
            confirmPassword: '',
        }
        return res.status(RouteCode.SUCCESS.statusCode).json(userDetails);
    } catch (error) {
        next(error);
    }
}

// Update User's Profile
const putUserDetail = async (req, res, next) => {
    const { firstName, lastName, email, phone, password, confirmPassword } = req.body;
    // Validate required fields
    if (!firstName || !lastName || !email || !phone) {
        return next(new CustomError("Invaild Fields", RouteCode.CONFLICT.statusCode));
    }

    if (password && password !== confirmPassword) {
        return next(new CustomError("Password does not match", RouteCode.CONFLICT.statusCode));
    }
    try {
        const foundUser = await getReqUser(req, res, next);

        // Check if their are another user with the same email
        if (foundUser.email !== email) {
            const existingUser = await User.findOne({ email, _id: { $ne: foundUser._id } });
            if (existingUser) {
                return next(new CustomError("Email already in use", RouteCode.CONFLICT.statusCode));
            }
        }

        foundUser.firstName = firstName.trim();
        foundUser.lastName = lastName.trim();
        foundUser.email = email.trim();
        foundUser.contact = phone.trim();


        // Update the password if provided
        if (password) {
            const hashedPassword = await bcrypt.hash(password, Number(SALT));
            foundUser.password = hashedPassword;
            foundUser.refresh_token = null;
            await foundUser.save();

            // Clear cookies to logout the user
            res.clearCookie("access_token");
            res.clearCookie("refresh_token");
            return res.status(RouteCode.SUCCESS.statusCode).json({ message: 'Profile updated successfully, Please login again' });
        }

        await foundUser.save();
        return res.status(RouteCode.SUCCESS.statusCode).json({ message: 'Profile updated successfully' });
    } catch (error) {
        next(error);
    }
}

// Get User's Availability
const getUsersAvailability = async (req, res, next) => {
    try {
        const foundUser = await getReqUser(req, res, next);
        if (!foundUser?.day_availability) {
            return res.status(200).json({});
        }

        // Convert the availability object to an array
        const userAvailability = Object.entries(foundUser.day_availability).reduce((acc, [key, value]) => {
            acc[key] = {
                day: key,
                isAvailable: value.available ?? false,
                availability: value?.slots?.map(slot => ({
                    startTime: slot?.start,
                    endTime: slot?.end,
                    error: null,
                })) || [],
            }
            return acc;
        }, {})

        return res.status(RouteCode.SUCCESS.statusCode).json(userAvailability);
    } catch (error) {
        next(error)
    }
}

// Put User Availability
const putUserAvailability = async (req, res, next) => {
    const userAvailability = req.body;

    if (!userAvailability || Object.keys(userAvailability).length === 0) {
        return res.status(RouteCode.BAD_REQUEST.statusCode).json({
            message: RouteCode.BAD_REQUEST.message
        });
    }

    try {
        const foundUser = await getReqUser(req, res, next);
        if (!foundUser.day_availability) foundUser.day_availability = {};

        // Update the availability
        foundUser.day_availability = Object.entries(userAvailability).reduce((acc, [key, value]) => {
            acc[key] = {
                available: value.isAvailable,
                slots: value.availability?.map(slot => ({
                    start: slot.startTime,
                    end: slot.endTime,
                })) || []
            };
            return acc;
        }, { ...foundUser.day_availability });

        await foundUser.save();
        return res.status(RouteCode.SUCCESS.statusCode).json({ message: 'Availability updated successfully!' })
    } catch (error) {
        next(error)
    }
}

export default {
    getLogout, postLogin, postRegister, postSetPreferences,
    getUserDetail, putUserDetail,
    getUsersAvailability, putUserAvailability
};
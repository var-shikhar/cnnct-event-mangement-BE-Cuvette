import express from "express";
import authController from "../controller/auth.js";
import isAuth from "../middleware/isAuthenticated.js";

const router = express.Router();

// Register Controller
router.route('/register').post(authController.postRegister)
router.route('/login').post(authController.postLogin);
router.route('/logout').get(isAuth, authController.getLogout);

// User Controller (Settings, Availability and Profile)
router.route('/user/set-preferences').post(isAuth, authController.postSetPreferences);
router.route('/user/detail').get(isAuth, authController.getUserDetail).put(isAuth, authController.putUserDetail);
router.route('/user/availability').get(isAuth, authController.getUsersAvailability).put(isAuth, authController.putUserAvailability);


export default router;

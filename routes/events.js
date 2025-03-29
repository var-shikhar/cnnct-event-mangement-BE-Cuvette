import express from "express";
import eventsController from "../controller/events.js";
import bookingController from '../controller/booking.js';
import isAuth from "../middleware/isAuthenticated.js";

const router = express.Router();


router.route('/form/:eventID?').get(isAuth, eventsController.getEventDetailByID).post(isAuth, eventsController.postEvent).patch(isAuth, eventsController.patchEventDetailByID).put(isAuth, eventsController.toggleEventStatus).delete(isAuth, eventsController.deleteEvent);
router.route('/participants/').get(isAuth, eventsController.getParticipantsList);
router.route('/booking').get(isAuth, bookingController.getBookingList).put(isAuth, bookingController.updateBookingStatus);
router.route('/calendar').get(isAuth, eventsController.getEventsListForCalendar);
router.route('/').get(isAuth, eventsController.getEventsList);

export default router;
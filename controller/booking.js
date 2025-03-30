import { CustomError } from "../middleware/errorMiddleware.js";
import UserEvent from "../modal/user-event-modal.js";
import { formatTo12Hour } from "../util/date.js";
import RouteCode from "../util/httpStatus.js";
import getReqUser from '../util/reqUser.js';
import { findIfUserIsAvailable } from "./events.js";

// Get Booking List (Based on Filters)
const getBookingList = async (req, res, next) => {
    const { status } = req.query;
    if (!status) return next(new CustomError("Invalid status!", RouteCode.BAD_REQUEST.statusCode));
    try {
        const foundUser = await getReqUser(req, res, next);
        const currentDate = new Date();

        // Fetch events where the user is a participant
        const userEventEntries = await UserEvent.find({ userID: foundUser._id }).populate("eventID");

        // Prepare a list of events where the user is a participant
        let filteredList = userEventEntries.map((entry) => {
            const event = entry.eventID;
            if (!event) return null;

            return {
                id: event._id,
                eventTitle: event.eventTitle,
                eventDate: event.eventStDateTime,
                eventStTime: formatTo12Hour(event.eventStDateTime),
                eventEdTime: formatTo12Hour(event.eventEdDateTime),
                status: entry.status,
                participants: [],
            };
        }).filter(Boolean);


        // Fetch all participants for each event
        for (let event of filteredList) {
            const participants = await UserEvent.find({ eventID: event.id }).populate("userID");
            event.participants = participants.map((participant) => ({
                id: participant.userID._id,
                name: participant.userID.firstName + ' ' + participant.userID.lastName,
                image: '',
                hasAccepted: participant.status === "accepted",
            }));
        }


        // Apply filtering based on status
        if (status === "upcoming") {
            filteredList = filteredList.filter(event => event.status === "accepted" && new Date(event.eventDate) > currentDate);
        } else if (status === "pending") {
            filteredList = filteredList.filter(event => event.status === "pending" && new Date(event.eventDate) > currentDate);
        } else if (status === "cancelled") {
            filteredList = filteredList.filter(event => event.status === "rejected" && new Date(event.eventDate) > currentDate);
        } else if (status === "past") {
            filteredList = filteredList.filter(event => new Date(event.eventDate) < currentDate);
        }

        res.status(RouteCode.SUCCESS.statusCode).json(filteredList);
    } catch (error) {
        next(error);
    }
}

// Update the status of a booking
const updateBookingStatus = async (req, res, next) => {
    const { id, status } = req.body;
    if (!status || !id) return next(new CustomError("Invalid details shared!", RouteCode.BAD_REQUEST.statusCode));
    try {
        const foundUser = await getReqUser(req, res, next);
        const currentDate = new Date();

        // Find the current event where the user is a participant
        const foundUserEvent = await UserEvent.findOne({ userID: foundUser._id, eventID: id }).populate("eventID");
        if (!foundUserEvent) return next(new CustomError("Booking not found!", RouteCode.NOT_FOUND.statusCode));

        const eventDate = new Date(foundUserEvent.eventID.eventStDateTime);
        if (eventDate < currentDate) return next(new CustomError("Event has ended already!", RouteCode.NOT_FOUND.statusCode));

        // Only accept the events if you're available at that time.
        if (status === 'accepted') {
            const { message, status } = await findIfUserIsAvailable(foundUserEvent.eventID.eventStDateTime, foundUserEvent.eventID.eventEdDateTime, foundUser, foundUserEvent.eventID._id);
            if (status !== RouteCode.SUCCESS.statusCode) return next(new CustomError(message, status));
        }
        foundUserEvent.status = status;
        foundUserEvent.responseAt = currentDate;
        await foundUserEvent.save();

        return res.status(RouteCode.SUCCESS.statusCode).json({ message: "Booking status updated successfully!" });
    } catch (error) {
        next(error);
    }
}

export default {
    getBookingList, updateBookingStatus
}
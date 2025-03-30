import { CustomError } from "../middleware/errorMiddleware.js";
import Event from "../modal/event-modal.js";
import UserEvent from "../modal/user-event-modal.js";
import User from "../modal/user-modal.js";
import { formatTo12Hour, getFormattedDate } from "../util/date.js";
import RouteCode from "../util/httpStatus.js";
import getReqUser from '../util/reqUser.js';


// Get Participants List for Event Creation
const getParticipantsList = async (req, res, next) => {
    try {
        const foundUser = await getReqUser(req, res, next);
        const userList = await User.find({ _id: { $ne: foundUser._id } });

        // Prepare a list of users for the dropdown
        const finalList = userList.reduce((acc, currUser) => {
            acc.push({
                id: currUser._id,
                value: currUser.email,
                label: currUser.email,
            })

            return acc;
        }, []);
        return res.status(RouteCode.SUCCESS.statusCode).json(finalList);
    } catch (error) {
        next(error);
    }
}

// Get Events List (Created by User)
const getEventsList = async (req, res, next) => {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    try {
        const foundUser = await getReqUser(req, res, next);

        // Get Total Count (for pagination metadata)
        const totalEvents = await Event.countDocuments({ hostID: foundUser._id });
        const totalPages = Math.ceil(totalEvents / limit);
        const userEvents = await Event.find({ hostID: foundUser._id }).skip((page - 1) * limit).limit(limit);

        // Fetch events where the user is a participant (accepted status)
        const participantEvents = await UserEvent.find({ userID: foundUser._id, status: "accepted" }).populate("eventID");
        const participantEventTimes = participantEvents?.map(entry => {
            if (!entry.eventID || !entry.eventID.eventStDateTime || !entry.eventID.eventEdDateTime) return null;

            return {
                eventID: entry.eventID._id.toString(),
                eventStDateTime: new Date(entry.eventID.eventStDateTime),
                eventEdDateTime: new Date(entry.eventID.eventEdDateTime),
            };
        }).filter(e => e);


        const finalList = userEvents.map(eve => {
            const userEventStart = new Date(eve.eventStDateTime);
            const userEventEnd = new Date(eve.eventEdDateTime);

            // Check if this event overlaps with any participant event
            const hasConflict = participantEventTimes.some(partEve =>
                userEventStart.getTime() < partEve.eventEdDateTime.getTime() &&
                userEventEnd.getTime() > partEve.eventStDateTime.getTime()
            );

            return {
                eventID: eve._id,
                eventTitle: eve.eventTitle,
                eventDate: eve.eventStDateTime,
                eventStTime: formatTo12Hour(userEventStart),
                eventEdTime: formatTo12Hour(userEventEnd),
                eventDuration: eve.eventDuration,
                eventLink: eve.eventLink,
                isActive: eve.isActive,
                hasConflict,
            };
        });

        res.status(RouteCode.SUCCESS.statusCode).json({
            totalEvents,
            totalPages,
            currentPage: page,
            limit,
            events: finalList
        });
    } catch (error) {
        next(error);
    }
}

// Get Events List For Calendar (All Evnets for the User - Created or Participated)
const getEventsListForCalendar = async (req, res, next) => {
    try {
        const foundUser = await getReqUser(req, res, next);
        const userEvents = await Event.find({ hostID: foundUser._id });
        const participatedEvents = await UserEvent.find({ userID: foundUser._id, }).populate('eventID');

        let finalList = userEvents.map(item => {
            return {
                id: item._id,
                title: item.eventTitle,
                start: item.eventStDateTime.toISOString(),
                end: item.eventEdDateTime.toISOString(),
                status: item.isActive,
            }
        });

        if (participatedEvents?.length > 0) {
            const newList = participatedEvents.map(item => {
                return {
                    id: item.eventID._id,
                    title: item.eventID.eventTitle,
                    start: item.eventID.eventStDateTime.toISOString(),
                    end: item.eventID.eventEdDateTime.toISOString(),
                    status: item.status,
                }
            });
            finalList.push(...newList);
        }
        res.status(RouteCode.SUCCESS.statusCode).json(finalList);
    } catch (error) {
        next(error);
    }
}

// Create New Event
const postEvent = async (req, res, next) => {
    const { bannerImg, color, date, description, duration, eventLink, hostName, id, participants, password, time, timeZone, topic } = req.body;
    if (!topic || !date || !time || !duration || !participants || !eventLink) return next(new CustomError('Invalid details shared!', RouteCode.BAD_REQUEST.statusCode));

    try {
        const foundUser = await getReqUser(req, res, next);
        const foundSimilarName = await Event.findOne({ eventTitle: topic.trim() });
        if (foundSimilarName) return next(new CustomError('Event with same name already exists!', RouteCode.CONFLICT.statusCode));


        let durationInMinutes = { "30m": 30, "1hr": 60, "2hr": 120 }[duration] || 30;
        const eventStDateTime = getFormattedDate(date, time);
        const eventEdDateTime = new Date(eventStDateTime.getTime() + durationInMinutes * 60000);

        // Validate If the user is available to create events for the given time
        const timeValidation = await findIfUserIsAvailable(eventStDateTime, eventEdDateTime, foundUser, '');
        if (timeValidation.status !== RouteCode.SUCCESS.statusCode) return next(new CustomError(timeValidation.message, timeValidation.status));


        const newEvent = new Event({
            eventTitle: topic.trim(),
            eventPassword: password,
            hostID: foundUser._id,
            eventDescription: description,
            timeZone: timeZone,
            eventDuration: duration,
            banner: bannerImg,
            eventColor: color,
            eventLink: eventLink,
            eventStDateTime: eventStDateTime,
            eventEdDateTime: eventEdDateTime,
        });

        await newEvent.save();

        // Add participants to the event
        const participantsList = typeof participants === 'string' ? participants.split(',') : participants;
        if (newEvent._id && participantsList.length > 0) {
            await eventParticipants(participantsList, newEvent._id)
        }
        return res.status(RouteCode.SUCCESS.statusCode).json({ message: 'Event created successfully' });
    } catch (error) {
        next(error);
    }
}

// Add/Update Event Participants
const eventParticipants = async (participants, eventID) => {
    if (!Array.isArray(participants) && participants.length <= 0) return { message: 'No participants found!', status: RouteCode.BAD_REQUEST.statusCode }
    try {
        const foundEvent = await Event.findById(eventID);
        if (!foundEvent) return { message: 'Event not found!', status: RouteCode.NOT_FOUND.statusCode }

        // Existing Participants
        const existingParticipants = await UserEvent.find({ eventID }).select('userID')
        const existingUserIDs = existingParticipants.map(p => p.userID.toString());


        // Fetch user IDs for provided emails
        const users = await User.find({ email: { $in: participants } }).select('_id');
        const newUserIDs = users.map(u => u._id.toString());

        // Remove participants not in the new list
        await UserEvent.deleteMany({ eventID, userID: { $nin: newUserIDs } });

        // Add new participants
        const newParticipants = newUserIDs
            .filter(id => !existingUserIDs.includes(id))
            .map(userID => ({ eventID, userID }));

        if (newParticipants.length) await UserEvent.insertMany(newParticipants);

        return { message: 'Participants updated successfully!', status: RouteCode.SUCCESS.statusCode };
    } catch (error) {
        return {
            message: 'Something went wrong!',
            status: RouteCode.CONFLICT.statusCode
        };
    }
}

// Find If User is available in the defined time slot
export const findIfUserIsAvailable = async (startDateTime, endDateTime, foundUser, eventID = "") => {
    const eventDay = startDateTime.toLocaleString('en-US', { weekday: 'short' });

    // Check if the user is available on this day
    if (!foundUser.day_availability[eventDay] || !foundUser.day_availability[eventDay].available) return { status: RouteCode.CONFLICT.statusCode, message: `You are not available on ${eventDay}!` };

    // Check if the user already has an event scheduled at this time
    const query = {
        hostID: foundUser._id,
        $and: [{ eventStDateTime: { $lt: endDateTime } }, { eventEdDateTime: { $gt: startDateTime } }]
    };
    // Exclude the current event if eventID is provided
    if (eventID !== '') query._id = { $ne: eventID };

    const conflictingEvent = await Event.findOne(query);

    if (conflictingEvent) {
        const conflictStTime = formatTo12Hour(conflictingEvent.eventStDateTime);
        const conflictEdTime = formatTo12Hour(conflictingEvent.eventEdDateTime);
        return {
            status: RouteCode.CONFLICT.statusCode,
            message: `You already have an event at ${conflictStTime}-${conflictEdTime} on ${eventDay}!`,
        };
    }


    // Check if event time falls within an available slot
    const availableSlots = foundUser.day_availability[eventDay].slots || [];
    for (const slot of availableSlots) {
        if (!slot.start || !slot.end) continue;

        const formattedStTime = getFormattedDate(startDateTime, slot.start);
        const formattedEdTime = getFormattedDate(startDateTime, slot.end);

        if (startDateTime >= formattedStTime && endDateTime <= formattedEdTime) {
            return { status: RouteCode.SUCCESS.statusCode, message: '' };
        }
    }


    return {
        status: RouteCode.CONFLICT.statusCode,
        message: `The selected time is not available on ${eventDay}!`,
    }
}

// Get Event Detail By ID
const getEventDetailByID = async (req, res, next) => {
    const { eventID } = req.params;
    if (!eventID) return next(new CustomError("Invalid Event ID!", RouteCode.BAD_REQUEST.statusCode));

    try {
        const foundEvent = await Event.findById(eventID);
        if (!foundEvent) return next(new CustomError("Event not found!", RouteCode.NOT_FOUND.statusCode));

        const formattedDate = foundEvent.eventStDateTime.toISOString().split("T")[0];
        const formattedTime = foundEvent.eventStDateTime.toISOString().split("T")[1].substring(0, 5);

        const participants = await UserEvent.find({ eventID }).populate('userID', 'email').select('userID');
        const participantsList = participants?.map(p => p.userID.email) ?? [];

        const finalObj = {
            id: foundEvent._id,
            bannerImg: foundEvent.banner,
            color: foundEvent.eventColor,
            date: formattedDate,
            description: foundEvent.eventDescription,
            duration: foundEvent.eventDuration,
            eventLink: foundEvent.eventLink,
            hostName: foundEvent.hostID,
            password: foundEvent.eventPassword,
            time: formattedTime,
            timeZone: foundEvent.timeZone,
            topic: foundEvent.eventTitle,
            participants: participantsList
        }

        res.status(RouteCode.SUCCESS.statusCode).json(finalObj);
    } catch (error) {
        next(error);
    }
}

// Put Event Detail
const patchEventDetailByID = async (req, res, next) => {
    const { bannerImg, color, date, description, duration, eventLink, hostName, id, participants, password, time, timeZone, topic } = req.body;
    if (!topic || !date || !time || !duration || !participants || !eventLink || !id) return next(new CustomError('Invalid details shared!', RouteCode.BAD_REQUEST.statusCode));
    try {
        const foundUser = await getReqUser(req, res, next);

        // Find the event by ID that you're updating
        const foundEvent = await Event.findById(id);
        if (!foundEvent) return next(new CustomError("Event not found!", RouteCode.NOT_FOUND.statusCode));

        // Check if the user is the host of the event
        if (foundEvent.hostID.toString() !== foundUser._id.toString()) return next(new CustomError("You are not authorized to update this event!", RouteCode.UNAUTHORIZED.statusCode));


        let durationInMinutes = { "30m": 30, "1hr": 60, "2hr": 120 }[duration] || 30;
        const eventStDateTime = getFormattedDate(date, time);
        const eventEdDateTime = new Date(eventStDateTime.getTime() + durationInMinutes * 60000);

        // Check if the user is available at the time of the event
        const timeValidation = await findIfUserIsAvailable(eventStDateTime, eventEdDateTime, foundUser, id);
        if (timeValidation.status !== RouteCode.SUCCESS.statusCode) return next(new CustomError(timeValidation.message, timeValidation.status));

        foundEvent.eventTitle = topic.trim();
        foundEvent.eventPassword = password;
        foundEvent.eventDescription = description;
        foundEvent.timeZone = timeZone;
        foundEvent.eventDuration = duration;
        foundEvent.banner = bannerImg;
        foundEvent.eventColor = color;
        foundEvent.eventLink = eventLink;
        foundEvent.eventStDateTime = eventStDateTime;
        foundEvent.eventEdDateTime = eventEdDateTime;

        await foundEvent.save();

        const participantsList = typeof participants === 'string' ? participants.split(',') : participants;
        if (foundEvent._id && participantsList.length > 0) {
            await eventParticipants(participantsList, foundEvent._id)
        }
        return res.status(RouteCode.SUCCESS.statusCode).json({ message: 'Event updated successfully!' });
    } catch (error) {
        next(error);
    }
}

// Toggle Event Active Status
const toggleEventStatus = async (req, res, next) => {
    const { eventID } = req.params;
    if (!eventID) return next(new CustomError("Invalid Event ID!", RouteCode.BAD_REQUEST.statusCode));

    try {
        const foundEvent = await Event.findById(eventID);
        if (!foundEvent) return next(new CustomError("Event not found!", RouteCode.NOT_FOUND.statusCode));

        foundEvent.isActive = !foundEvent.isActive;
        await foundEvent.save();

        return res.status(RouteCode.SUCCESS.statusCode).json({ message: 'Event status updated successfully!' });
    } catch (error) {
        next(error);
    }
}

// Delete Event
const deleteEvent = async (req, res, next) => {
    const { eventID } = req.params;
    try {
        const foundEvent = await Event.findById(eventID);
        if (!foundEvent) return next(new CustomError("Event not found!", RouteCode.NOT_FOUND.statusCode));

        // Delete the event itself and all the participants
        await UserEvent.deleteMany({ eventID });
        await Event.findByIdAndDelete(eventID);
        return res.status(RouteCode.SUCCESS.statusCode).json({ message: "Event deleted successfully" });
    } catch (error) {
        next(error);
    }
};


export default {
    getParticipantsList, getEventsList, postEvent, toggleEventStatus, deleteEvent, getEventDetailByID, patchEventDetailByID, getEventsListForCalendar
}
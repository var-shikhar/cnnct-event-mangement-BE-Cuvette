import mongoose from 'mongoose';

// Event Schema
const eventSchema = new mongoose.Schema({
    eventTitle: { type: String, required: true, unique: true },
    eventPassword: { type: String },
    hostID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventDescription: { type: String },
    eventStDateTime: { type: Date, required: true },
    eventEdDateTime: { type: Date, required: true },
    timeZone: { type: String, required: true },
    eventDuration: { type: String, required: true },
    banner: { type: String },
    eventColor: { type: String },
    eventLink: { type: String, required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);
export default Event;
import mongoose from 'mongoose';

// User Event Schema (Participant Lists)
const userEventSchema = new mongoose.Schema({
    eventID: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending',
    },
    requestSentAt: { type: Date, default: Date.now },
    responseAt: { type: Date }
}, { timestamps: true });

const UserEvent = mongoose.model('UserEvent', userEventSchema);
export default UserEvent;

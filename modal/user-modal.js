import mongoose from 'mongoose';

// User Schema
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    userName: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    contact: { type: String },
    password: {
        type: String,
        required: true,
    },
    preferences: {
        type: [String],
        default: [],
    },
    day_availability: {
        Sun: {
            available: { type: Boolean, default: false },
            slots: [{
                start: { type: String, default: '' },
                end: { type: String, default: '' },
            }]
        },
        Mon: {
            available: { type: Boolean, default: false },
            slots: [{
                start: { type: String, default: '' },
                end: { type: String, default: '' },
            }]
        },
        Tue: {
            available: { type: Boolean, default: false },
            slots: [{
                start: { type: String, default: '' },
                end: { type: String, default: '' },
            }]
        },
        Wed: {
            available: { type: Boolean, default: false },
            slots: [{
                start: { type: String, default: '' },
                end: { type: String, default: '' },
            }]
        },
        Thu: {
            available: { type: Boolean, default: false },
            slots: [{
                start: { type: String, default: '' },
                end: { type: String, default: '' },
            }]
        },
        Fri: {
            available: { type: Boolean, default: false },
            slots: [{
                start: { type: String, default: '' },
                end: { type: String, default: '' },
            }]
        },
        Sat: {
            available: { type: Boolean, default: false },
            slots: [{
                start: { type: String, default: '' },
                end: { type: String, default: '' },
            }]
        },
    },
    refresh_token: { type: String },
});

const User = mongoose.model('User', userSchema);
export default User;
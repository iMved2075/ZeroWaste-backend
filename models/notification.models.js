import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    relatedListingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        default: null
    },
    type: {
        type: String,
        enum: ['info', 'warning', 'alert'],
        default: 'info',
        required: true
    },
    readStatus: {
        type: Boolean,
        default: false,
        required: true
    }
}, { timestamps: true });

export const Notification = mongoose.model('Notification', notificationSchema);
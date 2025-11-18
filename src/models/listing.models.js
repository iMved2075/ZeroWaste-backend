import mongoose from "mongoose";

const listingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1']
    },
    foodPhotos: [{
        type: String,
        required: true,
        trim: true
    }],
    donorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    claimedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    pickupAddress: {
        type: String,
        required: true,
        trim: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['available', 'claimed', 'expired'],
        default: 'available',
        required: true
    },
    claimedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

export const Listing = mongoose.model('Listing', listingSchema);
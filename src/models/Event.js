import mongoose from 'mongoose';

const { Schema } = mongoose;

// Defines the possible types for registration and status fields
const REG_TYPES = ['FREE', 'PAID'];
const STATUS_TYPES = ['ACTIVE', 'DRAFT', 'ARCHIVED'];

const eventSchema = new Schema({
    // --- Basic Details ---
    fullName: {
        type: String,
        required: [true, 'Full event name is required'],
        trim: true,
        unique: true
    },
    shortName: {
        type: String,
        trim: true,
        unique: true
    },
    image: {
        type: String, // Cloudinary URL for the event cover image
        trim: true
    },

    // --- Time & Location ---
    start_date: {
        type: Date,
        required: [true, 'Start date is required']
    },
    end_date: {
        type: Date,
        required: [true, 'End date is required']
    },
    venue: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    
    // --- Registration & Status ---
    regType: {
        type: String,
        enum: REG_TYPES,
        required: [true, 'Registration type (FREE/PAID) is required']
    },
    amount: {
        type: Number,
        default: 0,
        min: 0,
        // Custom validator to ensure amount is present if regType is PAID
        validate: {
            validator: function(v) {
                return this.regType === 'FREE' ? true : (v > 0);
            },
            message: 'Amount must be greater than 0 for PAID events.'
        }
    },
    status: {
        type: String,
        enum: STATUS_TYPES,
        default: 'DRAFT', // Default to DRAFT until Admin explicitly makes it ACTIVE
        required: true
    },

    // --- Admin Reference ---
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'Admin',
        required: true // Links the event back to the creating administrator
    }
}, {
    timestamps: true,
});

const Event = mongoose.model('Event', eventSchema);
export default Event;

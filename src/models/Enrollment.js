import mongoose from 'mongoose';

const { Schema } = mongoose;

const ENROLLMENT_STATUSES = [
    'PENDING',           // Registration/Payment started but not confirmed
    'FREE_REGISTERED',   // Successfully registered for a FREE event
    'PAID_SUCCESS',      // Successfully paid for a PAID event
    'REFUNDED',          // Enrollment access revoked due to refund
    'CANCELLED'          // User/Admin cancelled registration
];

const enrollmentSchema = new Schema({
    // --- Relationship Fields ---
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    event_id: {
        type: Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
    },
    // Optional reference to the payment record if the event was PAID
    payment_id: {
        type: Schema.Types.ObjectId,
        ref: 'Payment',
        default: null,
    },

    // --- Status and Transaction Tracking ---
    status: {
        type: String,
        enum: ENROLLMENT_STATUSES,
        default: 'PENDING',
        required: true,
    },
    purchaseDate: {
        type: Date,
        default: Date.now,
    },
    amountPaid: {
        type: Number,
        default: 0,
        min: 0,
    },
    accessExpires: {
        type: Date,
        default: null, // Null means permanent access (or until event ends)
    }
}, {
    timestamps: true,
});

// Ensures a user can only enroll in a specific event once
enrollmentSchema.index({ user_id: 1, event_id: 1 }, { unique: true });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
export default Enrollment;

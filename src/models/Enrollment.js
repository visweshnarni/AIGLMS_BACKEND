// models/Enrollment.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const STATUS_TYPES = ['PENDING', 'FREE_REGISTERED', 'PAID_SUCCESS', 'REFUNDED'];

const enrollmentSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    event_id: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    status: {
        type: String,
        enum: STATUS_TYPES,
        default: 'PENDING',
        required: true,
    },
    purchaseDate: { type: Date, default: Date.now },
    amountPaid: { type: Number, default: 0, min: 0 },
    payment_id: { type: String, trim: true }, // e.g., Instamojo payment ID
}, { timestamps: true });

// Ensure one enrollment per user per event
enrollmentSchema.index({ user_id: 1, event_id: 1 }, { unique: true });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
export default Enrollment;

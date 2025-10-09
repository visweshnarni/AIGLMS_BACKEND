// models/Payment.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const STATUS_TYPES = ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'];

const paymentSchema = new Schema({
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
    transactionId: {
        type: String,
        trim: true,
        required: true,
        unique: true,
    },
    paymentGateway: {
        type: String,
        trim: true,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: String,
        enum: STATUS_TYPES,
        default: 'PENDING',
        required: true,
    },
    paymentDate: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;

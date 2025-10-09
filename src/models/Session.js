// models/Session.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const sessionSchema = new Schema({
    event_id: {
        type: Schema.Types.ObjectId,
        ref: 'Event',
        required: [true, 'Session must belong to an Event.']
    },
    title: {
        type: String,
        required: [true, 'Session title is required.'],
        trim: true
    },
    startDate: {
        type: Date,
        required: [true, 'Session start date is required.']
    },
    startTime: {
        type: String,
        required: [true, 'Session start time is required.']
    },
    endTime: { type: String },
    hall: { type: String, trim: true },
    order: { type: Number, default: 1 }
}, {
    timestamps: true,
});
sessionSchema.index({ event_id: 1, title: 1 }, { unique: true });
const Session = mongoose.model('Session', sessionSchema);
export default Session;

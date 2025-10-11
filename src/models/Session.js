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
    // Removed: order field
}, {
    timestamps: true,
});
// Using a unique index on event_id and title ensures no duplicate sessions in the same event
sessionSchema.index({ event_id: 1, title: 1 }, { unique: true });
const Session = mongoose.model('Session', sessionSchema);
export default Session;

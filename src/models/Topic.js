import mongoose from 'mongoose';

const { Schema } = mongoose;

const topicSchema = new Schema({
    event_id: {
        type: Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
    },
    session_id: {
        type: Schema.Types.ObjectId,
        ref: 'Session',
        required: true,
    },
    topic: {
        type: String,
        required: true,
        trim: true,
    },
    speaker_id: {
        type: Schema.Types.ObjectId,
        ref: 'Speaker',
        required: true,
    },
    video_link: {
        type: String,
        trim: true,
        default: ''
    },
    thumbnail: {
        type: String,
        trim: true,
        default: ''
    },
     video_duration: {
        type: String,       // Changed from Number to String
        trim: true,
        default: '00:00:00', // Set a default that matches the format
        // This regex ensures the duration is always in HH:MM:SS format
        match: [/^([0-9][0-9]):([0-5][0-9]):([0-5][0-9])$/, 'Please provide a valid duration in HH:MM:SS format.']
    }
}, {
    timestamps: true
});

const Topic = mongoose.model('Topic', topicSchema);
export default Topic;

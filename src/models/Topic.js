// models/Topic.js
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
        default: '',
    },
    order: {
        type: Number,
        default: 1,
    },
}, {
    timestamps: true,
});

const Topic = mongoose.model('Topic', topicSchema);
export default Topic;

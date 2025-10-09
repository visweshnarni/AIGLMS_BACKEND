// models/Speaker.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const speakerSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Speaker name is required'],
        trim: true,
    },
    affiliation: {
        type: String,
        trim: true,
    },
    state: {
        type: String,
        trim: true,
    },
    country: {
        type: String,
        trim: true,
    },
    photo: {
        type: String, // Cloudinary URL for speaker photo
        trim: true,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'Admin',
        required: true,
    }
}, {
    timestamps: true,
});

const Speaker = mongoose.model('Speaker', speakerSchema);
export default Speaker;

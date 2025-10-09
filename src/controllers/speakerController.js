// controllers/speakerController.js
import Speaker from '../models/Speaker.js';
// utils/handleSpeakerImageUpload.js
import { uploadBufferToCloudinary } from '../utils/uploadToCloudinary.js';

export const handleSpeakerImageUpload = async (req, speakerName) => {
    if (req.file) {
        const buffer = req.file.buffer;
        const originalname = req.file.originalname;
        const filename = `${speakerName.replace(/\s/g, '_')}-${originalname}`;
        const folderName = `lms/speakers/${speakerName.replace(/\s/g, '_')}`;

        const imageUrl = await uploadBufferToCloudinary(
            buffer,
            filename,
            folderName,
            'image'
        );
        return imageUrl;
    }
    return null;
};


export const adminCreateSpeaker = async (req, res) => {
    try {
        const { name, affiliation, state, country } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Speaker name is required.' });
        }

        const photoUrl = await handleSpeakerImageUpload(req, name);

        const speaker = new Speaker({
            name,
            affiliation,
            state,
            country,
            photo: photoUrl,
            createdBy: req.admin._id,
        });

        await speaker.save();
        res.status(201).json({ success: true, speaker });
    } catch (error) {
        console.error('Admin Create Speaker Error:', error);
        res.status(500).json({ error: 'Internal server error while creating speaker.', details: error.message });
    }
};

export const adminUpdateSpeaker = async (req, res) => {
    try {
        const speakerId = req.params.id;
        const currentSpeaker = await Speaker.findById(speakerId);
        if (!currentSpeaker) {
            return res.status(404).json({ error: 'Speaker not found.' });
        }

        let updateData = { ...req.body };
        if (req.file) {
            const photoUrl = await handleSpeakerImageUpload(req, updateData.name || currentSpeaker.name);
            updateData.photo = photoUrl;
        }

        const updatedSpeaker = await Speaker.findByIdAndUpdate(
            speakerId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        res.status(200).json({ success: true, speaker: updatedSpeaker });
    } catch (error) {
        console.error('Admin Update Speaker Error:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, error: error.message });
        }
        res.status(500).json({ error: 'Internal server error while updating speaker.' });
    }
};

export const adminDeleteSpeaker = async (req, res) => {
    try {
        const deleted = await Speaker.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Speaker not found.' });
        }
        res.status(200).json({ success: true, message: 'Speaker deleted successfully.' });
    } catch (error) {
        console.error('Admin Delete Speaker Error:', error);
        res.status(500).json({ error: 'Internal server error while deleting speaker.' });
    }
};

export const userGetAllSpeakers = async (req, res) => {
    try {
        const speakers = await Speaker.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: speakers.length, speakers });
    } catch (error) {
        console.error('User Get All Speakers Error:', error);
        res.status(500).json({ error: 'Internal server error while fetching speakers.' });
    }
};

export const userGetSpeakerDetails = async (req, res) => {
    try {
        const speaker = await Speaker.findById(req.params.id);
        if (!speaker) {
            return res.status(404).json({ error: 'Speaker not found.' });
        }
        res.status(200).json({ success: true, speaker });
    } catch (error) {
        console.error('User Get Speaker Details Error:', error);
        res.status(500).json({ error: 'Internal server error while fetching speaker details.' });
    }
};

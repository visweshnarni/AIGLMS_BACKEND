// controllers/speakerController.js
import Speaker from '../models/Speaker.js';
// utils/handleSpeakerImageUpload.js
import { uploadBufferToCloudinary } from '../utils/uploadToCloudinary.js';
import Topic from '../models/Topic.js';

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

/**
 * MODIFIED FUNCTION
 * @desc    Get all speakers, enriched with topic count and formatted location, with sorting.
 * @route   GET /api/speakers/public?sort={alphabetical|most-videos}
 * @access  Public
 */
export const userGetAllSpeakers = async (req, res) => {
    try {
        // Get the sort type from query params, default to 'alphabetical'
        const sortType = req.query.sort || 'alphabetical';

        // Step 1: Efficiently count all topics for each speaker.
        const topicCounts = await Topic.aggregate([
            {
                $group: {
                    _id: "$speaker_id",
                    totalTopics: { $sum: 1 }
                }
            }
        ]);

        const topicCountsMap = new Map(
            topicCounts.map(item => [item._id.toString(), item.totalTopics])
        );

        // Step 2: Get all speaker documents without sorting them at the DB level yet.
        const speakersFromDB = await Speaker.find().lean();

        // Step 3: Map over speakers to format the response and add topic counts.
        const speakers = speakersFromDB.map(speaker => {
            const location = [speaker.state, speaker.country].filter(Boolean).join(', ');

            return {
                id: speaker._id,
                name: speaker.name,
                image: speaker.photo || null,
                affliation: speaker.affiliation,
                location: location,
                totalTopics: topicCountsMap.get(speaker._id.toString()) || 0
            };
        });

        // Step 4: Sort the final array based on the query parameter.
        if (sortType === 'most-videos') {
            // Sort by the number of topics in descending order
            speakers.sort((a, b) => b.totalTopics - a.totalTopics);
        } else {
            // Default to alphabetical sort
            speakers.sort((a, b) => a.name.localeCompare(b.name));
        }

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

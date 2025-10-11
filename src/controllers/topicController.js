// controllers/topicController.js
import Topic from '../models/Topic.js';
import { uploadBufferToCloudinary } from '../utils/uploadToCloudinary.js';
import Session from '../models/Session.js';
import mongoose from 'mongoose';
import Enrollment from '../models/Enrollment.js'; // For user registration check

// const handleVideoUpload = async (req, folderNamePrefix) => {
//     if (req.file) {
//         const buffer = req.file.buffer;
//         const originalname = req.file.originalname;
//         const filename = `${folderNamePrefix}-${originalname.replace(/\s/g, '_')}`;
//         const folderName = `lms/topics/${folderNamePrefix}`;

//         // resourceType 'video' for video uploads, 'image' is also possible from extensions
//         const resourceType = ['.mp4', '.mov', '.webm', '.avi', '.wmv', '.flv', '.mkv'].some(ext => filename.endsWith(ext))
//             ? 'video' : 'image';

//         const uploadedUrl = await uploadBufferToCloudinary(buffer, filename, folderName, resourceType);
//         return uploadedUrl;
//     }
//     return '';
// };

// Admin create topic
// Admin create topic (no file upload)
export const adminCreateTopic = async (req, res) => {
    try {
        const { event_id, session_id, topic, speaker_id, video_link, video_duration } = req.body;

        if (!event_id || !session_id || !topic || !speaker_id) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }

        let thumbnailUrl = '';
        if (req.file) {
            thumbnailUrl = await uploadBufferToCloudinary(
                req.file.buffer,
                req.file.originalname.replace(/\s/g, '_'),
                `lms/topics/${event_id}-${session_id}`,
                'image'
            );
        }

        const newTopic = new Topic({
            event_id,
            session_id,
            topic,
            speaker_id,
            video_link: video_link || '',
            thumbnail: thumbnailUrl,
            video_duration: video_duration || 0
        });

        await newTopic.save();
        res.status(201).json({ success: true, topic: newTopic });
    } catch (error) {
        console.error('Admin Create Topic Error:', error);
        res.status(500).json({ error: 'Internal server error while creating topic.' });
    }
};

// Admin update topic
// Admin update topic (no file upload)
export const adminUpdateTopic = async (req, res) => {
    try {
        const topicId = req.params.id;
        const currentTopic = await Topic.findById(topicId);
        if (!currentTopic) {
            return res.status(404).json({ error: 'Topic not found.' });
        }

        let thumbnailUrl = currentTopic.thumbnail;
        if (req.file) {
            thumbnailUrl = await uploadBufferToCloudinary(
                req.file.buffer,
                req.file.originalname.replace(/\s/g, '_'),
                `lms/topics/${currentTopic.event_id}-${currentTopic.session_id}`,
                'image'
            );
        }

        const updateData = {
            ...req.body,
            video_link: req.body.video_link !== undefined ? req.body.video_link : currentTopic.video_link,
            video_duration: req.body.video_duration !== undefined ? req.body.video_duration : currentTopic.video_duration,
            thumbnail: thumbnailUrl
        };

        const updatedTopic = await Topic.findByIdAndUpdate(
            topicId,
            { $set: updateData },
            { new: true, runValidators: true }
        );
        res.status(200).json({ success: true, topic: updatedTopic });
    } catch (error) {
        console.error('Admin Update Topic Error:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, error: error.message });
        }
        res.status(500).json({ error: 'Internal server error while updating topic.' });
    }
};


// Admin delete topic
export const adminDeleteTopic = async (req, res) => {
    try {
        const deleted = await Topic.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Topic not found.' });
        }
        res.status(200).json({ success: true, message: 'Topic deleted.' });
    } catch (error) {
        console.error('Admin Delete Topic Error:', error);
        res.status(500).json({ error: 'Internal server error while deleting topic.' });
    }
};

// User get all topics for an event+session, with gated video link access
export const userGetTopicsForSession = async (req, res) => {
    try {
        const { eventId, sessionId } = req.params;

        // Fetch topics with populated refs
        const topics = await Topic.find({ event_id: eventId, session_id: sessionId })
            .populate('speaker_id', 'name affiliation photo')
            .sort({ order: 1 });

        let enrolled = false;

        // Check if user is enrolled (authenticated and enrolled in event)
        if (req.user) {
            const enrollment = await Enrollment.findOne({ user_id: req.user._id, event_id: eventId });
            if (enrollment && (enrollment.status === 'ACTIVE' || enrollment.status === 'COMPLETED')) {
                enrolled = true;
            }
        }

        // Remove video links if user not enrolled
        const topicsResponse = topics.map(t => ({
            _id: t._id,
            event_id: t.event_id,
            session_id: t.session_id,
            topic: t.topic,
            speaker: t.speaker_id,
            video_link: enrolled ? t.video_link : '', // Hide video link if not enrolled
            order: t.order,
            video_duration: t.video_duration
        }));

        res.status(200).json({ success: true, topics: topicsResponse });
    } catch (error) {
        console.error('User Get Topics Error:', error);
        res.status(500).json({ error: 'Internal server error while fetching topics.' });
    }
};



// Admin: Get all topics
export const adminGetAllTopics = async (req, res) => {
    try {
        const topics = await Topic.find()
            .populate('event_id', 'fullName shortName')
            .populate('session_id', 'title startDate startTime hall')
            .populate('speaker_id', 'name affiliation photo')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: topics.length, topics });
    } catch (error) {
        console.error('Admin Get All Topics Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Admin: Get topic by ID (all fields)
export const adminGetTopicById = async (req, res) => {
    try {
        const topic = await Topic.findById(req.params.id)
            .populate('event_id', 'fullName shortName')
            .populate('session_id', 'title startDate startTime hall')
            .populate('speaker_id', 'name affiliation photo');

        if (!topic) return res.status(404).json({ error: 'Topic not found' });
        res.status(200).json({ success: true, topic });
    } catch (error) {
        console.error('Admin Get Topic By Id Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Admin: Get all topics by session ID
export const adminGetTopicsBySession = async (req, res) => {
    try {
        const topics = await Topic.find({ session_id: req.params.sessionId })
            .populate('event_id', 'fullName shortName')
            .populate('session_id', 'title startDate startTime hall')
            .populate('speaker_id', 'name affiliation photo')
            .sort({ order: 1 });

        res.status(200).json({ success: true, count: topics.length, topics });
    } catch (error) {
        console.error('Admin Get Topics By Session Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Admin: Get all topics by event ID
export const adminGetTopicsByEvent = async (req, res) => {
    try {
        const topics = await Topic.find({ event_id: req.params.eventId })
            .populate('event_id', 'fullName shortName')
            .populate('session_id', 'title startDate startTime hall')
            .populate('speaker_id', 'name affiliation photo')
            .sort({ order: 1 });

        res.status(200).json({ success: true, count: topics.length, topics });
    } catch (error) {
        console.error('Admin Get Topics By Event Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};





export const userGetTopicsByEvent = async (req, res) => {
    try {
        const eventId = req.params.eventId;
        // Get topics for event
        const topics = await Topic.find({ event_id: eventId })
            .populate('event_id', 'fullName shortName')
            .populate('session_id', 'title startDate startTime hall')
            .populate('speaker_id', 'name affiliation photo')
            .sort({ order: 1 });

        let enrolled = false;
        if (req.user) {
            const enrollment = await Enrollment.findOne({ user_id: req.user._id, event_id: eventId });
            if (enrollment && (enrollment.status === 'PAID_SUCCESS' || enrollment.status === 'FREE_REGISTERED')) {
                enrolled = true;
            }
        }

        const topicsResp = topics.map(t => ({
            _id: t._id,
            event_id: t.event_id,
            session_id: t.session_id,
            topic: t.topic,
            speaker: t.speaker_id,
            video_link: enrolled ? t.video_link : '',
            video_duration: t.video_duration,
            order: t.order,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt
        }));

        res.status(200).json({ success: true, count: topicsResp.length, topics: topicsResp });
    } catch (error) {
        console.error('User Get Topics By Event Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


// =======================================================
// NEW: VIDEO PLAYER FUNCTION
// =======================================================

/**
 * @desc    Get details for a specific video and its session playlist for an enrolled user.
 * @route   GET /api/topics/video-player/:topicId
 * @access  Private (Requires user token)
 */
export const userGetVideoPlayerDetails = async (req, res) => {
    try {
        const { topicId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(topicId)) {
            return res.status(400).json({ success: false, error: 'Invalid Topic ID format.' });
        }

        // 1. Find the requested topic to get its context (event_id, session_id)
        const currentTopic = await Topic.findById(topicId);
        if (!currentTopic) {
            return res.status(404).json({ success: false, error: 'Video topic not found.' });
        }

        const { event_id, session_id } = currentTopic;

        // 2. Verify that the user is enrolled in the parent event
        const enrollment = await Enrollment.findOne({ user_id: userId, event_id });
        if (!enrollment || !['FREE_REGISTERED', 'PAID_SUCCESS'].includes(enrollment.status)) {
            return res.status(403).json({ success: false, error: 'Access denied. You are not enrolled in this event.' });
        }

        // 3. User is authorized. Fetch all details with an aggregation pipeline.
        const pipeline = [
            // Step A: Match all topics belonging to the same session
            { $match: { session_id } },
            // Step B: Join with other collections to get names
            {
                $lookup: {
                    from: 'speakers', // collection name
                    localField: 'speaker_id',
                    foreignField: '_id',
                    as: 'speakerInfo'
                }
            },
            {
                $lookup: {
                    from: 'sessions', // collection name
                    localField: 'session_id',
                    foreignField: '_id',
                    as: 'sessionInfo'
                }
            },
            {
                $lookup: {
                    from: 'events', // collection name
                    localField: 'event_id',
                    foreignField: '_id',
                    as: 'eventInfo'
                }
            },
            // Step C: Deconstruct the arrays created by $lookup
            { $unwind: { path: '$speakerInfo', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$sessionInfo', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$eventInfo', preserveNullAndEmptyArrays: true } },
            // Step D: Project the final shape of the data
            {
                $project: {
                    _id: 1,
                    topic: 1,
                    video_link: 1,
                    thumbnail: 1,
                    video_duration: 1,
                    event_id: 1, // Pass event_id through
                    session_id: 1, // Pass session_id through
                    // Include names from joined collections
                    speakerName: '$speakerInfo.name', // <-- CORRECTED: Was missing or incorrect
                    sessionName: '$sessionInfo.title',
                    eventName: '$eventInfo.fullName'
                }
            }
        ];

        const sessionTopics = await Topic.aggregate(pipeline);
        
        // 4. Find the specific "current" topic from the playlist
        const currentTopicDetails = sessionTopics.find(t => t._id.toString() === topicId);

        if (!currentTopicDetails) {
            return res.status(404).json({ success: false, error: 'Could not retrieve video details within the session.' });
        }
        
        // 5. Assemble and send the final response
        res.status(200).json({
            success: true,
            data: {
                eventName: currentTopicDetails.eventName,
                sessionName: currentTopicDetails.sessionName,
                currentTopic: currentTopicDetails,
                sessionPlaylist: sessionTopics
            }
        });

    } catch (error) {
        console.error('Get Video Player Details Error:', error.message);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
};



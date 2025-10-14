// controllers/speakerController.js
import Speaker from '../models/Speaker.js';
// utils/handleSpeakerImageUpload.js
import { uploadBufferToCloudinary } from '../utils/uploadToCloudinary.js';
import Topic from '../models/Topic.js';
import Enrollment from '../models/Enrollment.js'; // <-- ADD THIS IMPORT
import mongoose from 'mongoose';

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

/**
 * MODIFIED FUNCTION
 * @desc    Get detailed information for a single speaker, including their videos with thumbnails.
 * @route   GET /api/speakers/details/:id
 * @access  Private (User must be logged in)
 */
export const userGetSpeakerDetailsWithVideos = async (req, res) => {
    try {
        const speakerId = new mongoose.Types.ObjectId(req.params.id);
        const userId = req.user._id;

        // 1. Get speaker's basic details
        const speaker = await Speaker.findById(speakerId).lean();
        if (!speaker) {
            return res.status(404).json({ success: false, error: 'Speaker not found.' });
        }

        // 2. Aggregate all topics/videos for this speaker
        const videoAggregation = await Topic.aggregate([
            // Stages 1-5 remain the same...
            { $match: { speaker_id: speakerId } },
            {
                $lookup: {
                    from: 'events',
                    localField: 'event_id',
                    foreignField: '_id',
                    as: 'eventInfo'
                }
            },
            { $match: { 'eventInfo.status': 'ACTIVE' } },
            { $unwind: '$eventInfo' },
            {
                $addFields: {
                    durationInSeconds: {
                        $let: {
                            vars: { parts: { $split: ["$video_duration", ":"] } },
                            in: {
                                $add: [
                                    { $multiply: [{ $toInt: { $arrayElemAt: ["$$parts", 0] } }, 3600] },
                                    { $multiply: [{ $toInt: { $arrayElemAt: ["$$parts", 1] } }, 60] },
                                    { $toInt: { $arrayElemAt: ["$$parts", 2] } }
                                ]
                            }
                        }
                    }
                }
            },
            // Stage 6: Group results and build videos array
            {
                $group: {
                    _id: null,
                    totalSeconds: { $sum: '$durationInSeconds' },
                    videos: {
                        $push: {
                            topicId: '$_id',
                            title: '$topic',
                            thumbnail: '$thumbnail', // <-- ADD THIS LINE
                             videoLink: '$video_link',
                            videoDuration: '$video_duration',
                            eventId: '$eventInfo._id',
                            eventName: '$eventInfo.fullName',
                            eventRegType: '$eventInfo.regType'
                        }
                    }
                }
            }
        ]);

        const result = videoAggregation[0] || { totalSeconds: 0, videos: [] };
        const totalMinutes = Math.round(result.totalSeconds / 60);
        let videos = result.videos;

        // 3. Check user's enrollment status for all relevant events
        if (videos.length > 0) {
            const eventIds = videos.map(v => v.eventId);
            const userEnrollments = await Enrollment.find({
                user_id: userId,
                event_id: { $in: eventIds },
                status: { $in: ['FREE_REGISTERED', 'PAID_SUCCESS'] }
            }).select('event_id').lean();

            const enrolledEventIds = new Set(userEnrollments.map(e => e.event_id.toString()));

            // 4. Add enrollment status to each video
            videos = videos.map(video => ({
                ...video,
                userEnrollmentStatus: enrolledEventIds.has(video.eventId.toString()) ? 'ENROLLED' : 'NOT_ENROLLED'
            }));
        }

        // 5. Assemble the final response object
        const responseData = {
            speakerDetails: {
                id: speaker._id,
                name: speaker.name,
                image: speaker.photo,
                affiliation: speaker.affiliation,
                location: [speaker.state, speaker.country].filter(Boolean).join(', '),
                totalVideos: videos.length,
                totalMinutes: totalMinutes
            },
            videos: videos
        };

        res.status(200).json({ success: true, data: responseData });

    } catch (error) {
        console.error('Get Speaker Details Error:', error);
        res.status(500).json({ success: false, error: 'Internal server error while fetching speaker details.' });
    }
};

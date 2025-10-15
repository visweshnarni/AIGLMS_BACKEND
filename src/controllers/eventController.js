import Event from '../models/Event.js'; // <-- ENSURE THIS IMPORT IS PRESENT
import Enrollment from '../models/Enrollment.js'; // <-- ENSURE THIS IMPORT IS PRESENT
import { uploadBufferToCloudinary } from '../utils/uploadToCloudinary.js';
import mongoose from 'mongoose';
import Topic from '../models/Topic.js';
import Session from '../models/Session.js'; 

// CRITICAL FIX: Assigning the imported models to local aliases
const EventModel = Event;
const EnrollmentModel = Enrollment;

const calculateEventDuration = async (eventId) => {
    try {
        const result = await Topic.aggregate([
            // Stage 1: Match all topics belonging to the specific event
            {
                $match: {
                    event_id: new mongoose.Types.ObjectId(eventId)
                }
            },
            // Stage 2: Convert the HH:MM:SS string to total seconds for each topic
            {
                $addFields: {
                    durationInSeconds: {
                        $let: {
                            vars: {
                                parts: { $split: ["$video_duration", ":"] }
                            },
                            in: {
                                $add: [
                                    { $multiply: [{ $toInt: { $arrayElemAt: ["$$parts", 0] } }, 3600] }, // Hours to seconds
                                    { $multiply: [{ $toInt: { $arrayElemAt: ["$$parts", 1] } }, 60] },   // Minutes to seconds
                                    { $toInt: { $arrayElemAt: ["$$parts", 2] } }                          // Seconds
                                ]
                            }
                        }
                    }
                }
            },
            // Stage 3: Group all matched topics and sum their total seconds
            {
                $group: {
                    _id: null, // Group all documents into a single result
                    totalSeconds: { $sum: '$durationInSeconds' }
                }
            }
        ]);

        // If topics were found and aggregated
        if (result.length > 0) {
            const totalSeconds = result[0].totalSeconds;
            // Convert total seconds to total minutes and round it
            const totalMinutes = Math.round(totalSeconds / 60);
            return totalMinutes;
        }

        // If no topics are found for the event, return 0
        return 0;

    } catch (error) {
        console.error("Error calculating event duration:", error);
        return 0; // Return 0 in case of an error
    }
};

// Helper function to handle event image upload
const handleEventImageUpload = async (req, eventShortName) => {
    if (req.file) {
        // Upload the new file buffer
        const buffer = req.file.buffer;
        const originalname = req.file.originalname;
        const filename = `${eventShortName}-${originalname.replace(/\s/g, '_')}`;
        const folderName = `lms/events/${eventShortName}`;

        // Ensure this utility function uses the correct name if you customized it
        const imageUrl = await uploadBufferToCloudinary(
            buffer,
            filename,
            folderName,
            'image' // Specify resource type for image
        );
        return imageUrl;
    }
    return null;
};

// =======================================================
// ADMIN MANAGEMENT FUNCTIONS
// =======================================================

// POST: Create New Event
export const adminCreateEvent = async (req, res) => {
    try {
        const { fullName, shortName, regType, amount, status, ...otherFields } = req.body;
        const adminId = req.admin._id;

        if (!fullName || !shortName || !regType || !status || (regType === 'PAID' && !amount)) {
            return res.status(400).json({ error: 'Missing required event fields.' });
        }

        // 1. Handle Image Upload
        let imageUrl = null;
        if (req.file) {
            imageUrl = await handleEventImageUpload(req, shortName);
        } else {
            return res.status(400).json({ error: 'Event image upload is required for creation.' });
        }
        
        // 2. Create the Event Document
        const event = new EventModel({ // <-- NOW USES CORRECT ALIAS
            ...req.body, // Includes all text fields from req.body
            image: imageUrl,
            createdBy: adminId,
            amount: regType === 'PAID' ? (parseFloat(amount) || 0) : 0,
        });

        await event.save();
        res.status(201).json({ success: true, message: 'Event created successfully.', event });

    } catch (error) {
        console.error('Admin Create Event Error:', error);
        res.status(500).json({ error: 'Internal server error while creating event.', details: error.message });
    }
};

// GET: Admin - Get all events (including DRAFTs)
export const adminGetAllEvents = async (req, res) => {
    try {
        const events = await EventModel.find().sort({ createdAt: -1 }); // <-- NOW USES CORRECT ALIAS
        res.status(200).json({ success: true, count: events.length, events });
    } catch (error) {
        console.error('Admin Get All Events Error:', error.message);
        res.status(500).json({ error: 'Internal server error while fetching events.' });
    }
};

// PUT/PATCH: Update Event Details
export const adminUpdateEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const currentData = await EventModel.findById(eventId); // <-- NOW USES CORRECT ALIAS
        
        if (!currentData) {
            return res.status(404).json({ error: 'Event not found.' });
        }

        let updateData = { ...req.body };
        
        // 1. Handle File Upload (Image)
        let newImageUrl = null;
        if (req.file) {
            const shortName = req.body.shortName || currentData.shortName;
            newImageUrl = await handleEventImageUpload(req, shortName);
            updateData.image = newImageUrl;
        } else {
            updateData.image = currentData.image;
        }

        // 2. Handle conditional field types
        if (updateData.regType === 'FREE') {
            updateData.amount = 0;
        } else if (updateData.amount) {
            updateData.amount = parseFloat(updateData.amount);
        }
        
        // 3. Perform the update
        const updatedEvent = await EventModel.findByIdAndUpdate( // <-- NOW USES CORRECT ALIAS
            eventId, 
            { $set: updateData }, 
            { new: true, runValidators: true }
        );

        if (!updatedEvent) {
            return res.status(404).json({ error: 'Event not found.' });
        }

        res.status(200).json({ success: true, message: 'Event updated successfully.', event: updatedEvent });
    } catch (error) {
        console.error('Admin Update Event Error:', error.message);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, error: error.message });
        }
        res.status(500).json({ error: 'Internal server error while updating event.' });
    }
};

// DELETE: Delete an Event
export const adminDeleteEvent = async (req, res) => {
    try {
        const result = await EventModel.findByIdAndDelete(req.params.id); // <-- NOW USES CORRECT ALIAS
        
        if (!result) {
            return res.status(404).json({ error: 'Event not found.' });
        }

        res.status(200).json({ success: true, message: 'Event deleted successfully.' });
    } catch (error) {
        console.error('Admin Delete Event Error:', error.message);
        res.status(500).json({ error: 'Internal server error while deleting event.' });
    }
};

// =======================================================
// PUBLIC/USER FUNCTIONS
// =======================================================

// GET: Public - Get a list of all ACTIVE events
export const userGetActiveEvents = async (req, res) => {
    try {
        const sortType = req.query.sort || 'newest';
        let events;

        if (sortType === 'popularity') {
            // Aggregate events by enrollment count, sort descending
            const popularEvents = await Enrollment.aggregate([
                { $group: { _id: "$event_id", enrollCount: { $sum: 1 } } },
                { $sort: { enrollCount: -1 } }
            ]);
            const eventOrder = popularEvents.map(e => e._id);

            // Fetch ACTIVE events and preserve order by popularity
            events = await Event.find({ status: 'ACTIVE', _id: { $in: eventOrder } });
            // Sort events array to match popularity order
            events = eventOrder.map(id => events.find(e => e._id.equals(id))).filter(e => e);
        } else {
            // Default to 'newest' sort (by start date DESC)
            events = await Event.find({ status: 'ACTIVE' }).sort({ start_date: -1 });
        }

        res.status(200).json({ success: true, count: events.length, events });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error while fetching events.' });
    }
};

// GET: Detailed Event View (Public/Gated Landing Page)
export const userGetEventDetails = async (req, res) => {
    try {
        const eventId = req.params.id;
        
        const event = await EventModel.findOne({ _id: eventId, status: 'ACTIVE' }); // <-- NOW USES CORRECT ALIAS

        if (!event) {
            return res.status(404).json({ error: 'Event not found or is inactive.' });
        }

        const response = {
            event: event,
            isEnrolled: false,
            enrollmentStatus: null,
        };

        // Check enrollment status (requires Enrollment Model to be used)
        if (req.user) {
            const enrollment = await EnrollmentModel.findOne({ // <-- NOW USES CORRECT ALIAS
                user_id: req.user._id,
                event_id: eventId
            });

            if (enrollment) {
                response.isEnrolled = true;
                response.enrollmentStatus = enrollment.status;
            }
        }
        
        res.status(200).json({ success: true, data: response });
    } catch (error) {
        console.error('User Get Event Details Error:', error.message);
        res.status(500).json({ error: 'Internal server error while fetching event details.' });
    }
};

// Get all Active Free events
/**
 * MODIFIED HELPER FUNCTION:
 * A helper function to fetch, sort, and enrich active events by their registration type.
 * Now includes 'alphabetical' sort AND counts for sessions and topics.
 * @param {'FREE' | 'PAID'} regType - The registration type of events to fetch.
 * @param {'newest' | 'popularity' | 'alphabetical'} sortType - The sorting criteria.
 * @returns {Promise<Array>} - A promise that resolves to an array of enriched event objects.
 */
const getActiveEventsByType = async (regType, sortType) => {
    // 1. Get all enrollments to calculate popularity
    const popularityCounts = await EnrollmentModel.aggregate([
        { $group: { _id: "$event_id", count: { $sum: 1 } } }
    ]);
    const popularityMap = new Map(
        popularityCounts.map(item => [item._id.toString(), item.count])
    );

    // 2. Fetch all active events of the specified type
    const events = await EventModel.find({ status: 'ACTIVE', regType }).lean();

    // 3. Enrich events with popularity, duration, AND session/topic counts
    const enrichedEvents = await Promise.all(
        events.map(async (event) => {
            // Existing calculations
            const eventDuration = await calculateEventDuration(event._id);
            const popularity = popularityMap.get(event._id.toString()) || 0;

            // --- NEW LOGIC TO COUNT SESSIONS AND TOPICS ---
            // Count total topics/videos for this event
            const totalTopics = await Topic.countDocuments({ event_id: event._id });
            
            // Count distinct sessions that have topics for this event
            const distinctSessionIds = await Topic.distinct('session_id', { event_id: event._id });
            const totalSessions = distinctSessionIds.length;
            // --- END OF NEW LOGIC ---

            return {
                ...event,
                duration: eventDuration,
                popularity: popularity,
                totalSessions: totalSessions, // <-- ADDED
                totalTopics: totalTopics      // <-- ADDED
            };
        })
    );

    // 4. Sort the results based on the sortType parameter
    if (sortType === 'popularity') {
        enrichedEvents.sort((a, b) => b.popularity - a.popularity);
    } else if (sortType === 'alphabetical') {
        enrichedEvents.sort((a, b) => a.fullName.localeCompare(b.fullName));
    } else { // Default to 'newest'
        enrichedEvents.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    }

    return enrichedEvents;
};
// =======================================================
// PUBLIC/USER FUNCTIONS (UPDATED)
// =======================================================

// ... (keep userGetActiveEvents and userGetEventDetails as they are)


// GET: Get all Active Free events (now with sorting)
export const userGetActiveFreeEvents = async (req, res) => {
    try {
        const sortType = req.query.sort || 'newest'; // Default to 'newest'
        const events = await getActiveEventsByType('FREE', sortType);
        res.status(200).json({ success: true, count: events.length, events });
    } catch (error) {
        console.error('Error fetching free events:', error.message);
        res.status(500).json({ error: 'Internal server error while fetching free events.' });
    }
};

// GET: Get all Active Paid events (now with enhanced sorting)
export const userGetActivePaidEvents = async (req, res) => {
    try {
        const sortType = req.query.sort || 'newest';
        const events = await getActiveEventsByType('PAID', sortType);
        res.status(200).json({ success: true, count: events.length, events });
    } catch (error) {
        console.error('Error fetching paid events:', error.message);
        res.status(500).json({ error: 'Internal server error while fetching paid events.' });
    }
}

// NEW: Get Detailed Event View with Sessions, Topics, and Enrollment Status
export const userGetPublicEventDetails = async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user?._id; // Get user ID if available from 'protect' middleware

        // 1. Fetch the main event details
        const event = await EventModel.findOne({ _id: eventId, status: 'ACTIVE' }).lean();

        if (!event) {
            return res.status(404).json({ success: false, error: 'Event not found or is inactive.' });
        }

        // 2. Fetch all topics for the event and join with speaker/session details
        const topics = await Topic.aggregate([
            { $match: { event_id: new mongoose.Types.ObjectId(eventId) } },
            {
                $lookup: {
                    from: 'speakers', // The collection name for speakers
                    localField: 'speaker_id',
                    foreignField: '_id',
                    as: 'speakerInfo'
                }
            },
            {
                $lookup: {
                    from: 'sessions', // The collection name for sessions
                    localField: 'session_id',
                    foreignField: '_id',
                    as: 'sessionInfo'
                }
            },
            { $unwind: { path: '$speakerInfo', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$sessionInfo', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    topic: 1,
                    video_link: 1,
                    thumbnail: 1,
                    video_duration: 1,
                    session_id: '$sessionInfo._id',
                    sessionName: '$sessionInfo.name',
                    speakerName: '$speakerInfo.name'
                }
            }
        ]);

        // 3. Group topics by session
        const sessionsMap = new Map();
        topics.forEach(topic => {
            const sessionId = topic.session_id?.toString() || 'general';
            const sessionName = topic.sessionName || 'General Session';

            if (!sessionsMap.has(sessionId)) {
                sessionsMap.set(sessionId, {
                    _id: sessionId,
                    name: sessionName,
                    topics: []
                });
            }
            sessionsMap.get(sessionId).topics.push(topic);
        });
        const sessionsArray = Array.from(sessionsMap.values());

        // 4. Check user's enrollment status
        let enrollment = null;
        if (userId) {
            enrollment = await EnrollmentModel.findOne({ user_id: userId, event_id: eventId });
        }

        // 5. Assemble the final, detailed response
        const responseData = {
            ...event,
            duration: await calculateEventDuration(eventId), // Calculate total duration
            isEnrolled: !!enrollment,
            enrollmentStatus: enrollment?.status || null,
            totalSessions: sessionsArray.length,
            totalVideos: topics.length,
            sessions: sessionsArray,
        };

        res.status(200).json({ success: true, data: responseData });

    } catch (error) {
        console.error('User Get Public Event Details Error:', error.message);
        res.status(500).json({ success: false, error: 'Internal server error while fetching event details.' });
    }
};


/**
 * MODIFIED FUNCTION:
 * @desc    Get all events a specific user is registered for, with popularity and sorting.
 * @route   GET /api/events/registered?sort={newest|popularity|alphabetical}
 * @access  Private (User must be logged in)
 */
export const userGetRegisteredEvents = async (req, res) => {
    try {
        const userId = req.user._id;
        const sortType = req.query.sort || 'newest'; // Get sort type from query

        // Find all successful enrollments for the user
        const enrollments = await EnrollmentModel.find({
            user_id: userId,
            status: { $in: ['FREE_REGISTERED', 'PAID_SUCCESS'] }
        }).populate({
            path: 'event_id',
            model: 'Event'
        }); // We will sort in the application logic after enriching

        if (!enrollments || enrollments.length === 0) {
            return res.status(200).json({ success: true, count: 0, events: [] });
        }

        // Enrich the event data with aggregated details
        let registeredEventsList = await Promise.all(
            enrollments.map(async (enrollment) => {
                const event = enrollment.event_id;
                if (!event) return null;

                const totalVideos = await Topic.countDocuments({ event_id: event._id });
                const distinctSessions = await Topic.distinct('session_id', { event_id: event._id });
                const totalSessions = distinctSessions.length;
                const totalDurationMinutes = await calculateEventDuration(event._id);
                // NEW: Calculate popularity (total enrollments)
                const popularity = await EnrollmentModel.countDocuments({ event_id: event._id });

                return {
                    id: event._id,
                    name: event.fullName,
                    startDate: event.start_date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                    endDate: event.end_date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                    location: `${event.venue}, ${event.city}`,
                    videos: `${totalVideos} recorded videos`,
                    sessions: `${totalSessions} Sessions`,
                    duration: `${totalDurationMinutes} mins total event`,
                    registeredOn: enrollment.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                    // Keep raw date for sorting
                    rawRegisteredOn: enrollment.createdAt,
                    image: event.image,
                    // NEW: Add popularity to the response
                    popularity: popularity,
                };
            })
        );

        // Filter out any null results
        let finalEvents = registeredEventsList.filter(event => event !== null);

        // NEW: Apply sorting based on the query parameter
        if (sortType === 'popularity') {
            finalEvents.sort((a, b) => b.popularity - a.popularity);
        } else if (sortType === 'alphabetical') {
            finalEvents.sort((a, b) => a.name.localeCompare(b.name));
        } else { // Default to 'newest'
            finalEvents.sort((a, b) => new Date(b.rawRegisteredOn) - new Date(a.rawRegisteredOn));
        }

        res.status(200).json({ success: true, count: finalEvents.length, events: finalEvents });

    } catch (error) {
        console.error('Error fetching registered events:', error.message);
        res.status(500).json({ success: false, error: 'Internal server error while fetching registered events.' });
    }
};

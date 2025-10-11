import Session from '../models/Session.js';
import mongoose from 'mongoose';
// Assuming these imports are available in your structure:
import Event from '../models/Event.js'; 
import Enrollment from '../models/Enrollment.js'; 

const EventModel = Event;
const EnrollmentModel = Enrollment;

// CREATE session (admin only)
export const adminCreateSession = async (req, res) => {
    try {
        // Removed 'order' from destructuring
        const { event_id, title, startDate, startTime, endTime, hall } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(event_id)) {
            return res.status(400).json({ error: 'Invalid event ID format.' });
        }
        
        if (!event_id || !title || !startDate || !startTime) {
            return res.status(400).json({ error: 'Missing required session fields.' });
        }

        // Optional: Verify event_id exists and is ACTIVE/DRAFT
        const event = await EventModel.findById(event_id);
        if (!event) {
            return res.status(404).json({ error: 'Parent Event not found.' });
        }
        
        // Removed 'order' from instantiation
        const session = new Session({ event_id, title, startDate, startTime, endTime, hall });
        await session.save();
        
        res.status(201).json({ success: true, session });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: 'A session with this title already exists for this event.' });
        }
        res.status(500).json({ error: 'Error creating session.', details: err.message });
    }
};

// UPDATE session (admin only)
export const adminUpdateSession = async (req, res) => {
    try {
        // req.body contains the fields to update (order is now ignored)
        const session = await Session.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!session) {
            return res.status(404).json({ error: 'Session not found.' });
        }
        res.status(200).json({ success: true, session });
    } catch (err) {
        res.status(500).json({ error: 'Error updating session.', details: err.message });
    }
};

// DELETE session (admin only)
export const adminDeleteSession = async (req, res) => {
    try {
        const deleted = await Session.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Session not found.' });
        }
        // NOTE: In a complete system, you would also delete all associated Topics here.
        res.status(200).json({ success: true, message: 'Session deleted.' });
    } catch (err) {
        res.status(500).json({ error: 'Error deleting session.', details: err.message });
    }
};

// GET all sessions for an event (public/user)
export const getEventSessions = async (req, res) => {
    try {
        const { eventId } = req.params;

        // CRITICAL FIX: Sorting by startDate and then startTime (the primary sort)
        const sessions = await Session.find({ event_id: eventId })
            .sort({ startDate: 1, startTime: 1 }); // Sort by Date, then Time

        res.status(200).json({ success: true, count: sessions.length, sessions });
    } catch (err) {
        res.status(500).json({ error: 'Error fetching sessions.', details: err.message });
    }
};

// GET session details (public/user)
export const getSessionDetails = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session) return res.status(404).json({ error: 'Session not found.' });
        
        // NOTE: In a complete system, this is where you would check enrollment status 
        // to determine if video content (Topics) should be included.
        
        res.status(200).json({ success: true, session });
    } catch (err) {
        res.status(500).json({ error: 'Error fetching session details.', details: err.message });
    }
};

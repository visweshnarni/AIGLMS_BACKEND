// controllers/sessionController.js
import Session from '../models/Session.js';

// CREATE session (admin only)
export const adminCreateSession = async (req, res) => {
    try {
        const { event_id, title, startDate, startTime, endTime, hall, order } = req.body;
        if (!event_id || !title || !startDate || !startTime) {
            return res.status(400).json({ error: 'Missing required session fields.' });
        }
        const session = new Session({ event_id, title, startDate, startTime, endTime, hall, order });
        await session.save();
        res.status(201).json({ success: true, session });
    } catch (err) {
        res.status(500).json({ error: 'Error creating session.', details: err.message });
    }
};

// UPDATE session (admin only)
export const adminUpdateSession = async (req, res) => {
    try {
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
        res.status(200).json({ success: true, message: 'Session deleted.' });
    } catch (err) {
        res.status(500).json({ error: 'Error deleting session.', details: err.message });
    }
};

// GET all sessions for an event (public/user)
export const getEventSessions = async (req, res) => {
    try {
        const { eventId } = req.params;
        const sessions = await Session.find({ event_id: eventId }).sort({ order: 1, startDate: 1, startTime: 1 });
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
        res.status(200).json({ success: true, session });
    } catch (err) {
        res.status(500).json({ error: 'Error fetching session details.', details: err.message });
    }
};

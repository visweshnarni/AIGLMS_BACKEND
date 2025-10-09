import Event from '../models/Event.js'; // <-- ENSURE THIS IMPORT IS PRESENT
import Enrollment from '../models/Enrollment.js'; // <-- ENSURE THIS IMPORT IS PRESENT
import { uploadBufferToCloudinary } from '../utils/uploadToCloudinary.js';
import mongoose from 'mongoose';

// CRITICAL FIX: Assigning the imported models to local aliases
const EventModel = Event;
const EnrollmentModel = Enrollment;

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
        const events = await EventModel.find({ status: 'ACTIVE' }).sort({ startDate: 1 }); // <-- NOW USES CORRECT ALIAS

        res.status(200).json({ success: true, count: events.length, events });
    } catch (error) {
        console.error('User Get Active Events Error:', error.message);
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

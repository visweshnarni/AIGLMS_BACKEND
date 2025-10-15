import Enrollment from '../models/Enrollment.js';
import Event from '../models/Event.js';
import Payment from '../models/Payment.js';

// User registers for FREE event or updates if exists
export const userRegisterFreeEvent = async (req, res) => {
    try {
        const userId = req.user._id;
        // --- UPDATED: Destructure fullName and email from body ---
        const { event_id, fullName, email } = req.body;

        // --- UPDATED: Validate all required fields ---
        if (!event_id || !fullName || !email) {
            return res.status(400).json({ error: 'Event ID, Full Name, and Email are required' });
        }

        // Verify event exists and is FREE type
        const event = await Event.findById(event_id);
        if (!event) return res.status(404).json({ error: 'Event not found' });
        if (event.regType !== 'FREE') {
            return res.status(400).json({ error: 'This event does not offer free registration' });
        }

        // Upsert enrollment: create or update to FREE_REGISTERED
        const enrollment = await Enrollment.findOneAndUpdate(
            { user_id: userId, event_id },
            {
                // --- UPDATED: Add new fields to the update object ---
                status: 'FREE_REGISTERED',
                purchaseDate: new Date(),
                amountPaid: 0,
                payment_id: null,
                eventCertificateName: fullName, // Save the name for the certificate
                eventRegistrationEmail: email,  // Save the registration email
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({ success: true, message: 'Successfully registered for the event!', enrollment });
    } catch (error) {
        console.error('Free Registration Error:', error);
        // Handle potential duplicate key error nicely
        if (error.code === 11000) {
            return res.status(409).json({ error: 'You are already registered for this event.' });
        }
        res.status(500).json({ error: 'Internal server error during registration.' });
    }
};

// User initiates paid event enrollment (simulate payment for now)



export const userInitiatePaidEvent = async (req, res) => {
    try {
        const userId = req.user._id;
        const { event_id, amountPaid, payment_id } = req.body;

        if (!event_id || amountPaid == null || !payment_id) {
            return res.status(400).json({ error: 'Missing required payment details' });
        }

        // Verify event exists and is PAID type
        const event = await Event.findById(event_id);
        if (!event) return res.status(404).json({ error: 'Event not found' });

        // Check event status: only ACTIVE events allow payment
        if (event.status !== 'ACTIVE') {
            return res.status(400).json({ error: 'Cannot pay for an event that is not active' });
        }

        if (event.regType !== 'PAID') {
            return res.status(400).json({ error: 'Event is not a paid event' });
        }

        // Check that amountPaid matches or exceeds event amount
        if (amountPaid < event.amount) {
            return res.status(400).json({ error: 'Amount paid is less than event price' });
        }

        // Upsert enrollment with PAID_SUCCESS after payment confirmation
        const enrollment = await Enrollment.findOneAndUpdate(
            { user_id: userId, event_id },
            {
                status: 'PAID_SUCCESS',
                purchaseDate: new Date(),
                amountPaid,
                payment_id,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Create payment record
        const payment = new Payment({
            user_id: userId,
            event_id,
            transactionId: payment_id,
            paymentGateway: 'Instamojo', // or dynamic if you support multiple gateways
            amount: amountPaid,
            status: 'SUCCESS',
            paymentDate: new Date(),
        });
        await payment.save();

        res.status(200).json({ success: true, enrollment, payment });
    } catch (error) {
        console.error('Paid Enrollment Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Admin: fetch all enrollments (optionally filtered by event or user)
export const adminGetAllEnrollments = async (req, res) => {
    try {
        const { event_id, user_id } = req.query;
        const filter = {};
        if (event_id) filter.event_id = event_id;
        if (user_id) filter.user_id = user_id;

        const enrollments = await Enrollment.find(filter)
            .populate('user_id', 'name email')
            .populate('event_id', 'fullName shortName regType amount')
            .sort({ purchaseDate: -1 });

        res.status(200).json({ success: true, count: enrollments.length, enrollments });
    } catch (error) {
        console.error('Admin Get Enrollments Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// User: fetch their enrollments to access registered events
export const userGetEnrollments = async (req, res) => {
    try {
        const userId = req.user._id;
        const enrollments = await Enrollment.find({
            user_id: userId,
            status: { $in: ['FREE_REGISTERED', 'PAID_SUCCESS'] },
        }).populate('event_id', 'fullName shortName regType amount');

        res.status(200).json({ success: true, enrollments });
    } catch (error) {
        console.error('User Get Enrollments Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

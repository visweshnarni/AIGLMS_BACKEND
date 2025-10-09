import Payment from '../models/Payment.js';

// Get all payments (optionally filtered by user or event)
export const adminGetAllPayments = async (req, res) => {
    try {
        const { user_id, event_id } = req.query;
        const filter = {};
        if (user_id) filter.user_id = user_id;
        if (event_id) filter.event_id = event_id;

        const payments = await Payment.find(filter)
            .populate('user_id', 'name email')
            .populate('event_id', 'fullName shortName')
            .sort({ paymentDate: -1 });

        res.status(200).json({ success: true, count: payments.length, payments });
    } catch (error) {
        console.error('Admin Get Payments Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get payment by ID
export const adminGetPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('user_id', 'name email')
            .populate('event_id', 'fullName shortName');

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        res.status(200).json({ success: true, payment });
    } catch (error) {
        console.error('Admin Get Payment By ID Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update payment by ID
export const adminUpdatePayment = async (req, res) => {
    try {
        const updateData = req.body;

        const updatedPayment = await Payment.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedPayment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        res.status(200).json({ success: true, payment: updatedPayment });
    } catch (error) {
        console.error('Admin Update Payment Error:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, error: error.message });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete payment by ID
export const adminDeletePayment = async (req, res) => {
    try {
        const deletedPayment = await Payment.findByIdAndDelete(req.params.id);

        if (!deletedPayment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        res.status(200).json({ success: true, message: 'Payment deleted successfully' });
    } catch (error) {
        console.error('Admin Delete Payment Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
// Get payments of the logged-in user
export const userGetPayments = async (req, res) => {
    try {
        const userId = req.user._id; // Assume user is authenticated and user info is in req.user

        const payments = await Payment.find({ user_id: userId })
            .populate('event_id', 'fullName shortName regType amount')
            .sort({ paymentDate: -1 });

        res.status(200).json({ success: true, count: payments.length, payments });
    } catch (error) {
        console.error('User Get Payments Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


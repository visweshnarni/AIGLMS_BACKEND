import User from '../models/User.js';

// Get all users (admin only)
export const adminGetAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json({ success: true, count: users.length, users });
    } catch (error) {
        console.error('Admin Get All Users Error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get user by ID (admin only)
export const adminGetUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error('Admin Get User By ID Error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update user by ID (admin only)
export const adminUpdateUser = async (req, res) => {
    try {
        const { password, ...updateFields } = req.body; // don't update password here
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true, runValidators: true, select: '-password' }
        );
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ success: true, user: updatedUser });
    } catch (error) {
        console.error('Admin Update User Error:', error.message);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, error: error.message });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete user by ID (admin only)
export const adminDeleteUser = async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Admin Delete User Error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

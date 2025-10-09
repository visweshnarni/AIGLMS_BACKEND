import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

// --- Helper Function ---
// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'YOUR_SECRET_KEY', { expiresIn: '1d' }); // Shorter expiry for admin
};

// ---------------- Admin Login ----------------
export const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        // 1. Find admin by email
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(400).json({ error: 'Invalid credentials.' });
        }

        // 2. Password Check (Direct comparison, as requested)
        if (password !== admin.password) {
            return res.status(400).json({ error: 'Invalid credentials.' });
        }

        // 3. Successful Login Response
        const token = generateToken(admin._id);

        res.status(200).json({
            success: true,
            message: 'Admin login successful',
            token,
            admin: {
                id: admin._id,
                email: admin.email,
            },
        });
    } catch (error) {
        console.error('Admin Login Error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ---------------- Get Admin Profile (Protected) ----------------
export const getAdminProfile = async (req, res) => {
    // req.admin is set by the protectAdmin middleware
    res.json({
        success: true,
        message: 'Admin profile access granted.',
        admin: req.admin, // The admin object is already attached by the middleware
    });
};
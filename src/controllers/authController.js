import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { uploadBufferToCloudinary } from '../utils/uploadToCloudinary.js';

// --- Helper Function ---
// Generate JWT token
const generateToken = (id) => {
    // Uses a placeholder JWT_SECRET, ensure it's in your .env
    return jwt.sign({ id }, process.env.JWT_SECRET || 'YOUR_SECRET_KEY', { expiresIn: '7d' });
};


/**
 * NEW HELPER FUNCTION
 * Handles uploading a user's profile photo to Cloudinary.
 */
const handleProfilePhotoUpload = async (req, userId) => {
    if (req.file) {
        const buffer = req.file.buffer;
        const originalname = req.file.originalname;
        // Create a unique filename for the user's profile photo
        const filename = `profile-${userId}-${Date.now()}`;
        const folderName = `lms/users/${userId}`;

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
// ---------------- Signup ----------------
export const signup = async (req, res) => {
    try {
        const { prefix, fullName, email, mobile, country, password } = req.body;

        if (!fullName || !email || !mobile || !password) {
            return res.status(400).json({ error: 'Full Name, Email, Mobile, and Password are required.' });
        }

        // Check if user exists by email or mobile
        const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
        if (existingUser) {
            const conflictField = existingUser.email === email ? 'Email' : 'Mobile number';
            return res.status(409).json({ error: `${conflictField} already exists` });
        }

        // Create new user (using direct password storage as requested)
        const user = new User({ prefix, fullName, email, mobile, country, password });
        await user.save();

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'User registered successfully.',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                mobile: user.mobile,
            },
        });
    } catch (error) {
        console.error('Signup Error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ---------------- Login ----------------
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials.' });
        }

        // Password Check (Direct comparison, as requested)
        if (password !== user.password) { 
            return res.status(400).json({ error: 'Invalid credentials.' });
        }
        
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
            },
        });
    } catch (error) {
        console.error('Login Error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ---------------- Get Profile ----------------
export const getProfile = async (req, res) => {
    try {
        // req.user is set by the protect middleware
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            success: true,
            user,
        });
    } catch (error) {
        console.error("Profile Error:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ---------------- MODIFIED: Update Profile ----------------
export const updateProfile = async (req, res) => {
    try {
        const userIdToEdit = req.params.id || req.user._id;

        // 1. Handle Image Upload
        // If a new file is uploaded, this will return the Cloudinary URL.
        const newPhotoUrl = await handleProfilePhotoUpload(req, userIdToEdit);

        // 2. Prepare text fields for update
        // The 'profilePhoto' field is excluded as it's handled separately.
        const {
            prefix, fullName, mobile, country,
            designation, affiliationHospital, state, city, pincode
        } = req.body;

        const updateData = {
            prefix, fullName, mobile, country,
            designation, affiliationHospital, state, city, pincode
        };

        // 3. Add the new photo URL to the update object if it exists
        if (newPhotoUrl) {
            updateData.profilePhoto = newPhotoUrl;
        }

        // 4. Remove any fields that were not provided in the request
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        // 5. Find and update the user in the database
        const updatedUser = await User.findByIdAndUpdate(
            userIdToEdit,
            { $set: updateData },
            { new: true, runValidators: true, select: '-password' }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully.',
            user: updatedUser
        });
    } catch (error) {
        console.error('Profile Update Error:', error.message);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

// Import Routes
import authRoutes from './src/routes/authRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import eventRoutes from './src/routes/eventRoutes.js'; // <-- NEW
import sessionRoutes from './src/routes/sessionRoutes.js';
import speakerRoutes from './src/routes/speakerRoutes.js';
import topicRoutes from './src/routes/topicRoutes.js'; // Uncomment if topic routes are needed


// --- Configuration Setup ---
dotenv.config();

// For __dirname replacement in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --- Middleware ---
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Body parser for JSON
app.use(cookieParser()); // Cookie parser

// Optional: Static folder setup (if you will upload profile photos)
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Database Connection ---
const connectDB = async () => {
    try {
        // Use a placeholder MONGO_URI, replace with your actual one in .env
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lms_db');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1); // Exit process with failure
    }
};


// --- Routes ---
app.use('/api/auth', authRoutes);
// NEW: Admin Routes
app.use('/api/admin', adminRoutes); 
app.use('/api/events', eventRoutes); // NEW: Event Routes
app.use('/api/sessions', sessionRoutes);
app.use('/api/speakers', speakerRoutes);
app.use('/api/topics', topicRoutes); // Uncomment if topic routes are needed


// Base Route
app.get('/', (req, res) => res.send('🎉 LMS API is Running!'));

// --- Start Server ---
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB(); // Ensure DB is connected before starting server

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
};

startServer();
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    try {
        let token;
        
        // Check for token in Authorization header (Bearer Token)
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } 
        // Optional: check for token in cookies if you decide to use them
        // else if (req.cookies?.token) {
        //     token = req.cookies.token;
        // }

        if (!token) {
            return res.status(401).json({ success: false, error: 'Not authorized, token missing' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'YOUR_SECRET_KEY');
        const userId = decoded.id;

        // Fetch user without password
        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            return res.status(401).json({ success: false, error: 'Not authorized, user not found' });
        }

        req.user = user;
        next();
        
    } catch (err) {
        console.error('Auth error:', err.message);
        res.status(401).json({ success: false, error: 'Token is invalid or expired' });
    }
};
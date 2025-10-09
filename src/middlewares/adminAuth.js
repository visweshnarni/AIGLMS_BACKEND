import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

export const protectAdmin = async (req, res, next) => {
    try {
        let token;
        
        // 1. Check for token in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } 

        if (!token) {
            // Unauthorized (401)
            return res.status(401).json({ success: false, error: 'Not authorized, admin token missing' });
        }

        // 2. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'YOUR_SECRET_KEY');
        const adminId = decoded.id; // The ID stored in the token should be the Admin's ID

        // 3. Fetch Admin user without password
        const admin = await Admin.findById(adminId).select('-password');
        
        if (!admin) {
            // Forbidden (403) - The token is valid but the user isn't found/isn't an Admin
            return res.status(403).json({ success: false, error: 'Access denied. Only registered admins can access this.' });
        }

        req.admin = admin; // Attach the admin user to the request object
        next();
        
    } catch (err) {
        console.error('Admin Auth error:', err.message);
        // Invalid or expired token (401)
        res.status(401).json({ success: false, error: 'Admin token is invalid or expired' });
    }
};
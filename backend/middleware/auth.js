// middleware/auth.js – JWT authentication & role guards
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'hostelms_secret';

/**
 * authenticate – verifies Bearer JWT token
 * Attaches decoded user to req.user
 */
function authenticate(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided. Please log in.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Session expired. Please log in again.' });
        }
        return res.status(401).json({ message: 'Invalid token. Please log in.' });
    }
}

/**
 * requireAdmin – must be used after authenticate
 * Rejects non-admin users with 403
 */
function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
}

module.exports = { authenticate, requireAdmin };

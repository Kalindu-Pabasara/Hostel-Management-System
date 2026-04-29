const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'hostelms_secret';

/* POST /api/auth/register */
router.post('/register', async (req, res) => {
    try {
        const { name, email, nic, phone, password, role = 'student' } = req.body;
        if (!name || !email || !nic || !phone || !password)
            return res.status(400).json({ message: 'All fields are required.' });

        if (db.users.findBy('email', email))
            return res.status(409).json({ message: 'Email already registered.' });

        const hashed = await bcrypt.hash(password, 12);
        const user = db.users.create({ name, email, nic, phone, password: hashed, role, status: 'active' });
        res.status(201).json({ message: 'Registration successful.', userId: user.id });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

/* POST /api/auth/login */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ message: 'Email and password required.' });

        const user = db.users.findBy('email', email);
        if (!user) return res.status(401).json({ message: 'Invalid email or password.' });
        if (user.status === 'inactive')
            return res.status(403).json({ message: 'Account deactivated. Contact admin.' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ message: 'Invalid email or password.' });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET, { expiresIn: '24h' }
        );
        const { password: _, ...userInfo } = user;
        res.json({ message: 'Login successful.', token, user: userInfo });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

/* POST /api/auth/refresh */
router.post('/refresh', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ message: 'No token provided' });
        const token = authHeader.split(' ')[1];
        
        // Verify ignoring expiration to allow refreshing an expired token (or just decode)
        const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
        const user = db.users.findBy('id', decoded.id);
        
        if (!user || user.status === 'inactive') return res.status(401).json({ message: 'User invalid or inactive.' });

        const newToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET, { expiresIn: '24h' }
        );
        res.json({ token: newToken });
    } catch (err) { res.status(401).json({ message: 'Invalid token.' }); }
});

module.exports = router;


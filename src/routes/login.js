const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

// /mnt/e/Vercam/Vercam/src/routes/login.js

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';
const JWT_EXPIRES_IN = '1h';

// Rate limiter for login attempts
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 8, // max attempts per IP in window
    message: { ok: false, error: 'Too many login attempts, try again later' }
});

const { findUserByEmail } = require('../lib/users');

// Auth middleware: checks JWT from cookie or Authorization header
function authenticateJWT(req, res, next) {
    const authHeader = req.get('Authorization') || '';
    const tokenFromHeader = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const token = tokenFromHeader || req.cookies && req.cookies.token;

    if (!token) {
        return res.status(401).json({ ok: false, error: 'Missing token' });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = { id: payload.id, email: payload.email, name: payload.name };
        next();
    } catch (err) {
        return res.status(401).json({ ok: false, error: 'Invalid or expired token' });
    }
}

// GET /login
// If using server-side rendering, implement a view named 'login'.
// Otherwise this returns a JSON hint.
router.get('/login', (req, res) => {
    if (typeof res.render === 'function') {
        return res.render('login');
    }
    res.json({ ok: true, message: 'POST /login with { email, password } to authenticate' });
});

// POST /login
router.post(
    '/login',
    loginLimiter,
    body('email').isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 6 }),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ ok: false, errors: errors.array() });
        }

        // Use Passport local strategy (configured in app)
        passport.authenticate('local', { session: false }, async (err, user, info) => {
            if (err) return next(err);
            if (!user) {
                return res.status(401).json({ ok: false, error: info && info.message ? info.message : 'Invalid credentials' });
            }

            // On success create JWT as before
            const tokenPayload = { id: user.id, email: user.email, name: user.name };
            const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 1000 // 1 hour
            });

            res.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
        })(req, res, next);
    }
);

// POST /logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ ok: true, message: 'Logged out' });
});

// GET /me - returns authenticated user's profile
router.get('/me', authenticateJWT, (req, res) => {
    res.json({ ok: true, user: req.user });
});

module.exports = router;
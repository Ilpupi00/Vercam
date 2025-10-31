const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/user');

const router = express.Router();

// Sostituire con il tuo modello User (es. Mongoose)

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const JWT_EXPIRES_IN = '1h';

// Middleware di autenticazione: controlla header Authorization: Bearer <token>
function authenticateToken(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Token mancante' });

    const token = auth.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, payload) => {
        if (err) return res.status(401).json({ error: 'Token non valido' });
        req.userId = payload.sub;
        next();
    });
}

// POST /session -> login (email + password) -> restituisce JWT e dati utente minimali
router.post(
    '/',
    [
        body('email').isEmail().withMessage('Email non valida'),
        body('password').isString().notEmpty().withMessage('Password richiesta'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

        const { email, password } = req.body;
        try {
            const user = await User.findOne({ email });
            if (!user) return res.status(401).json({ error: 'Credenziali non valide' });

            const match = await bcrypt.compare(password, user.password);
            if (!match) return res.status(401).json({ error: 'Credenziali non valide' });

            const token = jwt.sign({ sub: user._id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

            return res.json({
                token,
                expiresIn: JWT_EXPIRES_IN,
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
            });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Errore server' });
        }
    }
);

// GET /session -> restituisce l'utente corrente (usa Bearer token)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) return res.status(404).json({ error: 'Utente non trovato' });
        return res.json({ user });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Errore server' });
    }
});

// DELETE /session -> logout (lato server non invalida JWT senza blacklist; client deve scancellare token)
router.delete('/', authenticateToken, (req, res) => {
    // Se vuoi supportare logout server-side, implementa una blacklist dei token o gestisci refresh tokens.
    return res.status(204).send();
});

module.exports = router;
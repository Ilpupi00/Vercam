const bcrypt = require('bcrypt');
const path = require('path');
// Use the project's sqlite database if available
let db;
try {
    db = require(path.resolve(__dirname, '..', '..', 'db', 'database'));
} catch (e) {
    // db may not be available in some test contexts; we'll fall back to in-memory users
    db = null;
}

// In-memory fallback user (useful for minimal dev without DB)
const users = [
    // password for this example user is "password123"
    {
        id: '1',
        email: 'user@example.com',
        name: 'Demo User',
        passwordHash: bcrypt.hashSync('password123', 10)
    }
];

async function findUserByEmail(email) {
    if (!email) return null;
    const emailStr = String(email).trim();

    // Prefer database lookup when available
    if (db && typeof db.get === 'function') {
        return new Promise((resolve, reject) => {
            // Case-insensitive match
            const sql = 'SELECT id, username AS name, email, password_hash AS passwordHash FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1';
            db.get(sql, [emailStr], (err, row) => {
                if (err) return reject(err);
                if (!row) {
                    // fallback to in-memory
                    const mem = users.find(u => u.email.toLowerCase() === emailStr.toLowerCase()) || null;
                    return resolve(mem);
                }
                // Normalize row to expected shape
                const user = {
                    id: String(row.id),
                    email: row.email,
                    name: row.name || row.email.split('@')[0],
                    passwordHash: row.passwordhash
                };
                resolve(user);
            });
        });
    }

    // Fallback: search in-memory users
    return users.find(u => u.email.toLowerCase() === emailStr.toLowerCase()) || null;
}

async function findUserById(id) {
    if (!id) return null;
    const idStr = String(id).trim();

    // Prefer database lookup when available
    if (db && typeof db.get === 'function') {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT id, username AS name, email, password_hash AS passwordHash FROM users WHERE id = ? LIMIT 1';
            db.get(sql, [idStr], (err, row) => {
                if (err) return reject(err);
                if (!row) return resolve(null);
                // Normalize row to expected shape
                const user = {
                    id: String(row.id),
                    email: row.email,
                    name: row.name || row.email.split('@')[0],
                    passwordHash: row.passwordhash
                };
                resolve(user);
            });
        });
    }

    // Fallback: search in-memory users
    return users.find(u => u.id === idStr) || null;
}

module.exports = { users, findUserByEmail, findUserById };

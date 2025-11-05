const bcrypt = require('bcrypt');

// Dummy user store - replace with real DB in production
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
    return users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
}

module.exports = { users, findUserByEmail };

const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const { findUserByEmail } = require('../lib/users');

module.exports = function(passport) {
    passport.use(new LocalStrategy({ usernameField: 'email', passwordField: 'password' },
        async (email, password, done) => {
            try {
                const user = await findUserByEmail(email);
                if (!user) return done(null, false, { message: 'Invalid credentials' });

                const matched = await bcrypt.compare(password, user.passwordHash);
                if (!matched) return done(null, false, { message: 'Invalid credentials' });

                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }
    ));

    // Optional: simple serialize/deserialize using user id
    passport.serializeUser && passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser && passport.deserializeUser(async (id, done) => {
        try {
            // findUserByEmail expects an email; use the users array to lookup by id if needed
            const { users } = require('../lib/users');
            const user = users.find(u => u.id === id);
            done(null, user || null);
        } catch (err) {
            done(err);
        }
    });
};

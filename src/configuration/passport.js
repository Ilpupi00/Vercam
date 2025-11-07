const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const { findUserByEmail } = require('../lib/users');

module.exports = function(passport) {
    passport.use(new LocalStrategy({ usernameField: 'email', passwordField: 'password' },
        async (email, password, done) => {
            try {
                // Diagnostic logging to help debug failed logins
                // Avoid logging the raw password
                console.debug && console.debug(`LocalStrategy: authentication attempt for email="${email}"`);
                const user = await findUserByEmail(email);
                if (!user) {
                    console.debug && console.debug(`LocalStrategy: no user found for email="${email}"`);
                    return done(null, false, { message: 'Invalid credentials' });
                }
                const matched = await bcrypt.compare(password, user.passwordHash);
                console.debug && console.debug(`LocalStrategy: password match for email="${email}" -> ${matched}`);
                if (!matched) {
                    return done(null, false, { message: 'Invalid credentials' });
                }

                return done(null, user);
            } catch (err) {
                console.error('LocalStrategy: error during authentication', err && err.message ? err.message : err);
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

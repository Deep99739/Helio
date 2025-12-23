const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const baseUrl = process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${baseUrl}/api/auth/google/callback`,
    proxy: true
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            // 1. Check if user exists with googleId
            let user = await User.findOne({ googleId: profile.id });

            if (user) {
                return done(null, user);
            }

            // 2. Check if user exists with email (link accounts)
            // Note: Google emails are verified, so we can trust them.
            user = await User.findOne({ email: profile.emails[0].value });

            if (user) {
                // Link googleId to existing user
                user.googleId = profile.id;
                // If they weren't verified before, they are now (since Google verified them)
                if (!user.isVerified) user.isVerified = true;
                await user.save();
                return done(null, user);
            }

            // 3. Create new user
            user = new User({
                username: profile.displayName.replace(/\s+/g, '') + Math.floor(Math.random() * 1000),
                email: profile.emails[0].value,
                password: 'OAUTH_USER_NO_PASS', // Placeholder or allow null if schema permits
                googleId: profile.id,
                isVerified: true,
                avatar: { value: profile.photos[0].value, type: 'upload' } // Use google photo
            });

            await user.save();
            done(null, user);

        } catch (err) {
            console.error(err);
            done(err, null);
        }
    }
));

// We don't need serializeUser/deserializeUser if we are using JWTs 
// and handling the response directly in the callback route custom handler.
// But Passport usually expects them for session support. 
// We will skip session support in the route config ({ session: false }).
module.exports = passport;

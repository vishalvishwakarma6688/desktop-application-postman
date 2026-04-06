import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/User.js';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// ── Google ────────────────────────────────────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
        },
        async (_accessToken, _refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value;
                if (!email) return done(new Error('No email from Google'), null);

                let user = await User.findOne({ email });
                if (user) {
                    // Link provider if signing in with a different method
                    if (user.provider === 'local') {
                        user.provider = 'google';
                        user.providerId = profile.id;
                        await user.save();
                    }
                    return done(null, user);
                }

                user = await User.create({
                    name: profile.displayName || email.split('@')[0],
                    email,
                    avatar: profile.photos?.[0]?.value || null,
                    provider: 'google',
                    providerId: profile.id,
                });
                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    ));
}

// ── GitHub ────────────────────────────────────────────────────────────────────
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: `${BACKEND_URL}/api/auth/github/callback`,
            scope: ['user:email'],
        },
        async (_accessToken, _refreshToken, profile, done) => {
            try {
                const email =
                    profile.emails?.find(e => e.primary)?.value ||
                    profile.emails?.[0]?.value ||
                    `${profile.username}@github.local`;

                let user = await User.findOne({ email });
                if (user) {
                    if (user.provider === 'local') {
                        user.provider = 'github';
                        user.providerId = String(profile.id);
                        await user.save();
                    }
                    return done(null, user);
                }

                user = await User.create({
                    name: profile.displayName || profile.username || email.split('@')[0],
                    email,
                    avatar: profile.photos?.[0]?.value || null,
                    provider: 'github',
                    providerId: String(profile.id),
                });
                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    ));
}

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

export default passport;

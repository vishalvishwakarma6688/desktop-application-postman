import express from 'express';
import jwt from 'jsonwebtoken';
import passport from '../config/passport.js';
import { register, login, getMe } from '../controllers/authController.js';
import { registerValidation, loginValidation, validate } from '../utils/validators.js';
import auth from '../middlewares/auth.js';

const router = express.Router();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const oauthSuccess = (req, res) => {
    const user = req.user;
    const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    // Always redirect to frontend — Electron BrowserWindow will follow this redirect
    // and OAuthCallbackPage will read the token from the URL hash
    res.redirect(`${FRONTEND_URL}/oauth-callback?token=${token}`);
};

// Local auth
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.get('/me', auth, getMe);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${FRONTEND_URL}?error=oauth_failed` }),
    oauthSuccess
);

// GitHub OAuth
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback',
    passport.authenticate('github', { session: false, failureRedirect: `${FRONTEND_URL}?error=oauth_failed` }),
    oauthSuccess
);

export default router;

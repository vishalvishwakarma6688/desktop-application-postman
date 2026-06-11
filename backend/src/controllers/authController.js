import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { sendWelcomeEmail } from '../services/emailService.js';

// Generate JWT token
const generateToken = (userId, email) => {
    return jwt.sign(
        { userId, email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
    try {
        const { name, email, password, avatar } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            const error = new Error('User with this email already exists');
            error.statusCode = 400;
            error.name = 'ValidationError';
            return next(error);
        }

        // Create new user
        const user = await User.create({
            name,
            email,
            password,
            avatar
        });

        // Generate token
        const token = generateToken(user._id, user.email);

        // Send welcome email (don't wait for it or fail registration if it fails)
        sendWelcomeEmail(user.email, user.name).catch(err => {
            console.error('Failed to send welcome email:', err.message);
        });

        console.log(`[AUTH] New user registered: ${email}`);

        res.status(201).json({
            success: true,
            data: {
                user: user.toJSON(),
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        console.log(`[AUTH] Login attempt for email: ${email}`);

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            console.log(`[AUTH] User not found: ${email}`);
            const error = new Error('Invalid credentials');
            error.statusCode = 401;
            error.name = 'AuthenticationError';
            return next(error);
        }

        console.log(`[AUTH] User found: ${email}, provider: ${user.provider}, has password: ${!!user.password}`);

        // Check if this is an OAuth user trying to login with password
        if (user.provider !== 'local' || !user.password) {
            console.log(`[AUTH] OAuth user attempting password login: ${email}`);
            const error = new Error('This account uses OAuth login. Please use Google or GitHub login.');
            error.statusCode = 401;
            error.name = 'AuthenticationError';
            return next(error);
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        console.log(`[AUTH] Password validation result: ${isPasswordValid}`);

        if (!isPasswordValid) {
            const error = new Error('Invalid credentials');
            error.statusCode = 401;
            error.name = 'AuthenticationError';
            return next(error);
        }

        // Generate token
        const token = generateToken(user._id, user.email);

        console.log(`[AUTH] Login successful for: ${email}`);
        res.status(200).json({
            success: true,
            data: {
                user: user.toJSON(),
                token
            }
        });
    } catch (error) {
        console.error(`[AUTH] Login error:`, error);
        next(error);
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            error.name = 'NotFoundError';
            return next(error);
        }

        res.status(200).json({
            success: true,
            data: user.toJSON()
        });
    } catch (error) {
        next(error);
    }
};

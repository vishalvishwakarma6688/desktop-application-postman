import User from '../models/User.js';
import jwt from 'jsonwebtoken';

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

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            const error = new Error('Invalid credentials');
            error.statusCode = 401;
            error.name = 'AuthenticationError';
            return next(error);
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            const error = new Error('Invalid credentials');
            error.statusCode = 401;
            error.name = 'AuthenticationError';
            return next(error);
        }

        // Generate token
        const token = generateToken(user._id, user.email);

        res.status(200).json({
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

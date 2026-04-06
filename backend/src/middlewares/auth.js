import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            const error = new Error('No token provided, authorization denied');
            error.statusCode = 401;
            error.name = 'AuthenticationError';
            return next(error);
        }

        // Extract token
        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user info to request
        req.user = decoded;

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            error.message = 'Invalid token';
            error.statusCode = 401;
            error.name = 'AuthenticationError';
        } else if (error.name === 'TokenExpiredError') {
            error.message = 'Token expired';
            error.statusCode = 401;
            error.name = 'AuthenticationError';
        }
        next(error);
    }
};

export default auth;

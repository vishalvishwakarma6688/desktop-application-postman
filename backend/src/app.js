import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from './config/passport.js';
import errorHandler from './middlewares/errorHandler.js';
import authRoutes from './routes/auth.js';
import workspaceRoutes from './routes/workspaces.js';
import collectionRoutes from './routes/collections.js';
import requestRoutes from './routes/requests.js';
import environmentRoutes from './routes/environments.js';
import historyRoutes from './routes/history.js';
import aiRoutes from './routes/ai.js';

const app = express();

// Middleware
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like Electron apps, mobile apps, curl, Postman)
        if (!origin) return callback(null, true);

        // Allow if origin is in the allowed list
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session (required for Passport OAuth)
app.use(session({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 10 * 60 * 1000 } // 10 min — only needed during OAuth flow
}));

app.use(passport.initialize());
app.use(passport.session());

// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/environments', environmentRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/ai', aiRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;

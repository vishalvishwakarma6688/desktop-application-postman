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
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
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

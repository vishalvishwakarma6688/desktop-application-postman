import dotenv from 'dotenv';
import http from 'http';
// Dotenv initialization
dotenv.config();

// Dynamic import ensures dotenv runs before passport/app modules are evaluated
const { default: app } = await import('./src/app.js');
const { default: connectDB } = await import('./src/config/database.js');
const { default: socketService } = await import('./src/services/socketService.js');
const { default: cleanupScheduler } = await import('./src/services/cleanupScheduler.js');

connectDB();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
socketService.initialize(server);

// Start cleanup scheduler
cleanupScheduler.start();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`WebSocket server ready for connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    cleanupScheduler.stop();
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    cleanupScheduler.stop();
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

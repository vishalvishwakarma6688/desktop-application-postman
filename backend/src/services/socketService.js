import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import CollaborationSession from '../models/CollaborationSession.js';
import CollaborationAudit from '../models/CollaborationAudit.js';
import Workspace from '../models/Workspace.js';
import User from '../models/User.js';

class SocketService {
    constructor() {
        this.io = null;
        this.userColors = new Map(); // userId -> color
        this.availableColors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
            '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
            '#F8B739', '#52C41A', '#FA8C16', '#EB2F96'
        ];
    }

    initialize(server) {
        const allowedOrigins = process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
            : ['http://localhost:3000', 'http://localhost:5173'];

        this.io = new Server(server, {
            cors: {
                origin: (origin, callback) => {
                    if (!origin) return callback(null, true);
                    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*') || origin.startsWith('file://') || origin.startsWith('chrome-extension://')) {
                        callback(null, true);
                    } else {
                        callback(new Error('Not allowed by CORS'));
                    }
                },
                credentials: true
            },
            pingTimeout: 60000,
            pingInterval: 25000
        });

        this.setupMiddleware();
        this.setupEventHandlers();

        console.log('✅ Socket.IO initialized');
    }

    setupMiddleware() {
        // Authentication middleware
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

                if (!token) {
                    return next(new Error('Authentication token required'));
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.userId).select('-password');

                if (!user) {
                    return next(new Error('User not found'));
                }

                socket.userId = user._id.toString();
                socket.user = user;
                next();
            } catch (error) {
                next(new Error('Invalid or expired token'));
            }
        });
    }

    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`👤 User connected: ${socket.user.name} (${socket.userId})`);

            // Join workspace room
            socket.on('join-workspace', async (data) => {
                await this.handleJoinWorkspace(socket, data);
            });

            // Join resource (request/collection/environment)
            socket.on('join-resource', async (data) => {
                await this.handleJoinResource(socket, data);
            });

            // Leave resource
            socket.on('leave-resource', async (data) => {
                await this.handleLeaveResource(socket, data);
            });

            // Operation events (edit operations)
            socket.on('operation', async (data) => {
                await this.handleOperation(socket, data);
            });

            // Cursor movement
            socket.on('cursor-move', async (data) => {
                await this.handleCursorMove(socket, data);
            });

            // Selection change
            socket.on('selection-change', async (data) => {
                await this.handleSelectionChange(socket, data);
            });

            // Typing indicator
            socket.on('typing', (data) => {
                this.handleTyping(socket, data);
            });

            // Focus field changes
            socket.on('focus-field', async (data) => {
                await this.handleFocusField(socket, data);
            });

            // Disconnect
            socket.on('disconnect', async () => {
                await this.handleDisconnect(socket);
            });

            // Error handling
            socket.on('error', (error) => {
                console.error('Socket error:', error);
            });
        });
    }

    async handleJoinWorkspace(socket, { workspaceId }) {
        try {
            // Verify user has access to workspace
            const workspace = await Workspace.findById(workspaceId);
            if (!workspace) {
                socket.emit('error', { message: 'Workspace not found' });
                return;
            }

            const hasAccess = workspace.owner.toString() === socket.userId ||
                workspace.members.some(m => m.user.toString() === socket.userId);

            if (!hasAccess) {
                socket.emit('error', { message: 'Access denied to workspace' });
                return;
            }

            // Join workspace room
            const roomName = `workspace:${workspaceId}`;
            socket.join(roomName);
            socket.currentWorkspace = workspaceId;

            // Get active users in workspace
            const activeUsers = await this.getWorkspaceActiveUsers(workspaceId);

            socket.emit('workspace-joined', {
                workspaceId,
                activeUsers
            });

            // Notify others
            socket.to(roomName).emit('user-joined-workspace', {
                userId: socket.userId,
                userName: socket.user.name,
                userEmail: socket.user.email,
                avatar: socket.user.avatar
            });

            // Audit log
            await CollaborationAudit.create({
                workspaceId,
                userId: socket.userId,
                action: 'joined',
                resourceType: 'workspace',
                resourceId: workspaceId
            });

            console.log(`📂 User ${socket.user.name} joined workspace ${workspaceId}`);
        } catch (error) {
            console.error('Error in handleJoinWorkspace:', error);
            socket.emit('error', { message: 'Failed to join workspace' });
        }
    }

    async handleJoinResource(socket, { workspaceId, resourceType, resourceId }) {
        try {
            // Verify access
            const workspace = await Workspace.findById(workspaceId);
            if (!workspace) {
                socket.emit('error', { message: 'Workspace not found' });
                return;
            }

            const member = workspace.members.find(m => m.user.toString() === socket.userId);
            const isOwner = workspace.owner.toString() === socket.userId;
            const role = isOwner ? 'admin' : (member?.role || 'viewer');

            // Join resource room
            const roomName = `resource:${resourceId}`;
            socket.join(roomName);

            // Assign color to user
            const color = this.getUserColor(socket.userId);

            // Find or create collaboration session
            let session = await CollaborationSession.findOne({
                workspaceId,
                resourceType,
                resourceId,
                isActive: true
            });

            if (!session) {
                session = await CollaborationSession.create({
                    workspaceId,
                    resourceType,
                    resourceId,
                    activeUsers: []
                });
            }

            // Add user to session if not already present
            const existingUserIndex = session.activeUsers.findIndex(
                u => u.userId.toString() === socket.userId
            );

            if (existingUserIndex >= 0) {
                // Update existing user
                session.activeUsers[existingUserIndex].socketId = socket.id;
                session.activeUsers[existingUserIndex].lastActivity = new Date();
            } else {
                // Add new user
                session.activeUsers.push({
                    userId: socket.userId,
                    socketId: socket.id,
                    userName: socket.user.name,
                    userEmail: socket.user.email,
                    color,
                    cursor: null,
                    lastActivity: new Date()
                });
            }

            session.lastActivityAt = new Date();
            await session.save();

            // Store resource info on socket
            socket.currentResource = { workspaceId, resourceType, resourceId, role };

            // Send current session state to joining user
            socket.emit('resource-joined', {
                resourceId,
                resourceType,
                role,
                activeUsers: session.activeUsers.map(u => ({
                    userId: u.userId,
                    userName: u.userName,
                    userEmail: u.userEmail,
                    color: u.color,
                    cursor: u.cursor
                }))
            });

            // Notify others in the room
            socket.to(roomName).emit('user-joined-resource', {
                userId: socket.userId,
                userName: socket.user.name,
                userEmail: socket.user.email,
                color,
                resourceId
            });

            // Audit log
            await CollaborationAudit.create({
                workspaceId,
                userId: socket.userId,
                action: 'joined',
                resourceType,
                resourceId
            });

            console.log(`📝 User ${socket.user.name} joined ${resourceType} ${resourceId}`);
        } catch (error) {
            console.error('Error in handleJoinResource:', error);
            socket.emit('error', { message: 'Failed to join resource' });
        }
    }

    async handleLeaveResource(socket, { resourceId }) {
        try {
            const roomName = `resource:${resourceId}`;
            socket.leave(roomName);

            // Remove user from session
            const session = await CollaborationSession.findOne({
                resourceId,
                'activeUsers.socketId': socket.id
            });

            if (session) {
                session.activeUsers = session.activeUsers.filter(
                    u => u.socketId !== socket.id
                );
                session.lastActivityAt = new Date();

                if (session.activeUsers.length === 0) {
                    session.isActive = false;
                }

                await session.save();

                // Notify others
                socket.to(roomName).emit('user-left-resource', {
                    userId: socket.userId,
                    resourceId
                });

                // Audit log
                if (socket.currentResource) {
                    await CollaborationAudit.create({
                        workspaceId: socket.currentResource.workspaceId,
                        userId: socket.userId,
                        action: 'left',
                        resourceType: socket.currentResource.resourceType,
                        resourceId
                    });
                }
            }

            console.log(`📤 User ${socket.user.name} left resource ${resourceId}`);
        } catch (error) {
            console.error('Error in handleLeaveResource:', error);
        }
    }

    async handleOperation(socket, { resourceId, operation, revision }) {
        try {
            if (!socket.currentResource) {
                socket.emit('error', { message: 'Not in a resource' });
                return;
            }

            const { role } = socket.currentResource;

            // Check if user has edit permissions
            if (role === 'viewer') {
                socket.emit('error', { message: 'Insufficient permissions to edit' });
                return;
            }

            const roomName = `resource:${resourceId}`;

            // Broadcast operation to all other users in the room
            socket.to(roomName).emit('operation', {
                userId: socket.userId,
                userName: socket.user.name,
                resourceId,
                operation,
                revision: revision + 1,
                timestamp: Date.now()
            });

            // Update last activity
            await CollaborationSession.updateOne(
                {
                    resourceId,
                    'activeUsers.userId': socket.userId
                },
                {
                    $set: {
                        'activeUsers.$.lastActivity': new Date(),
                        lastActivityAt: new Date()
                    }
                }
            );

            // Audit log (sample every 10th operation to reduce DB load)
            if (Math.random() < 0.1) {
                await CollaborationAudit.create({
                    workspaceId: socket.currentResource.workspaceId,
                    userId: socket.userId,
                    action: 'edit',
                    resourceType: socket.currentResource.resourceType,
                    resourceId,
                    metadata: { operationType: operation.type }
                });
            }
        } catch (error) {
            console.error('Error in handleOperation:', error);
            socket.emit('error', { message: 'Failed to process operation' });
        }
    }

    async handleCursorMove(socket, { resourceId, field, position }) {
        try {
            if (!socket.currentResource) return;

            const roomName = `resource:${resourceId}`;

            // Update cursor in session
            await CollaborationSession.updateOne(
                {
                    resourceId,
                    'activeUsers.userId': socket.userId
                },
                {
                    $set: {
                        'activeUsers.$.cursor': {
                            field,
                            position,
                            selection: null
                        },
                        'activeUsers.$.lastActivity': new Date()
                    }
                }
            );

            // Broadcast to others (throttled on client side)
            socket.to(roomName).emit('cursor-move', {
                userId: socket.userId,
                resourceId,
                field,
                position
            });
        } catch (error) {
            console.error('Error in handleCursorMove:', error);
        }
    }

    async handleSelectionChange(socket, { resourceId, field, selection }) {
        try {
            if (!socket.currentResource) return;

            const roomName = `resource:${resourceId}`;

            // Update selection in session
            await CollaborationSession.updateOne(
                {
                    resourceId,
                    'activeUsers.userId': socket.userId
                },
                {
                    $set: {
                        'activeUsers.$.cursor.selection': selection,
                        'activeUsers.$.cursor.field': field,
                        'activeUsers.$.lastActivity': new Date()
                    }
                }
            );

            // Broadcast to others
            socket.to(roomName).emit('selection-change', {
                userId: socket.userId,
                resourceId,
                field,
                selection
            });
        } catch (error) {
            console.error('Error in handleSelectionChange:', error);
        }
    }

    handleTyping(socket, { resourceId, field, isTyping }) {
        if (!socket.currentResource) return;

        const roomName = `resource:${resourceId}`;
        socket.to(roomName).emit('typing', {
            userId: socket.userId,
            userName: socket.user.name,
            resourceId,
            field,
            isTyping
        });
    }

    async handleDisconnect(socket) {
        console.log(`👋 User disconnected: ${socket.user?.name || 'Unknown'} (${socket.userId})`);

        try {
            // Remove user from all active sessions
            await CollaborationSession.updateMany(
                { 'activeUsers.socketId': socket.id },
                {
                    $pull: { activeUsers: { socketId: socket.id } },
                    $set: { lastActivityAt: new Date() }
                }
            );

            // Deactivate empty sessions
            await CollaborationSession.updateMany(
                { activeUsers: { $size: 0 } },
                { $set: { isActive: false } }
            );

            // Notify workspace room
            if (socket.currentWorkspace) {
                const roomName = `workspace:${socket.currentWorkspace}`;
                socket.to(roomName).emit('user-left-workspace', {
                    userId: socket.userId
                });
            }

            // Notify resource room
            if (socket.currentResource) {
                const roomName = `resource:${socket.currentResource.resourceId}`;
                socket.to(roomName).emit('user-left-resource', {
                    userId: socket.userId,
                    resourceId: socket.currentResource.resourceId
                });
            }
        } catch (error) {
            console.error('Error in handleDisconnect:', error);
        }
    }

    async handleFocusField(socket, { workspaceId, fieldId }) {
        try {
            socket.focusedField = fieldId;
            const roomName = `workspace:${workspaceId}`;
            socket.to(roomName).emit('user-focused-field', {
                userId: socket.userId,
                fieldId
            });
        } catch (error) {
            console.error('Error in handleFocusField:', error);
        }
    }

    async getWorkspaceActiveUsers(workspaceId) {
        try {
            const roomName = `workspace:${workspaceId}`;
            const clients = this.io.sockets.adapter.rooms.get(roomName);
            const userMap = new Map();

            if (clients) {
                for (const clientId of clients) {
                    const clientSocket = this.io.sockets.sockets.get(clientId);
                    if (clientSocket && clientSocket.user) {
                        const uid = clientSocket.userId;
                        if (!userMap.has(uid)) {
                            userMap.set(uid, {
                                userId: uid,
                                userName: clientSocket.user.name,
                                userEmail: clientSocket.user.email,
                                avatar: clientSocket.user.avatar,
                                color: this.getUserColor(uid),
                                focusedField: clientSocket.focusedField || null
                            });
                        }
                    }
                }
            }

            return Array.from(userMap.values());
        } catch (error) {
            console.error('Error in getWorkspaceActiveUsers:', error);
            return [];
        }
    }

    getUserColor(userId) {
        if (!this.userColors.has(userId)) {
            const colorIndex = this.userColors.size % this.availableColors.length;
            this.userColors.set(userId, this.availableColors[colorIndex]);
        }
        return this.userColors.get(userId);
    }

    getIO() {
        return this.io;
    }
}

const socketService = new SocketService();
export default socketService;

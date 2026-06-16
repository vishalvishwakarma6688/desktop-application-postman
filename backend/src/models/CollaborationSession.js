import mongoose from 'mongoose';

const collaborationSessionSchema = new mongoose.Schema({
    workspaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        required: true
    },
    resourceType: {
        type: String,
        enum: ['request', 'collection', 'environment', 'workspace'],
        required: true
    },
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    activeUsers: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        socketId: String,
        userName: String,
        userEmail: String,
        color: String,
        cursor: {
            field: String, // 'url', 'headers', 'body', 'params', etc.
            position: {
                line: Number,
                column: Number
            },
            selection: {
                start: {
                    line: Number,
                    column: Number
                },
                end: {
                    line: Number,
                    column: Number
                }
            }
        },
        lastActivity: {
            type: Date,
            default: Date.now
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    lastActivityAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for faster queries
collaborationSessionSchema.index({ workspaceId: 1, resourceType: 1, resourceId: 1 });
collaborationSessionSchema.index({ 'activeUsers.userId': 1 });
collaborationSessionSchema.index({ lastActivityAt: 1 });
collaborationSessionSchema.index({ isActive: 1 });

// Cleanup inactive sessions older than 24 hours
collaborationSessionSchema.statics.cleanupInactive = async function () {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await this.updateMany(
        {
            lastActivityAt: { $lt: twentyFourHoursAgo },
            isActive: false
        },
        { $set: { activeUsers: [] } }
    );
};

const CollaborationSession = mongoose.model('CollaborationSession', collaborationSessionSchema);

export default CollaborationSession;

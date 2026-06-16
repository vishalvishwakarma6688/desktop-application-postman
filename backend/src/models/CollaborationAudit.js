import mongoose from 'mongoose';

const collaborationAuditSchema = new mongoose.Schema({
    workspaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        enum: [
            'joined',
            'left',
            'edit',
            'cursor_move',
            'permission_granted',
            'permission_revoked',
            'invitation_sent',
            'invitation_accepted'
        ],
        required: true
    },
    resourceType: {
        type: String,
        enum: ['request', 'collection', 'environment', 'workspace'],
        default: null
    },
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ipAddress: String,
    userAgent: String
}, {
    timestamps: true
});

// Indexes
collaborationAuditSchema.index({ workspaceId: 1, createdAt: -1 });
collaborationAuditSchema.index({ userId: 1, createdAt: -1 });
collaborationAuditSchema.index({ action: 1, createdAt: -1 });

// Auto-cleanup old audit logs (older than 90 days)
collaborationAuditSchema.statics.cleanupOldLogs = async function () {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    await this.deleteMany({ createdAt: { $lt: ninetyDaysAgo } });
};

const CollaborationAudit = mongoose.model('CollaborationAudit', collaborationAuditSchema);

export default CollaborationAudit;

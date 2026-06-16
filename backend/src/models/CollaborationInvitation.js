import mongoose from 'mongoose';
import crypto from 'crypto';

const collaborationInvitationSchema = new mongoose.Schema({
    workspaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        required: true
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    invitedEmail: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    invitedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    role: {
        type: String,
        enum: ['viewer', 'editor', 'admin'],
        default: 'editor'
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    },
    acceptedAt: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'expired', 'revoked'],
        default: 'pending'
    },
    message: {
        type: String,
        maxlength: 500,
        default: null
    }
}, {
    timestamps: true
});

// Indexes
collaborationInvitationSchema.index({ token: 1 });
collaborationInvitationSchema.index({ workspaceId: 1, invitedEmail: 1 });
collaborationInvitationSchema.index({ status: 1, expiresAt: 1 });

// Generate secure token
collaborationInvitationSchema.statics.generateToken = function () {
    return crypto.randomBytes(32).toString('hex');
};

// Check if invitation is valid
collaborationInvitationSchema.methods.isValid = function () {
    return this.status === 'pending' && this.expiresAt > new Date();
};

// Mark as expired
collaborationInvitationSchema.statics.expireOldInvitations = async function () {
    await this.updateMany(
        {
            status: 'pending',
            expiresAt: { $lt: new Date() }
        },
        { $set: { status: 'expired' } }
    );
};

const CollaborationInvitation = mongoose.model('CollaborationInvitation', collaborationInvitationSchema);

export default CollaborationInvitation;

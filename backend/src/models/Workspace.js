import mongoose from 'mongoose';

const workspaceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Workspace name is required'],
        trim: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Workspace owner is required']
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['admin', 'editor', 'viewer'],
            default: 'viewer'
        }
    }]
}, {
    timestamps: true
});

// Indexes for faster queries
workspaceSchema.index({ owner: 1 });
workspaceSchema.index({ 'members.user': 1 });

const Workspace = mongoose.model('Workspace', workspaceSchema);

export default Workspace;

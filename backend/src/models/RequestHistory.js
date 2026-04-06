import mongoose from 'mongoose';

const requestHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required']
    },
    request: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Request',
        required: [true, 'Request reference is required']
    },
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        required: [true, 'Workspace reference is required']
    },
    requestSnapshot: {
        method: String,
        url: String,
        headers: mongoose.Schema.Types.Mixed,
        body: mongoose.Schema.Types.Mixed
    },
    response: {
        status: Number,
        statusText: String,
        data: mongoose.Schema.Types.Mixed,
        headers: mongoose.Schema.Types.Mixed,
        executionTime: Number
    },
    error: {
        message: String,
        code: String
    },
    executedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: false
});

// Indexes for faster queries
requestHistorySchema.index({ user: 1 });
requestHistorySchema.index({ request: 1 });
requestHistorySchema.index({ user: 1, executedAt: -1 });

const RequestHistory = mongoose.model('RequestHistory', requestHistorySchema);

export default RequestHistory;

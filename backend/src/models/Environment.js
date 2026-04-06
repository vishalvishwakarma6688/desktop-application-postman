import mongoose from 'mongoose';

const environmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Environment name is required'],
        trim: true
    },
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        required: [true, 'Workspace reference is required']
    },
    variables: [{
        key: {
            type: String,
            required: [true, 'Variable key is required'],
            trim: true
        },
        value: {
            type: String,
            required: [true, 'Variable value is required'],
            default: ''
        },
        enabled: {
            type: Boolean,
            default: true
        }
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes for faster queries
environmentSchema.index({ workspace: 1 });
environmentSchema.index({ workspace: 1, name: 1 });

const Environment = mongoose.model('Environment', environmentSchema);

export default Environment;

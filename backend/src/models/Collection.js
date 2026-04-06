import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Collection name is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        required: [true, 'Workspace reference is required']
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Creator reference is required']
    }
}, {
    timestamps: true,
    suppressReservedKeysWarning: true
});

// Indexes for faster queries
collectionSchema.index({ workspace: 1 });
collectionSchema.index({ workspace: 1, name: 1 });

const Collection = mongoose.model('Collection', collectionSchema);

export default Collection;

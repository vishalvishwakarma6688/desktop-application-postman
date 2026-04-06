import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Request name is required'],
        trim: true
    },
    collection: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collection',
        required: [true, 'Collection reference is required']
    },
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        required: [true, 'Workspace reference is required']
    },
    method: {
        type: String,
        enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        required: [true, 'HTTP method is required']
    },
    url: {
        type: String,
        required: [true, 'URL is required']
    },
    headers: [{
        key: {
            type: String,
            default: ''
        },
        value: {
            type: String,
            default: ''
        },
        enabled: {
            type: Boolean,
            default: true
        }
    }],
    queryParams: [{
        key: {
            type: String,
            default: ''
        },
        value: {
            type: String,
            default: ''
        },
        enabled: {
            type: Boolean,
            default: true
        }
    }],
    body: {
        type: {
            type: String,
            enum: ['json', 'form-data', 'raw', 'none'],
            default: 'none'
        },
        content: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        }
    },
    auth: {
        type: {
            type: String,
            enum: ['bearer', 'basic', 'apikey', 'none'],
            default: 'none'
        },
        bearer: {
            token: {
                type: String,
                default: ''
            }
        },
        basic: {
            username: {
                type: String,
                default: ''
            },
            password: {
                type: String,
                default: ''
            }
        },
        apikey: {
            key: {
                type: String,
                default: ''
            },
            value: {
                type: String,
                default: ''
            },
            addTo: {
                type: String,
                enum: ['header', 'query'],
                default: 'header'
            }
        }
    },
    isStarred: {
        type: Boolean,
        default: false
    },
    scripts: {
        pre: {
            type: String,
            default: ''
        },
        post: {
            type: String,
            default: ''
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes for faster queries
requestSchema.index({ collection: 1 });
requestSchema.index({ workspace: 1 });
requestSchema.index({ workspace: 1, isStarred: 1 });

const Request = mongoose.model('Request', requestSchema);

export default Request;

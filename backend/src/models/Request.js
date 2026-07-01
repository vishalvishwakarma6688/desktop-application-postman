import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Request name is required'],
        trim: true
    },
    type: {
        type: String,
        enum: ['http', 'websocket', 'grpc', 'graphql'],
        default: 'http'
    },
    collection: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collection',
        required: [true, 'Collection reference is required']
    },
    folder: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
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
    notes: {
        type: String,
        default: ''
    },
    monitorSettings: {
        isMonitored: {
            type: Boolean,
            default: false
        },
        interval: {
            type: Number,
            default: 60 // in seconds
        },
        lastStatus: {
            type: String,
            enum: ['healthy', 'unhealthy', 'unknown'],
            default: 'unknown'
        },
        lastChecked: {
            type: Date
        },
        lastResponseTime: {
            type: Number
        }
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
    examples: [{
        name: { type: String, default: 'Saved Example' },
        method: { type: String },
        url: { type: String },
        headers: [{
            key: String,
            value: String,
            enabled: Boolean
        }],
        queryParams: [{
            key: String,
            value: String,
            enabled: Boolean
        }],
        body: {
            type: {
                type: String,
                enum: ['json', 'form-data', 'raw', 'none'],
                default: 'none'
            },
            content: mongoose.Schema.Types.Mixed
        },
        response: {
            status: Number,
            statusText: String,
            time: Number,
            size: Number,
            headers: mongoose.Schema.Types.Mixed,
            data: mongoose.Schema.Types.Mixed
        },
        savedAt: { type: Date, default: Date.now }
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    suppressReservedKeysWarning: true
});

// Indexes for faster queries
requestSchema.index({ collection: 1 });
requestSchema.index({ workspace: 1 });
requestSchema.index({ workspace: 1, isStarred: 1 });

const Request = mongoose.model('Request', requestSchema);

export default Request;

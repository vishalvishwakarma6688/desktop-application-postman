import Collection from '../models/Collection.js';
import Request from '../models/Request.js';

// @desc    Create a new collection
// @route   POST /api/collections
// @access  Private
export const createCollection = async (req, res, next) => {
    try {
        const { name, description, workspace } = req.body;

        if (!name || !workspace) {
            const error = new Error('Collection name and workspace are required');
            error.statusCode = 400;
            error.name = 'ValidationError';
            return next(error);
        }

        // Create collection
        const collection = await Collection.create({
            name,
            description,
            workspace,
            creator: req.user.userId
        });

        await collection.populate('workspace', 'name');
        await collection.populate('creator', 'name email');

        res.status(201).json({
            success: true,
            data: collection
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all collections for a workspace
// @route   GET /api/collections/workspace/:workspaceId
// @access  Private
export const getCollectionsByWorkspace = async (req, res, next) => {
    try {
        const collections = await Collection.find({ workspace: req.params.workspaceId })
            .populate('creator', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: collections.length,
            data: collections
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get collection by ID
// @route   GET /api/collections/:id
// @access  Private
export const getCollectionById = async (req, res, next) => {
    try {
        const collection = await Collection.findById(req.params.id)
            .populate('workspace', 'name')
            .populate('creator', 'name email');

        if (!collection) {
            const error = new Error('Collection not found');
            error.statusCode = 404;
            error.name = 'NotFoundError';
            return next(error);
        }

        res.status(200).json({
            success: true,
            data: collection
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update collection
// @route   PUT /api/collections/:id
// @access  Private
export const updateCollection = async (req, res, next) => {
    try {
        const { name, description } = req.body;

        const collection = await Collection.findById(req.params.id);

        if (!collection) {
            const error = new Error('Collection not found');
            error.statusCode = 404;
            error.name = 'NotFoundError';
            return next(error);
        }

        if (name) collection.name = name;
        if (description !== undefined) collection.description = description;

        await collection.save();

        res.status(200).json({
            success: true,
            data: collection
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete collection
// @route   DELETE /api/collections/:id
// @access  Private
export const deleteCollection = async (req, res, next) => {
    try {
        const collection = await Collection.findById(req.params.id);

        if (!collection) {
            const error = new Error('Collection not found');
            error.statusCode = 404;
            error.name = 'NotFoundError';
            return next(error);
        }

        await collection.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Collection deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Export collection as Postman v2.1 JSON
// @route   GET /api/collections/:id/export
// @access  Private
export const exportCollection = async (req, res, next) => {
    try {
        const collection = await Collection.findById(req.params.id);
        if (!collection) {
            const error = new Error('Collection not found');
            error.statusCode = 404;
            return next(error);
        }

        const requests = await Request.find({ collection: collection._id }).sort({ createdAt: 1 });

        const postmanCollection = {
            info: {
                name: collection.name,
                description: collection.description || '',
                schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
            },
            item: requests.map(r => ({
                name: r.name,
                request: {
                    method: r.method,
                    header: (r.headers || []).filter(h => h.key).map(h => ({
                        key: h.key, value: h.value, disabled: !h.enabled,
                    })),
                    url: {
                        raw: r.url,
                        host: [r.url.split('/')[2] || ''],
                        path: r.url.split('/').slice(3),
                        query: (r.queryParams || []).filter(q => q.key).map(q => ({
                            key: q.key, value: q.value, disabled: !q.enabled,
                        })),
                    },
                    body: r.body?.type === 'none' ? undefined : {
                        mode: r.body.type === 'json' ? 'raw' : r.body.type === 'form-data' ? 'formdata' : 'raw',
                        raw: r.body.type !== 'form-data'
                            ? (typeof r.body.content === 'string' ? r.body.content : JSON.stringify(r.body.content, null, 2))
                            : undefined,
                        formdata: r.body.type === 'form-data'
                            ? (r.body.content || []).map(f => ({ key: f.key, value: f.value, disabled: !f.enabled }))
                            : undefined,
                        options: r.body.type === 'json' ? { raw: { language: 'json' } } : undefined,
                    },
                    auth: r.auth?.type === 'none' ? undefined : r.auth,
                },
                event: [
                    ...(r.scripts?.pre ? [{ listen: 'prerequest', script: { type: 'text/javascript', exec: r.scripts.pre.split('\n') } }] : []),
                    ...(r.scripts?.post ? [{ listen: 'test', script: { type: 'text/javascript', exec: r.scripts.post.split('\n') } }] : []),
                ],
            })),
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${collection.name.replace(/[^a-z0-9]/gi, '_')}.json"`);
        res.json(postmanCollection);
    } catch (error) {
        next(error);
    }
};

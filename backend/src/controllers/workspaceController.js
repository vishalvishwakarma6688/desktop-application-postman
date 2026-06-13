import Workspace from '../models/Workspace.js';
import Collection from '../models/Collection.js';
import Request from '../models/Request.js';
import Environment from '../models/Environment.js';

// @desc    Create a new workspace
// @route   POST /api/workspaces
// @access  Private
export const createWorkspace = async (req, res, next) => {
    try {
        const { name } = req.body;

        if (!name) {
            const error = new Error('Workspace name is required');
            error.statusCode = 400;
            error.name = 'ValidationError';
            return next(error);
        }

        // Create workspace with authenticated user as owner
        const workspace = await Workspace.create({
            name,
            owner: req.user.userId,
            members: []
        });

        // Populate owner details
        await workspace.populate('owner', 'name email');

        res.status(201).json({
            success: true,
            data: workspace
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all workspaces for authenticated user
// @route   GET /api/workspaces
// @access  Private
export const getWorkspaces = async (req, res, next) => {
    try {
        // Find workspaces where user is owner or member
        const workspaces = await Workspace.find({
            $or: [
                { owner: req.user.userId },
                { 'members.user': req.user.userId }
            ]
        })
            .populate('owner', 'name email')
            .populate('members.user', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: workspaces.length,
            data: workspaces
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get workspace by ID
// @route   GET /api/workspaces/:id
// @access  Private
export const getWorkspaceById = async (req, res, next) => {
    try {
        const workspace = await Workspace.findById(req.params.id)
            .populate('owner', 'name email')
            .populate('members.user', 'name email');

        if (!workspace) {
            const error = new Error('Workspace not found');
            error.statusCode = 404;
            error.name = 'NotFoundError';
            return next(error);
        }

        // Check if user has access to workspace
        const hasAccess = workspace.owner._id.toString() === req.user.userId ||
            workspace.members.some(member => member.user._id.toString() === req.user.userId);

        if (!hasAccess) {
            const error = new Error('Access denied to this workspace');
            error.statusCode = 403;
            error.name = 'AuthorizationError';
            return next(error);
        }

        res.status(200).json({
            success: true,
            data: workspace
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add member to workspace
// @route   POST /api/workspaces/:id/members
// @access  Private
export const addMember = async (req, res, next) => {
    try {
        const { userId, role } = req.body;

        if (!userId || !role) {
            const error = new Error('User ID and role are required');
            error.statusCode = 400;
            error.name = 'ValidationError';
            return next(error);
        }

        const workspace = await Workspace.findById(req.params.id);

        if (!workspace) {
            const error = new Error('Workspace not found');
            error.statusCode = 404;
            error.name = 'NotFoundError';
            return next(error);
        }

        // Check if requester is owner or admin
        const isOwner = workspace.owner.toString() === req.user.userId;
        const isAdmin = workspace.members.some(
            member => member.user.toString() === req.user.userId && member.role === 'admin'
        );

        if (!isOwner && !isAdmin) {
            const error = new Error('Only workspace owner or admin can add members');
            error.statusCode = 403;
            error.name = 'AuthorizationError';
            return next(error);
        }

        // Check if user is already a member
        const isMember = workspace.members.some(
            member => member.user.toString() === userId
        );

        if (isMember) {
            const error = new Error('User is already a member of this workspace');
            error.statusCode = 400;
            error.name = 'ValidationError';
            return next(error);
        }

        // Add member
        workspace.members.push({ user: userId, role });
        await workspace.save();

        await workspace.populate('members.user', 'name email');

        res.status(200).json({
            success: true,
            data: workspace
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update workspace
// @route   PUT /api/workspaces/:id
// @access  Private
export const updateWorkspace = async (req, res, next) => {
    try {
        const { name, localDirectory } = req.body;

        const workspace = await Workspace.findById(req.params.id);

        if (!workspace) {
            const error = new Error('Workspace not found');
            error.statusCode = 404;
            error.name = 'NotFoundError';
            return next(error);
        }

        // Check if user is owner or admin
        const isOwner = workspace.owner.toString() === req.user.userId;
        const isAdmin = workspace.members.some(
            member => member.user.toString() === req.user.userId && member.role === 'admin'
        );

        if (!isOwner && !isAdmin) {
            const error = new Error('Only workspace owner or admin can update workspace');
            error.statusCode = 403;
            error.name = 'AuthorizationError';
            return next(error);
        }

        if (name) workspace.name = name;
        // Allow saving (or clearing) the linked local directory path
        if (localDirectory !== undefined) workspace.localDirectory = localDirectory;
        await workspace.save();

        res.status(200).json({
            success: true,
            data: workspace
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete workspace
// @route   DELETE /api/workspaces/:id
// @access  Private
export const deleteWorkspace = async (req, res, next) => {
    try {
        const workspace = await Workspace.findById(req.params.id);

        if (!workspace) {
            const error = new Error('Workspace not found');
            error.statusCode = 404;
            error.name = 'NotFoundError';
            return next(error);
        }

        // Only owner can delete workspace
        if (workspace.owner.toString() !== req.user.userId) {
            const error = new Error('Only workspace owner can delete workspace');
            error.statusCode = 403;
            error.name = 'AuthorizationError';
            return next(error);
        }

        await workspace.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Workspace deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all workspace collections, requests, and environments for local sync
// @route   GET /api/workspaces/:id/sync-data
// @access  Private
export const getWorkspaceSyncData = async (req, res, next) => {
    try {
        const workspaceId = req.params.id;
        const workspace = await Workspace.findById(workspaceId);
        
        if (!workspace) {
            const error = new Error('Workspace not found');
            error.statusCode = 404;
            return next(error);
        }

        // Check access
        const hasAccess = workspace.owner.toString() === req.user.userId ||
            workspace.members.some(member => member.user.toString() === req.user.userId);

        if (!hasAccess) {
            const error = new Error('Access denied to this workspace');
            error.statusCode = 403;
            return next(error);
        }

        // Fetch collections
        const collections = await Collection.find({ workspace: workspaceId });
        const collectionsWithRequests = await Promise.all(collections.map(async (col) => {
            const requests = await Request.find({ collection: col._id }).sort({ createdAt: 1 });
            return {
                ...col.toObject(),
                requests
            };
        }));

        // Fetch environments
        const environments = await Environment.find({ workspace: workspaceId });

        res.status(200).json({
            success: true,
            data: {
                workspace,
                collections: collectionsWithRequests,
                environments
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Import local sync data into workspace, resolving diffs (create/update/delete)
// @route   POST /api/workspaces/:id/import-sync-data
// @access  Private
export const importWorkspaceSyncData = async (req, res, next) => {
    try {
        const workspaceId = req.params.id;
        const workspace = await Workspace.findById(workspaceId);

        if (!workspace) {
            const error = new Error('Workspace not found');
            error.statusCode = 404;
            return next(error);
        }

        // Check access (only editors and admins can import)
        const isOwner = workspace.owner.toString() === req.user.userId;
        const isEditor = workspace.members.some(
            member => member.user.toString() === req.user.userId && (member.role === 'admin' || member.role === 'editor')
        );

        if (!isOwner && !isEditor) {
            const error = new Error('Only owners or editors can import workspace data');
            error.statusCode = 403;
            return next(error);
        }

        const { collections = [], environments = [] } = req.body;

        // 1. Sync Environments
        const updatedEnvIds = [];
        for (const envData of environments) {
            let env = null;
            if (envData._id) {
                env = await Environment.findOne({ _id: envData._id, workspace: workspaceId });
            }
            if (!env) {
                env = await Environment.findOne({ name: envData.name, workspace: workspaceId });
            }

            if (env) {
                env.name = envData.name;
                env.variables = envData.variables || [];
                await env.save();
                updatedEnvIds.push(env._id.toString());
            } else {
                const newEnv = await Environment.create({
                    name: envData.name,
                    workspace: workspaceId,
                    variables: envData.variables || [],
                    createdBy: req.user.userId
                });
                updatedEnvIds.push(newEnv._id.toString());
            }
        }
        // Delete environments not in sync
        await Environment.deleteMany({ workspace: workspaceId, _id: { $nin: updatedEnvIds } });

        // 2. Sync Collections & Requests
        const updatedColIds = [];
        for (const colData of collections) {
            let collection = null;
            if (colData._id) {
                collection = await Collection.findOne({ _id: colData._id, workspace: workspaceId });
            }
            if (!collection) {
                collection = await Collection.findOne({ name: colData.name, workspace: workspaceId });
            }

            if (collection) {
                collection.name = colData.name;
                collection.description = colData.description || '';
                await collection.save();
                updatedColIds.push(collection._id.toString());
            } else {
                collection = await Collection.create({
                    name: colData.name,
                    description: colData.description || '',
                    workspace: workspaceId,
                    creator: req.user.userId
                });
                updatedColIds.push(collection._id.toString());
            }

            // Sync requests under this collection
            const updatedReqIds = [];
            const reqsData = colData.requests || [];
            for (const reqData of reqsData) {
                let request = null;
                if (reqData._id) {
                    request = await Request.findOne({ _id: reqData._id, collection: collection._id });
                }
                if (!request) {
                    request = await Request.findOne({
                        name: reqData.name,
                        method: reqData.method,
                        collection: collection._id
                    });
                }

                if (request) {
                    request.name = reqData.name;
                    request.method = reqData.method;
                    request.url = reqData.url;
                    request.headers = reqData.headers || [];
                    request.queryParams = reqData.queryParams || [];
                    request.body = reqData.body || { type: 'none', content: null };
                    request.auth = reqData.auth || { type: 'none' };
                    request.scripts = reqData.scripts || {};
                    request.isStarred = !!reqData.isStarred;
                    await request.save();
                    updatedReqIds.push(request._id.toString());
                } else {
                    const newReq = await Request.create({
                        name: reqData.name,
                        method: reqData.method,
                        url: reqData.url,
                        collection: collection._id,
                        workspace: workspaceId,
                        headers: reqData.headers || [],
                        queryParams: reqData.queryParams || [],
                        body: reqData.body || { type: 'none', content: null },
                        auth: reqData.auth || { type: 'none' },
                        scripts: reqData.scripts || {},
                        isStarred: !!reqData.isStarred,
                        createdBy: req.user.userId
                    });
                    updatedReqIds.push(newReq._id.toString());
                }
            }
            // Delete requests not in sync for this collection
            await Request.deleteMany({ collection: collection._id, _id: { $nin: updatedReqIds } });
        }

        // Delete collections not in sync for this workspace (and their requests)
        const collectionsToDelete = await Collection.find({ workspace: workspaceId, _id: { $nin: updatedColIds } });
        const colIdsToDelete = collectionsToDelete.map(c => c._id);
        if (colIdsToDelete.length > 0) {
            await Request.deleteMany({ collection: { $in: colIdsToDelete } });
            await Collection.deleteMany({ _id: { $in: colIdsToDelete } });
        }

        res.status(200).json({
            success: true,
            message: 'Workspace data synchronized successfully'
        });
    } catch (error) {
        next(error);
    }
};


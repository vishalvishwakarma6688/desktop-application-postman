import Workspace from '../models/Workspace.js';

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
        const { name } = req.body;

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

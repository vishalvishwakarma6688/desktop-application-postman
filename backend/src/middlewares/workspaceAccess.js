import Workspace from '../models/Workspace.js';

// Check if user has access to workspace
export const checkWorkspaceAccess = async (req, res, next) => {
    try {
        const workspaceId = req.params.workspaceId || req.body.workspace;

        if (!workspaceId) {
            const error = new Error('Workspace ID is required');
            error.statusCode = 400;
            error.name = 'ValidationError';
            return next(error);
        }

        const workspace = await Workspace.findById(workspaceId);

        if (!workspace) {
            const error = new Error('Workspace not found');
            error.statusCode = 404;
            error.name = 'NotFoundError';
            return next(error);
        }

        // Check if user is owner or member
        const isOwner = workspace.owner.toString() === req.user.userId;
        const isMember = workspace.members.some(
            member => member.user.toString() === req.user.userId
        );

        if (!isOwner && !isMember) {
            const error = new Error('Access denied to this workspace');
            error.statusCode = 403;
            error.name = 'AuthorizationError';
            return next(error);
        }

        // Attach workspace and user role to request
        req.workspace = workspace;
        req.userRole = isOwner ? 'owner' : workspace.members.find(
            member => member.user.toString() === req.user.userId
        ).role;

        next();
    } catch (error) {
        next(error);
    }
};

// Check if user has specific role or higher
export const checkRole = (requiredRole) => {
    const roleHierarchy = {
        viewer: 0,
        editor: 1,
        admin: 2,
        owner: 3
    };

    return (req, res, next) => {
        const userRoleLevel = roleHierarchy[req.userRole] || 0;
        const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

        if (userRoleLevel < requiredRoleLevel) {
            const error = new Error(`This action requires ${requiredRole} role or higher`);
            error.statusCode = 403;
            error.name = 'AuthorizationError';
            return next(error);
        }

        next();
    };
};

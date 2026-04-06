import Environment from '../models/Environment.js';

// @desc    Create a new environment
// @route   POST /api/environments
// @access  Private
export const createEnvironment = async (req, res, next) => {
    try {
        const { name, workspace, variables } = req.body;

        if (!name || !workspace) {
            const error = new Error('Environment name and workspace are required');
            error.statusCode = 400;
            error.name = 'ValidationError';
            return next(error);
        }

        // Validate variables if provided
        if (variables && Array.isArray(variables)) {
            const keys = new Set();
            for (const variable of variables) {
                if (!variable.key || variable.key.trim() === '') {
                    const error = new Error('Variable key cannot be empty');
                    error.statusCode = 400;
                    error.name = 'ValidationError';
                    return next(error);
                }

                // Check for duplicate keys
                if (keys.has(variable.key)) {
                    const error = new Error(`Duplicate variable key: ${variable.key}`);
                    error.statusCode = 400;
                    error.name = 'ValidationError';
                    return next(error);
                }
                keys.add(variable.key);
            }
        }

        // Create environment
        const environment = await Environment.create({
            name,
            workspace,
            variables: variables || [],
            createdBy: req.user.userId
        });

        await environment.populate('workspace', 'name');
        await environment.populate('createdBy', 'name email');

        res.status(201).json({
            success: true,
            data: environment
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all environments for a workspace
// @route   GET /api/environments/workspace/:workspaceId
// @access  Private
export const getEnvironmentsByWorkspace = async (req, res, next) => {
    try {
        const environments = await Environment.find({ workspace: req.params.workspaceId })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: environments.length,
            data: environments
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get environment by ID
// @route   GET /api/environments/:id
// @access  Private
export const getEnvironmentById = async (req, res, next) => {
    try {
        const environment = await Environment.findById(req.params.id)
            .populate('workspace', 'name')
            .populate('createdBy', 'name email');

        if (!environment) {
            const error = new Error('Environment not found');
            error.statusCode = 404;
            error.name = 'NotFoundError';
            return next(error);
        }

        res.status(200).json({
            success: true,
            data: environment
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update environment
// @route   PUT /api/environments/:id
// @access  Private
export const updateEnvironment = async (req, res, next) => {
    try {
        const { name, variables } = req.body;

        const environment = await Environment.findById(req.params.id);

        if (!environment) {
            const error = new Error('Environment not found');
            error.statusCode = 404;
            error.name = 'NotFoundError';
            return next(error);
        }

        // Validate variables if provided
        if (variables && Array.isArray(variables)) {
            const keys = new Set();
            for (const variable of variables) {
                if (!variable.key || variable.key.trim() === '') {
                    const error = new Error('Variable key cannot be empty');
                    error.statusCode = 400;
                    error.name = 'ValidationError';
                    return next(error);
                }

                // Check for duplicate keys
                if (keys.has(variable.key)) {
                    const error = new Error(`Duplicate variable key: ${variable.key}`);
                    error.statusCode = 400;
                    error.name = 'ValidationError';
                    return next(error);
                }
                keys.add(variable.key);
            }
            environment.variables = variables;
        }

        if (name) environment.name = name;

        await environment.save();

        res.status(200).json({
            success: true,
            data: environment
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete environment
// @route   DELETE /api/environments/:id
// @access  Private
export const deleteEnvironment = async (req, res, next) => {
    try {
        const environment = await Environment.findById(req.params.id);

        if (!environment) {
            const error = new Error('Environment not found');
            error.statusCode = 404;
            error.name = 'NotFoundError';
            return next(error);
        }

        await environment.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Environment deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

import Request from '../models/Request.js';
import RequestHistory from '../models/RequestHistory.js';
import Environment from '../models/Environment.js';
import { executeRequest } from '../services/requestExecutor.js';

// Build a minimal pm object for script execution
const buildPmObject = (envVars, response, request) => {
    const varMap = {};
    envVars.forEach(v => { if (v.enabled) varMap[v.key] = v.value; });
    const testResults = [];

    return {
        environment: {
            get: (key) => varMap[key],
            set: (key, value) => { varMap[key] = String(value); },
            unset: (key) => { delete varMap[key]; },
        },
        request: {
            url: request?.url,
            method: request?.method,
            headers: { add: () => { } },
        },
        response: response ? {
            status: response.status,
            statusText: response.statusText,
            responseTime: response.executionTime,
            json: () => {
                if (typeof response.data === 'object') return response.data;
                try { return JSON.parse(response.data); } catch { return null; }
            },
            text: () => typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
            to: {
                have: {
                    status: (code) => {
                        if (response.status !== code) throw new Error(`Expected status ${code}, got ${response.status}`);
                    },
                },
                be: {
                    json: response.headers?.['content-type']?.includes('json'),
                },
            },
        } : null,
        test: (name, fn) => {
            try { fn(); testResults.push({ name, passed: true }); }
            catch (e) { testResults.push({ name, passed: false, error: e.message }); }
        },
        expect: (val) => ({
            to: {
                equal: (expected) => { if (val !== expected) throw new Error(`Expected ${expected}, got ${val}`); },
                be: {
                    below: (n) => { if (val >= n) throw new Error(`Expected ${val} to be below ${n}`); },
                    above: (n) => { if (val <= n) throw new Error(`Expected ${val} to be above ${n}`); },
                    a: (type) => { if (typeof val !== type) throw new Error(`Expected type ${type}, got ${typeof val}`); },
                },
                include: (str) => { if (!String(val).includes(str)) throw new Error(`Expected "${val}" to include "${str}"`); },
                have: {
                    property: (key) => { if (!(key in val)) throw new Error(`Expected object to have property "${key}"`); },
                    status: (code) => { if (val !== code) throw new Error(`Expected status ${code}`); },
                },
            },
        }),
        __getTestResults: () => testResults,
        __applyChanges: (vars) => {
            Object.keys(varMap).forEach(k => {
                const existing = vars.find(v => v.key === k);
                if (existing) existing.value = varMap[k];
                else vars.push({ key: k, value: varMap[k], enabled: true });
            });
        },
    };
};

// @desc    Create a new request
// @route   POST /api/requests
// @access  Private
export const createRequest = async (req, res, next) => {
    try {
        const { name, collection, workspace, method, url, headers, queryParams, body, auth } = req.body;

        if (!name || !collection || !workspace || !method || !url) {
            const error = new Error('Name, collection, workspace, method, and URL are required');
            error.statusCode = 400;
            error.name = 'ValidationError';
            return next(error);
        }

        // Validate HTTP method
        const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
        if (!validMethods.includes(method)) {
            const error = new Error(`Invalid HTTP method. Must be one of: ${validMethods.join(', ')}`);
            error.statusCode = 400;
            error.name = 'ValidationError';
            return next(error);
        }

        // Validate URL format
        try {
            new URL(url);
        } catch (urlError) {
            // Check if it's a relative URL or has variable placeholders
            if (!url.startsWith('http') && !url.includes('{{')) {
                const error = new Error('Invalid URL format. URL must start with http:// or https://');
                error.statusCode = 400;
                error.name = 'ValidationError';
                return next(error);
            }
        }

        // Create request
        const request = await Request.create({
            name,
            collection,
            workspace,
            method,
            url,
            headers: headers || [],
            queryParams: queryParams || [],
            body: body || { type: 'none', content: null },
            auth: auth || { type: 'none' },
            createdBy: req.user.userId
        });

        await request.populate('collection', 'name');
        await request.populate('workspace', 'name');
        await request.populate('createdBy', 'name email');

        res.status(201).json({
            success: true,
            data: request
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all requests for a collection
// @route   GET /api/requests/collection/:collectionId
// @access  Private
export const getRequestsByCollection = async (req, res, next) => {
    try {
        const requests = await Request.find({ collection: req.params.collectionId })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get request by ID
// @route   GET /api/requests/:id
// @access  Private
export const getRequestById = async (req, res, next) => {
    try {
        const request = await Request.findById(req.params.id)
            .populate('collection', 'name')
            .populate('workspace', 'name')
            .populate('createdBy', 'name email');

        if (!request) {
            const error = new Error('Request not found');
            error.statusCode = 404;
            error.name = 'NotFoundError';
            return next(error);
        }

        res.status(200).json({
            success: true,
            data: request
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update request
// @route   PUT /api/requests/:id
// @access  Private
export const updateRequest = async (req, res, next) => {
    try {
        const { name, method, url, headers, queryParams, body, auth, scripts } = req.body;

        const request = await Request.findById(req.params.id);

        if (!request) {
            const error = new Error('Request not found');
            error.statusCode = 404;
            error.name = 'NotFoundError';
            return next(error);
        }

        // Validate HTTP method if provided
        if (method) {
            const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
            if (!validMethods.includes(method)) {
                const error = new Error(`Invalid HTTP method. Must be one of: ${validMethods.join(', ')}`);
                error.statusCode = 400;
                error.name = 'ValidationError';
                return next(error);
            }
            request.method = method;
        }

        // Validate URL format if provided
        if (url) {
            try {
                new URL(url);
            } catch (urlError) {
                if (!url.startsWith('http') && !url.includes('{{')) {
                    const error = new Error('Invalid URL format. URL must start with http:// or https://');
                    error.statusCode = 400;
                    error.name = 'ValidationError';
                    return next(error);
                }
            }
            request.url = url;
        }

        if (name) request.name = name;
        if (headers) request.headers = headers;
        if (queryParams) request.queryParams = queryParams;
        if (body) request.body = body;
        if (auth) request.auth = auth;
        if (scripts !== undefined) request.scripts = scripts;

        await request.save();

        res.status(200).json({
            success: true,
            data: request
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Toggle star on request
// @route   PATCH /api/requests/:id/star
// @access  Private
export const toggleStar = async (req, res, next) => {
    try {
        const request = await Request.findById(req.params.id);

        if (!request) {
            const error = new Error('Request not found');
            error.statusCode = 404;
            error.name = 'NotFoundError';
            return next(error);
        }

        request.isStarred = !request.isStarred;
        await request.save();

        res.status(200).json({
            success: true,
            data: request
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete request
// @route   DELETE /api/requests/:id
// @access  Private
export const deleteRequest = async (req, res, next) => {
    try {
        const request = await Request.findById(req.params.id);

        if (!request) {
            const error = new Error('Request not found');
            error.statusCode = 404;
            error.name = 'NotFoundError';
            return next(error);
        }

        await request.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Request deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get starred requests for a workspace
// @route   GET /api/requests/workspace/:workspaceId/starred
// @access  Private
export const getStarredRequests = async (req, res, next) => {
    try {
        const requests = await Request.find({
            workspace: req.params.workspaceId,
            isStarred: true
        })
            .populate('collection', 'name')
            .populate('createdBy', 'name email')
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        next(error);
    }
};


// @desc    Duplicate a request
// @route   POST /api/requests/:id/duplicate
// @access  Private
export const duplicateRequest = async (req, res, next) => {
    try {
        const original = await Request.findById(req.params.id);
        if (!original) {
            const error = new Error('Request not found');
            error.statusCode = 404;
            return next(error);
        }
        const duplicate = await Request.create({
            name: `${original.name} (copy)`,
            collection: original.collection,
            workspace: original.workspace,
            method: original.method,
            url: original.url,
            headers: original.headers,
            queryParams: original.queryParams,
            body: original.body,
            auth: original.auth,
            scripts: original.scripts,
            createdBy: req.user.userId,
        });
        await duplicate.populate('collection', 'name');
        await duplicate.populate('workspace', 'name');
        res.status(201).json({ success: true, data: duplicate });
    } catch (error) {
        next(error);
    }
};

// @desc    Execute a request
// @route   POST /api/requests/:id/execute
// @access  Private
export const executeRequestById = async (req, res, next) => {
    try {
        const { environmentId } = req.body;

        // Find the request
        const request = await Request.findById(req.params.id);

        if (!request) {
            const error = new Error('Request not found');
            error.statusCode = 404;
            error.name = 'NotFoundError';
            return next(error);
        }

        // Load environment variables if environmentId is provided
        let environmentVariables = [];
        if (environmentId) {
            const environment = await Environment.findById(environmentId);
            if (environment) {
                environmentVariables = environment.variables;
            }
        }

        // Execute pre-request script
        if (request.scripts?.pre?.trim()) {
            try {
                const pm = buildPmObject(environmentVariables, null, request);
                const fn = new Function('pm', 'console', request.scripts.pre);
                fn(pm, console);
                // Apply any variable changes back
                pm.__applyChanges(environmentVariables);
            } catch (scriptErr) {
                console.warn('Pre-request script error:', scriptErr.message);
            }
        }

        // Execute the request
        const result = await executeRequest(request, environmentVariables);

        // Execute post-response script
        let testResults = [];
        if (request.scripts?.post?.trim()) {
            try {
                const pm = buildPmObject(environmentVariables, result, request);
                const fn = new Function('pm', 'console', request.scripts.post);
                fn(pm, console);
                testResults = pm.__getTestResults();
            } catch (scriptErr) {
                console.warn('Post-response script error:', scriptErr.message);
            }
        }

        // Create history record
        const history = await RequestHistory.create({
            user: req.user.userId,
            request: request._id,
            workspace: request.workspace,
            requestSnapshot: {
                method: request.method,
                url: request.url,
                headers: request.headers,
                body: request.body
            },
            response: result.error ? null : {
                status: result.status,
                statusText: result.statusText,
                data: result.data,
                headers: result.headers,
                executionTime: result.executionTime
            },
            error: result.error,
            executedAt: new Date()
        });

        res.status(200).json({
            success: true,
            data: {
                historyId: history._id,
                result,
                testResults,
            }
        });
    } catch (error) {
        next(error);
    }
};

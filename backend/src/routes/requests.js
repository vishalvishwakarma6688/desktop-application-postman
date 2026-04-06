import express from 'express';
import {
    createRequest,
    getRequestsByCollection,
    getRequestById,
    updateRequest,
    toggleStar,
    deleteRequest,
    getStarredRequests,
    executeRequestById,
    duplicateRequest,
} from '../controllers/requestController.js';
import auth from '../middlewares/auth.js';
import { checkWorkspaceAccess, checkRole } from '../middlewares/workspaceAccess.js';
import Request from '../models/Request.js';

const router = express.Router();

// Middleware to load workspace from request
const loadWorkspaceFromRequest = async (req, res, next) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            const error = new Error('Request not found');
            error.statusCode = 404;
            return next(error);
        }
        req.body.workspace = request.workspace.toString();
        next();
    } catch (error) {
        next(error);
    }
};

// All routes require authentication
router.use(auth);

router.post('/', checkWorkspaceAccess, checkRole('editor'), createRequest);
router.get('/collection/:collectionId', getRequestsByCollection);
router.get('/workspace/:workspaceId/starred', checkWorkspaceAccess, getStarredRequests);
router.get('/:id', getRequestById);
router.post('/:id/execute', executeRequestById);
router.post('/:id/duplicate', loadWorkspaceFromRequest, checkWorkspaceAccess, checkRole('editor'), duplicateRequest);
router.put('/:id', loadWorkspaceFromRequest, checkWorkspaceAccess, checkRole('editor'), updateRequest);
router.patch('/:id/star', loadWorkspaceFromRequest, checkWorkspaceAccess, toggleStar);
router.delete('/:id', loadWorkspaceFromRequest, checkWorkspaceAccess, checkRole('editor'), deleteRequest);

export default router;

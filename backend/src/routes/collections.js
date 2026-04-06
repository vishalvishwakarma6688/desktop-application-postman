import express from 'express';
import {
    createCollection,
    getCollectionsByWorkspace,
    getCollectionById,
    updateCollection,
    deleteCollection,
    exportCollection,
} from '../controllers/collectionController.js';
import auth from '../middlewares/auth.js';
import { checkWorkspaceAccess, checkRole } from '../middlewares/workspaceAccess.js';
import Collection from '../models/Collection.js';

const router = express.Router();

// Middleware to load workspace from collection
const loadWorkspaceFromCollection = async (req, res, next) => {
    try {
        const collection = await Collection.findById(req.params.id);
        if (!collection) {
            const error = new Error('Collection not found');
            error.statusCode = 404;
            return next(error);
        }
        req.body.workspace = collection.workspace.toString();
        next();
    } catch (error) {
        next(error);
    }
};

// All routes require authentication
router.use(auth);

router.post('/', checkWorkspaceAccess, checkRole('editor'), createCollection);
router.get('/workspace/:workspaceId', checkWorkspaceAccess, getCollectionsByWorkspace);
router.get('/:id', getCollectionById);
router.get('/:id/export', loadWorkspaceFromCollection, checkWorkspaceAccess, exportCollection);
router.put('/:id', loadWorkspaceFromCollection, checkWorkspaceAccess, checkRole('editor'), updateCollection);
router.delete('/:id', loadWorkspaceFromCollection, checkWorkspaceAccess, checkRole('editor'), deleteCollection);

export default router;

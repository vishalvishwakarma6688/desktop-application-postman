import express from 'express';
import {
    createWorkspace,
    getWorkspaces,
    getWorkspaceById,
    addMember,
    updateWorkspace,
    deleteWorkspace,
    getWorkspaceSyncData,
    importWorkspaceSyncData
} from '../controllers/workspaceController.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

router.post('/', createWorkspace);
router.get('/', getWorkspaces);
router.get('/:id', getWorkspaceById);
router.get('/:id/sync-data', getWorkspaceSyncData);
router.post('/:id/import-sync-data', importWorkspaceSyncData);
router.post('/:id/members', addMember);
router.put('/:id', updateWorkspace);
router.delete('/:id', deleteWorkspace);

export default router;

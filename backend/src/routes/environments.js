import express from 'express';
import {
    createEnvironment,
    getEnvironmentsByWorkspace,
    getEnvironmentById,
    updateEnvironment,
    deleteEnvironment
} from '../controllers/environmentController.js';
import auth from '../middlewares/auth.js';
import { checkWorkspaceAccess, checkRole } from '../middlewares/workspaceAccess.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

router.post('/', checkWorkspaceAccess, checkRole('editor'), createEnvironment);
router.get('/workspace/:workspaceId', checkWorkspaceAccess, getEnvironmentsByWorkspace);
router.get('/:id', getEnvironmentById);
router.put('/:id', checkRole('editor'), updateEnvironment);
router.delete('/:id', checkRole('editor'), deleteEnvironment);

export default router;

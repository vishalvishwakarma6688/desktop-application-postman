import express from 'express';
import {
    getHistory,
    getHistoryById,
    getHistoryByRequest,
    deleteHistory,
    clearHistory,
    getUrlSuggestions
} from '../controllers/historyController.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

router.get('/', getHistory);
router.get('/url-suggestions', getUrlSuggestions);
router.get('/request/:requestId', getHistoryByRequest);
router.get('/:id', getHistoryById);
router.delete('/:id', deleteHistory);
router.delete('/', clearHistory);

export default router;

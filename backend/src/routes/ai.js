import express from 'express';
import { explainResponse, generateBody, fixRequest, generateTests, chat } from '../controllers/aiController.js';
import auth from '../middlewares/auth.js';

const router = express.Router();
router.use(auth);

router.post('/explain-response', explainResponse);
router.post('/generate-body', generateBody);
router.post('/fix-request', fixRequest);
router.post('/generate-tests', generateTests);
router.post('/chat', chat);

export default router;

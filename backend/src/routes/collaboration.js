import express from 'express';
import protect from '../middlewares/auth.js';
import {
    sendInvitation,
    getWorkspaceInvitations,
    acceptInvitation,
    revokeInvitation,
    getInvitationDetails,
    removeMember,
    updateMemberRole,
    getActiveSessions,
    getAuditLogs
} from '../controllers/collaborationController.js';

const router = express.Router();

// Public invitation retrieval details (doesn't require login/token verification)
router.get('/invitations/:token', getInvitationDetails);

// All other routes require authentication
router.use(protect);

// Invitation routes
router.post('/workspaces/:workspaceId/invitations', sendInvitation);
router.get('/workspaces/:workspaceId/invitations', getWorkspaceInvitations);
router.post('/invitations/:token/accept', acceptInvitation);
router.delete('/invitations/:invitationId', revokeInvitation);

// Member management
router.delete('/workspaces/:workspaceId/members/:memberId', removeMember);
router.patch('/workspaces/:workspaceId/members/:memberId/role', updateMemberRole);

// Active sessions
router.get('/workspaces/:workspaceId/sessions', getActiveSessions);

// Audit logs
router.get('/workspaces/:workspaceId/audit', getAuditLogs);

export default router;

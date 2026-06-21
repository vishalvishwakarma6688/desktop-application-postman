import CollaborationInvitation from '../models/CollaborationInvitation.js';
import CollaborationSession from '../models/CollaborationSession.js';
import CollaborationAudit from '../models/CollaborationAudit.js';
import Workspace from '../models/Workspace.js';
import User from '../models/User.js';
import { sendCollaborationInvitation } from '../services/emailService.js';

// Send collaboration invitation
export const sendInvitation = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { email, role = 'editor', message } = req.body;

        // Validate workspace exists and user has permission
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        // Check if requester is owner or admin
        const isOwner = workspace.owner && req.user?.userId && workspace.owner.toString() === req.user.userId;
        const member = workspace.members.find(m => m.user && req.user?.userId && m.user.toString() === req.user.userId);
        const isAdmin = member?.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Only workspace owners and admins can send invitations' });
        }

        // Check if user is already a member
        const existingMember = workspace.members.find(m => m.user?.email === email);
        if (existingMember || workspace.owner.email === email) {
            return res.status(400).json({ message: 'User is already a member of this workspace' });
        }

        // Check for existing pending invitation
        const existingInvitation = await CollaborationInvitation.findOne({
            workspaceId,
            invitedEmail: email.toLowerCase(),
            status: 'pending'
        });

        if (existingInvitation) {
            return res.status(400).json({ message: 'An invitation has already been sent to this email' });
        }

        // Generate token
        const token = CollaborationInvitation.generateToken();

        // Check if invitee already has an account
        const invitedUser = await User.findOne({ email: email.toLowerCase() });

        // Fetch inviter user info to get name
        const inviter = await User.findById(req.user.userId);
        const inviterName = inviter ? inviter.name : req.user.email;

        // Create invitation
        const invitation = await CollaborationInvitation.create({
            workspaceId,
            invitedBy: req.user.userId,
            invitedEmail: email.toLowerCase(),
            invitedUser: invitedUser?._id || null,
            role,
            token,
            message
        });

        // Send email
        let emailSent = true;
        let emailError = null;
        const invitationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/${token}`;

        console.log('\n🚀 Attempting to send invitation email...');
        console.log('   Frontend URL:', process.env.FRONTEND_URL || 'http://localhost:5173');
        console.log('   Full invitation URL:', invitationUrl);

        try {
            await sendCollaborationInvitation({
                to: email,
                inviterName,
                workspaceName: workspace.name,
                role,
                invitationUrl,
                message
            });
            console.log('✅ Email sent successfully via emailService');
        } catch (emailErr) {
            console.error('\n❌ FAILED to send invitation email in controller:');
            console.error('   Error Name:', emailErr.name);
            console.error('   Error Message:', emailErr.message);
            console.error('   Error Stack:', emailErr.stack);
            emailSent = false;
            emailError = emailErr.message;
        }

        // Audit log
        await CollaborationAudit.create({
            workspaceId,
            userId: req.user.userId,
            action: 'invitation_sent',
            resourceType: 'workspace',
            resourceId: workspaceId,
            metadata: { invitedEmail: email, role }
        });

        res.status(201).json({
            message: emailSent
                ? 'Invitation sent successfully'
                : 'Invitation created, but notification email could not be sent.',
            emailSent,
            emailError,
            invitationUrl,
            invitation: {
                id: invitation._id,
                email: invitation.invitedEmail,
                role: invitation.role,
                status: invitation.status,
                expiresAt: invitation.expiresAt
            }
        });
    } catch (error) {
        console.error('Error sending invitation:', error);
        res.status(500).json({ message: 'Failed to send invitation', error: error.message });
    }
};

// Get all invitations for a workspace
export const getWorkspaceInvitations = async (req, res) => {
    try {
        const { workspaceId } = req.params;

        // Validate workspace exists and user has access
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        const hasAccess = (workspace.owner && req.user?.userId && workspace.owner.toString() === req.user.userId) ||
            workspace.members.some(m => m.user && req.user?.userId && m.user.toString() === req.user.userId);

        if (!hasAccess) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const invitations = await CollaborationInvitation.find({ workspaceId })
            .populate('invitedBy', 'name email avatar')
            .populate('invitedUser', 'name email avatar')
            .sort({ createdAt: -1 });

        res.json({ invitations });
    } catch (error) {
        console.error('Error fetching invitations:', error);
        res.status(500).json({ message: 'Failed to fetch invitations', error: error.message });
    }
};

// Accept invitation
export const acceptInvitation = async (req, res) => {
    try {
        const { token } = req.params;

        const invitation = await CollaborationInvitation.findOne({ token })
            .populate('workspaceId');

        if (!invitation) {
            return res.status(404).json({ message: 'Invitation not found' });
        }

        if (!invitation.isValid()) {
            return res.status(400).json({
                message: invitation.status === 'expired'
                    ? 'This invitation has expired'
                    : 'This invitation is no longer valid'
            });
        }

        const workspace = invitation.workspaceId;

        // Check if user is already a member
        const existingMember = workspace.members.find(
            m => m.user && req.user?.userId && m.user.toString() === req.user.userId
        );

        if (existingMember || workspace.owner.toString() === req.user.userId) {
            invitation.status = 'accepted';
            invitation.acceptedAt = new Date();
            await invitation.save();

            return res.json({
                message: 'You are already a member of this workspace',
                workspace: {
                    id: workspace._id,
                    name: workspace.name
                }
            });
        }

        // Add user to workspace
        workspace.members.push({
            user: req.user.userId,
            role: invitation.role
        });
        await workspace.save();

        // Update invitation
        invitation.status = 'accepted';
        invitation.acceptedAt = new Date();
        invitation.invitedUser = req.user.userId;
        await invitation.save();

        // Audit log
        await CollaborationAudit.create({
            workspaceId: workspace._id,
            userId: req.user.userId,
            action: 'invitation_accepted',
            resourceType: 'workspace',
            resourceId: workspace._id,
            metadata: { role: invitation.role }
        });

        res.json({
            message: 'Invitation accepted successfully',
            workspace: {
                id: workspace._id,
                name: workspace.name,
                role: invitation.role
            }
        });
    } catch (error) {
        console.error('Error accepting invitation:', error);
        res.status(500).json({ message: 'Failed to accept invitation', error: error.message });
    }
};

// Revoke invitation
export const revokeInvitation = async (req, res) => {
    try {
        const { invitationId } = req.params;

        const invitation = await CollaborationInvitation.findById(invitationId);
        if (!invitation) {
            return res.status(404).json({ message: 'Invitation not found' });
        }

        // Verify user has permission
        const workspace = await Workspace.findById(invitation.workspaceId);
        const isOwner = workspace.owner && req.user?.userId && workspace.owner.toString() === req.user.userId;
        const member = workspace.members.find(m => m.user && req.user?.userId && m.user.toString() === req.user.userId);
        const isAdmin = member?.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Only workspace owners and admins can revoke invitations' });
        }

        invitation.status = 'revoked';
        await invitation.save();

        res.json({ message: 'Invitation revoked successfully' });
    } catch (error) {
        console.error('Error revoking invitation:', error);
        res.status(500).json({ message: 'Failed to revoke invitation', error: error.message });
    }
};

// Get invitation details (public endpoint for invitation page)
export const getInvitationDetails = async (req, res) => {
    try {
        const { token } = req.params;

        const invitation = await CollaborationInvitation.findOne({ token })
            .populate('workspaceId', 'name')
            .populate('invitedBy', 'name email avatar');

        if (!invitation) {
            return res.status(404).json({ message: 'Invitation not found' });
        }

        res.json({
            workspace: {
                name: invitation.workspaceId.name
            },
            invitedBy: {
                name: invitation.invitedBy.name,
                email: invitation.invitedBy.email,
                avatar: invitation.invitedBy.avatar
            },
            role: invitation.role,
            status: invitation.status,
            expiresAt: invitation.expiresAt,
            isValid: invitation.isValid(),
            message: invitation.message
        });
    } catch (error) {
        console.error('Error fetching invitation details:', error);
        res.status(500).json({ message: 'Failed to fetch invitation details', error: error.message });
    }
};

// Remove member from workspace
export const removeMember = async (req, res) => {
    try {
        const { workspaceId, memberId } = req.params;

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        // Check permission
        const isOwner = workspace.owner && req.user?.userId && workspace.owner.toString() === req.user.userId;
        const requesterMember = workspace.members.find(m => m.user && req.user?.userId && m.user.toString() === req.user.userId);
        const isAdmin = requesterMember?.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Only workspace owners and admins can remove members' });
        }

        // Cannot remove owner
        if (workspace.owner.toString() === memberId) {
            return res.status(400).json({ message: 'Cannot remove workspace owner' });
        }

        // Remove member
        workspace.members = workspace.members.filter(m => m.user.toString() !== memberId);
        await workspace.save();

        // Remove from active sessions
        await CollaborationSession.updateMany(
            { workspaceId, 'activeUsers.userId': memberId },
            { $pull: { activeUsers: { userId: memberId } } }
        );

        // Audit log
        await CollaborationAudit.create({
            workspaceId,
            userId: req.user._id,
            action: 'permission_revoked',
            resourceType: 'workspace',
            resourceId: workspaceId,
            metadata: { removedUserId: memberId }
        });

        res.json({ message: 'Member removed successfully' });
    } catch (error) {
        console.error('Error removing member:', error);
        res.status(500).json({ message: 'Failed to remove member', error: error.message });
    }
};

// Update member role
export const updateMemberRole = async (req, res) => {
    try {
        const { workspaceId, memberId } = req.params;
        const { role } = req.body;

        if (!['viewer', 'editor', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        // Only owner can change roles
        if (!workspace.owner || !req.user?.userId || workspace.owner.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Only workspace owner can change member roles' });
        }

        // Cannot change owner's role
        if (workspace.owner.toString() === memberId) {
            return res.status(400).json({ message: 'Cannot change owner role' });
        }

        // Update role
        const member = workspace.members.find(m => m.user && m.user.toString() === memberId);
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        member.role = role;
        await workspace.save();

        // Audit log
        await CollaborationAudit.create({
            workspaceId,
            userId: req.user._id,
            action: 'permission_granted',
            resourceType: 'workspace',
            resourceId: workspaceId,
            metadata: { targetUserId: memberId, newRole: role }
        });

        res.json({ message: 'Member role updated successfully' });
    } catch (error) {
        console.error('Error updating member role:', error);
        res.status(500).json({ message: 'Failed to update member role', error: error.message });
    }
};

// Get active collaboration sessions for a workspace
export const getActiveSessions = async (req, res) => {
    try {
        const { workspaceId } = req.params;

        // Verify access
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        const hasAccess = (workspace.owner && req.user?.userId && workspace.owner.toString() === req.user.userId) ||
            workspace.members.some(m => m.user && req.user?.userId && m.user.toString() === req.user.userId);

        if (!hasAccess) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const sessions = await CollaborationSession.find({
            workspaceId,
            isActive: true
        }).populate('activeUsers.userId', 'name email avatar');

        res.json({ sessions });
    } catch (error) {
        console.error('Error fetching active sessions:', error);
        res.status(500).json({ message: 'Failed to fetch active sessions', error: error.message });
    }
};

// Get collaboration audit logs
export const getAuditLogs = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { limit = 50, skip = 0 } = req.query;

        // Verify access
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        const isOwner = workspace.owner && req.user?.userId && workspace.owner.toString() === req.user.userId;
        const member = workspace.members.find(m => m.user && req.user?.userId && m.user.toString() === req.user.userId);
        const isAdmin = member?.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Only workspace owners and admins can view audit logs' });
        }

        const logs = await CollaborationAudit.find({ workspaceId })
            .populate('userId', 'name email avatar')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await CollaborationAudit.countDocuments({ workspaceId });

        res.json({
            logs,
            pagination: {
                total,
                limit: parseInt(limit),
                skip: parseInt(skip)
            }
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ message: 'Failed to fetch audit logs', error: error.message });
    }
};

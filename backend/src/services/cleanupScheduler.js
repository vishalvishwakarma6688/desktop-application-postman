import CollaborationSession from '../models/CollaborationSession.js';
import CollaborationInvitation from '../models/CollaborationInvitation.js';
import CollaborationAudit from '../models/CollaborationAudit.js';

/**
 * Cleanup scheduler for collaboration-related data
 * Runs periodic cleanup tasks to keep the database clean
 */

class CleanupScheduler {
    constructor() {
        this.intervals = [];
    }

    start() {
        console.log('🧹 Starting cleanup scheduler...');

        // Cleanup inactive sessions every hour
        const sessionCleanup = setInterval(async () => {
            try {
                await CollaborationSession.cleanupInactive();
                console.log('✅ Cleaned up inactive collaboration sessions');
            } catch (error) {
                console.error('❌ Error cleaning up sessions:', error);
            }
        }, 60 * 60 * 1000); // 1 hour

        // Expire old invitations every 6 hours
        const invitationCleanup = setInterval(async () => {
            try {
                await CollaborationInvitation.expireOldInvitations();
                console.log('✅ Expired old collaboration invitations');
            } catch (error) {
                console.error('❌ Error expiring invitations:', error);
            }
        }, 6 * 60 * 60 * 1000); // 6 hours

        // Cleanup old audit logs (90+ days) once per day
        const auditCleanup = setInterval(async () => {
            try {
                await CollaborationAudit.cleanupOldLogs();
                console.log('✅ Cleaned up old audit logs');
            } catch (error) {
                console.error('❌ Error cleaning up audit logs:', error);
            }
        }, 24 * 60 * 60 * 1000); // 24 hours

        // Remove stale users from active sessions every 5 minutes
        const staleUserCleanup = setInterval(async () => {
            try {
                const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
                const result = await CollaborationSession.updateMany(
                    { 'activeUsers.lastActivity': { $lt: fiveMinutesAgo } },
                    { $pull: { activeUsers: { lastActivity: { $lt: fiveMinutesAgo } } } }
                );

                // Deactivate sessions with no active users
                await CollaborationSession.updateMany(
                    { activeUsers: { $size: 0 }, isActive: true },
                    { $set: { isActive: false } }
                );

                if (result.modifiedCount > 0) {
                    console.log(`✅ Removed ${result.modifiedCount} stale users from sessions`);
                }
            } catch (error) {
                console.error('❌ Error cleaning up stale users:', error);
            }
        }, 5 * 60 * 1000); // 5 minutes

        this.intervals = [sessionCleanup, invitationCleanup, auditCleanup, staleUserCleanup];
        console.log('✅ Cleanup scheduler started');
    }

    stop() {
        console.log('🛑 Stopping cleanup scheduler...');
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
        console.log('✅ Cleanup scheduler stopped');
    }
}

const cleanupScheduler = new CleanupScheduler();
export default cleanupScheduler;

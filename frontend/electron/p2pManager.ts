import * as dgram from 'dgram';
import { getLocalIpAddress } from './lanServer.js';

const MULTICAST_ADDR = '239.255.255.250';
const PORT = 41234;

let udpSocket: dgram.Socket | null = null;
let announcementInterval: ReturnType<typeof setInterval> | null = null;
let pruneInterval: ReturnType<typeof setInterval> | null = null;

let currentUser: { userId: string; username: string } | null = null;
let onPeersUpdated: ((peers: any[]) => void) | null = null;
let onSharePrompt: ((data: any) => void) | null = null;

const peersMap = new Map<string, {
    userId: string;
    username: string;
    ip: string;
    lastSeen: number;
}>();

/**
 * Start the P2P discovery and broadcast loop
 */
export function startP2P(
    userId: string,
    username: string,
    onPeersChanged: (peers: any[]) => void,
    onIncomingShare: (data: any) => void
) {
    // If already running, stop first
    stopP2P();

    currentUser = { userId, username };
    onPeersUpdated = onPeersChanged;
    onSharePrompt = onIncomingShare;
    peersMap.clear();

    try {
        udpSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

        udpSocket.on('error', (err) => {
            console.error('[P2P] UDP Socket error:', err.message);
            stopP2P();
        });

        udpSocket.on('message', (msg, rinfo) => {
            try {
                const data = JSON.parse(msg.toString());

                if (data.type === 'announce') {
                    // Ignore our own announcements
                    if (currentUser && data.userId === currentUser.userId) {
                        return;
                    }

                    peersMap.set(data.userId, {
                        userId: data.userId,
                        username: data.username,
                        ip: rinfo.address, // Sender's actual IP
                        lastSeen: Date.now()
                    });

                    triggerPeersUpdate();
                } else if (data.type === 'share-invite') {
                    // Handled direct unicast invitation
                    console.log(`[P2P] Received direct share invitation from ${data.senderName} (${rinfo.address})`);
                    if (onSharePrompt) {
                        onSharePrompt({
                            senderName: data.senderName,
                            url: data.url,
                            pin: data.pin,
                            workspaceName: data.workspaceName
                        });
                    }
                }
            } catch (err) {
                // Ignore malformed messages
            }
        });

        udpSocket.bind(PORT, () => {
            if (!udpSocket) return;
            try {
                udpSocket.addMembership(MULTICAST_ADDR);
                udpSocket.setMulticastLoopback(false);
                console.log(`[P2P] Bound to UDP port ${PORT} and joined multicast group ${MULTICAST_ADDR}`);
            } catch (err: any) {
                console.error('[P2P] Failed to join multicast group:', err.message);
            }

            // Trigger initial announcement immediately
            sendAnnouncement();
        });

        // Start announcement broadcast interval (every 10 seconds)
        announcementInterval = setInterval(sendAnnouncement, 10000);

        // Start pruning interval (every 15 seconds)
        pruneInterval = setInterval(pruneOfflinePeers, 15000);

    } catch (err: any) {
        console.error('[P2P] Failed to initialize UDP socket:', err.message);
    }
}

/**
 * Stop P2P discovery and cleanup all sockets/timers
 */
export function stopP2P() {
    if (announcementInterval) {
        clearInterval(announcementInterval);
        announcementInterval = null;
    }
    if (pruneInterval) {
        clearInterval(pruneInterval);
        pruneInterval = null;
    }

    if (udpSocket) {
        try {
            udpSocket.dropMembership(MULTICAST_ADDR);
        } catch {
            // Ignore if membership was not added yet
        }
        try {
            udpSocket.close();
        } catch {
            // Ignore socket closure errors
        }
        udpSocket = null;
    }

    currentUser = null;
    onPeersUpdated = null;
    onSharePrompt = null;
    peersMap.clear();
    console.log('[P2P] Stopped discovery services and cleared peer lists.');
}

/**
 * Send a direct sharing invite to a target peer's IP address
 */
export function sendP2PInvite(targetIp: string, inviteData: {
    senderName: string;
    url: string;
    pin: string;
    workspaceName: string;
}) {
    if (!udpSocket) {
        throw new Error('P2P signaling socket is not active.');
    }

    const payload = JSON.stringify({
        type: 'share-invite',
        ...inviteData
    });

    const buffer = Buffer.from(payload);
    udpSocket.send(buffer, 0, buffer.length, PORT, targetIp, (err) => {
        if (err) {
            console.error(`[P2P] Failed to send invite to ${targetIp}:`, err.message);
        } else {
            console.log(`[P2P] Unicast invitation sent to target: ${targetIp}:${PORT}`);
        }
    });
}

/**
 * Broadcast our identity to the local multicast group
 */
function sendAnnouncement() {
    if (!udpSocket || !currentUser) return;

    const payload = JSON.stringify({
        type: 'announce',
        userId: currentUser.userId,
        username: currentUser.username
    });

    const buffer = Buffer.from(payload);
    udpSocket.send(buffer, 0, buffer.length, PORT, MULTICAST_ADDR, (err) => {
        if (err) {
            console.warn('[P2P] Broadcast failed:', err.message);
        }
    });
}

/**
 * Remove peers that haven't been heard from for more than 30 seconds
 */
function pruneOfflinePeers() {
    const threshold = Date.now() - 30000;
    let changed = false;
    const expiredIds: string[] = [];

    peersMap.forEach((peer, userId) => {
        if (peer.lastSeen < threshold) {
            expiredIds.push(userId);
        }
    });

    expiredIds.forEach(userId => {
        const peer = peersMap.get(userId);
        peersMap.delete(userId);
        changed = true;
        if (peer) {
            console.log(`[P2P] Peer ${peer.username} (${peer.ip}) has timed out and is marked offline.`);
        }
    });

    if (changed) {
        triggerPeersUpdate();
    }
}

/**
 * Notify the React renderer of the current peer list
 */
function triggerPeersUpdate() {
    if (onPeersUpdated) {
        const peersList: any[] = [];
        peersMap.forEach((p) => {
            peersList.push({
                userId: p.userId,
                username: p.username,
                ip: p.ip
            });
        });
        onPeersUpdated(peersList);
    }
}

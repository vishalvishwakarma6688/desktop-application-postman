import { Notification, BrowserWindow } from 'electron';
import { updateTrayStatus } from './trayManager.js';

export interface MonitoredRequest {
    id: string;
    name: string;
    method: string;
    url: string;
    headers: Array<{ key: string; value: string; enabled: boolean }>;
    queryParams: Array<{ key: string; value: string; enabled: boolean }>;
    body?: { type: string; content: any };
    auth?: any;
    interval: number; // in seconds
    lastStatus?: 'healthy' | 'unhealthy' | 'unknown';
}

interface ActiveMonitor {
    request: MonitoredRequest;
    intervalId: NodeJS.Timeout;
}

const activeMonitors = new Map<string, ActiveMonitor>();
let webContentsWindow: BrowserWindow | null = null;

export function setupHealthMonitor(mainWindow: BrowserWindow) {
    webContentsWindow = mainWindow;
}

/**
 * Triggers an immediate sweep of all active health checks
 */
export function triggerImmediateSweep() {
    console.log(`[HEALTH MONITOR] Triggering immediate sweep for ${activeMonitors.size} checks...`);
    for (const [id, monitor] of activeMonitors.entries()) {
        runHealthCheck(monitor.request);
    }
}

/**
 * Sync active monitors from the renderer process
 */
export function registerMonitors(requests: MonitoredRequest[]) {
    console.log(`[HEALTH MONITOR] Syncing monitors. Received count: ${requests.length}`);
    
    const incomingIds = new Set(requests.map(r => r.id));

    // 1. Remove monitors that are no longer requested
    for (const [id, monitor] of activeMonitors.entries()) {
        if (!incomingIds.has(id)) {
            clearInterval(monitor.intervalId);
            activeMonitors.delete(id);
            console.log(`[HEALTH MONITOR] Removed monitor for: ${monitor.request.name}`);
        }
    }

    // 2. Add or update monitors
    for (const req of requests) {
        const existing = activeMonitors.get(req.id);
        const intervalMs = Math.max(req.interval, 15) * 1000; // Minimum 15s check rate

        if (existing) {
            // If interval or config changed, restart timer
            if (existing.request.interval !== req.interval || existing.request.url !== req.url || existing.request.method !== req.method) {
                clearInterval(existing.intervalId);
                
                const intervalId = setInterval(() => runHealthCheck(req), intervalMs);
                activeMonitors.set(req.id, { request: req, intervalId });
                console.log(`[HEALTH MONITOR] Updated monitor interval for: ${req.name} (${req.interval}s)`);
                // Trigger check immediately on update
                runHealthCheck(req);
            } else {
                // Update request model details in-place
                existing.request = req;
            }
        } else {
            // Create a new background loop
            const intervalId = setInterval(() => runHealthCheck(req), intervalMs);
            activeMonitors.set(req.id, { request: req, intervalId });
            console.log(`[HEALTH MONITOR] Started monitor for: ${req.name} (every ${req.interval}s)`);
            // Run immediately on registration
            runHealthCheck(req);
        }
    }

    // Update tray display immediately
    updateTrayStatusSummary();
}

/**
 * Perform a network request to assess endpoint health
 */
async function runHealthCheck(req: MonitoredRequest) {
    const startTime = Date.now();
    let isHealthy = false;
    let details = '';
    let responseTime = 0;

    try {
        // Build query string
        let fullUrl = req.url;
        const enabledParams = (req.queryParams || []).filter(p => p.enabled && p.key);
        if (enabledParams.length > 0) {
            const queryConnector = fullUrl.includes('?') ? '&' : '?';
            const queryStr = enabledParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&');
            fullUrl += `${queryConnector}${queryStr}`;
        }

        // Build headers
        const headersObj: Record<string, string> = {
            'User-Agent': 'APIFlow-Health-Monitor'
        };
        (req.headers || []).forEach(h => {
            if (h.enabled && h.key) {
                headersObj[h.key] = h.value;
            }
        });

        // Add authorization headers
        if (req.auth && req.auth.type !== 'none') {
            if (req.auth.type === 'bearer' && req.auth.bearer?.token) {
                headersObj['Authorization'] = `Bearer ${req.auth.bearer.token}`;
            } else if (req.auth.type === 'basic' && req.auth.basic) {
                const creds = `${req.auth.basic.username || ''}:${req.auth.basic.password || ''}`;
                headersObj['Authorization'] = `Basic ${Buffer.from(creds).toString('base64')}`;
            } else if (req.auth.type === 'apikey' && req.auth.apikey) {
                const { key, value, addTo } = req.auth.apikey;
                if (key && value) {
                    if (addTo === 'header') {
                        headersObj[key] = value;
                    } else if (addTo === 'query') {
                        const connector = fullUrl.includes('?') ? '&' : '?';
                        fullUrl += `${connector}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
                    }
                }
            }
        }

        // Map method & request options
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

        const response = await fetch(fullUrl, {
            method: req.method,
            headers: headersObj,
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        responseTime = Date.now() - startTime;
        isHealthy = response.ok; // Status is 200-299
        details = `${response.status} ${response.statusText}`;
    } catch (err: any) {
        responseTime = Date.now() - startTime;
        isHealthy = false;
        details = err.name === 'AbortError' ? 'Timeout (exceeded 8s)' : err.message || 'Connection failed';
    }

    const newStatus = isHealthy ? 'healthy' : 'unhealthy';
    const oldStatus = req.lastStatus || 'unknown';

    // Update in memory model
    req.lastStatus = newStatus;

    // Send notifications and renderer updates on status transition
    if (newStatus !== oldStatus) {
        sendOsNotification(req, newStatus, details);
    }

    // Broadcast status change back to React Renderer
    if (webContentsWindow && !webContentsWindow.isDestroyed()) {
        webContentsWindow.webContents.send('health:status-change', {
            requestId: req.id,
            status: newStatus,
            checkedAt: new Date().toISOString(),
            responseTime,
            details
        });
    }

    updateTrayStatusSummary();
}

/**
 * Updates the OS Tray icon counters
 */
function updateTrayStatusSummary() {
    const total = activeMonitors.size;
    let healthy = 0;
    for (const monitor of activeMonitors.values()) {
        if (monitor.request.lastStatus === 'healthy') {
            healthy++;
        }
    }
    updateTrayStatus(healthy, total);
}

/**
 * Sends a native OS alert notification
 */
function sendOsNotification(req: MonitoredRequest, status: 'healthy' | 'unhealthy', details: string) {
    if (Notification.isSupported()) {
        const title = status === 'healthy' ? '💚 API Recovered' : '🚨 API Alert: Failed';
        const body = status === 'healthy'
            ? `"${req.name}" (${req.method} ${req.url}) is healthy again. (${details})`
            : `"${req.name}" (${req.method} ${req.url}) went offline. Details: ${details}`;

        const notification = new Notification({ title, body });
        notification.show();
    }
}

import * as http from 'http';
import * as os from 'os';
import { URL } from 'url';

let activeServer: http.Server | null = null;

/**
 * Find the primary LAN IPv4 address of this machine
 */
export function getLocalIpAddress(): string {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        const netInterface = interfaces[name];
        if (!netInterface) continue;
        
        for (const net of netInterface) {
            // Check for IPv4, skip loopback / internal / VM virtual interfaces if possible
            if (net.family === 'IPv4' && !net.internal) {
                // Focus on common LAN subnets: 192.168.x.x, 10.x.x.x, 172.16-31.x.x
                if (net.address.startsWith('192.168.') || 
                    net.address.startsWith('10.') || 
                    net.address.startsWith('172.')) {
                    return net.address;
                }
            }
        }
    }
    // Fallback to first non-internal IPv4
    for (const name of Object.keys(interfaces)) {
        const netInterface = interfaces[name];
        if (!netInterface) continue;
        for (const net of netInterface) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return '127.0.0.1';
}

/**
 * Start the HTTP server to serve the shared workspace payload
 */
export function startLanServer(payload: string, pin: string): Promise<{ port: number; ip: string }> {
    return new Promise((resolve, reject) => {
        // Stop any currently running share server
        stopLanServer();

        activeServer = http.createServer((req, res) => {
            // Enable CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', '*');

            if (req.method === 'OPTIONS') {
                res.writeHead(204);
                res.end();
                return;
            }

            const parsedUrl = new URL(req.url || '', `http://${req.headers.host}`);
            
            if (parsedUrl.pathname === '/share' && req.method === 'GET') {
                const reqPin = parsedUrl.searchParams.get('pin');
                if (reqPin === pin) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(payload);
                    
                    // Auto-shutdown server shortly after successful retrieval
                    setTimeout(() => {
                        console.log('[LAN SHARE] Successful share transfer. Shutting down server...');
                        stopLanServer();
                    }, 2000);
                } else {
                    res.writeHead(403, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Forbidden: Invalid PIN' }));
                }
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not Found' }));
            }
        });

        // Listen on an ephemeral random port (0 will auto-assign a free port)
        activeServer.listen(0, '0.0.0.0', () => {
            const address = activeServer?.address();
            if (address && typeof address === 'object') {
                const port = address.port;
                const ip = getLocalIpAddress();
                console.log(`[LAN SHARE] Started HTTP server on http://${ip}:${port} (PIN: ${pin})`);
                resolve({ port, ip });
            } else {
                reject(new Error('Failed to get port address'));
            }
        });

        activeServer.on('error', (err) => {
            console.error('[LAN SHARE] Server error:', err);
            reject(err);
        });
    });
}

/**
 * Stop the running HTTP server
 */
export function stopLanServer() {
    if (activeServer) {
        try {
            activeServer.close();
            console.log('[LAN SHARE] Stopped HTTP server');
        } catch (err: any) {
            console.error('[LAN SHARE] Error stopping server:', err.message);
        }
        activeServer = null;
    }
}

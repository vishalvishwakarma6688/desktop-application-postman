import { parentPort, workerData } from 'worker_threads';
import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

if (!parentPort) {
    process.exit(1);
}

const { url, method, headers, body, concurrency, duration } = workerData;

const parsedUrl = new URL(url);
const isHttps = parsedUrl.protocol === 'https:';

// Configure high-performance keepAlive agents to reuse connections
const agentOptions = {
    keepAlive: true,
    keepAliveMsecs: 1000,
    maxSockets: concurrency,
    maxFreeSockets: concurrency,
    timeout: 5000,
};

const httpAgent = new http.Agent(agentOptions);
const httpsAgent = new https.Agent(agentOptions);

const startTime = Date.now();
const endTime = startTime + duration * 1000;

let activeRequests = 0;
let stopRequested = false;

// Global metrics
let totalCompleted = 0;
let totalFailed = 0;

// Tick metrics (reset every 200ms)
let tickCompleted = 0;
let tickFailed = 0;
const tickLatencies: number[] = [];
const errorCounts = new Map<string, number>();

// Set up the message handler to listen for stop commands
parentPort.on('message', (msg) => {
    if (msg.type === 'stop') {
        stopRequested = true;
    }
});

// Periodic status report timer (every 200ms)
const tickInterval = setInterval(() => {
    if (!parentPort) return;

    parentPort.postMessage({
        type: 'tick',
        data: {
            completed: tickCompleted,
            failed: tickFailed,
            latencies: [...tickLatencies],
        }
    });

    // Reset tick accumulators
    tickCompleted = 0;
    tickFailed = 0;
    tickLatencies.length = 0;
}, 200);

// Start the request loops up to the target concurrency
for (let i = 0; i < concurrency; i++) {
    fireRequest();
}

/**
 * Execute a single HTTP/HTTPS request and chain the next one
 */
function fireRequest() {
    if (stopRequested || Date.now() >= endTime) {
        if (activeRequests === 0) {
            finishTest();
        }
        return;
    }

    activeRequests++;
    const reqStartTime = Date.now();

    const requestModule = isHttps ? https : http;
    const agent = isHttps ? httpsAgent : httpAgent;

    const requestHeaders = { ...headers };
    if (body && !requestHeaders['Content-Length']) {
        requestHeaders['Content-Length'] = Buffer.byteLength(body);
    }

    const options: http.RequestOptions = {
        method: method || 'GET',
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        headers: requestHeaders,
        agent: agent,
        timeout: 5000,
    };

    const req = requestModule.request(options, (res) => {
        // Read response body data to free the socket socket back to the pool
        res.on('data', () => {});
        
        res.on('end', () => {
            const latency = Date.now() - reqStartTime;
            const status = res.statusCode || 0;

            if (status >= 200 && status < 400) {
                tickCompleted++;
                totalCompleted++;
            } else {
                tickFailed++;
                totalFailed++;
                recordError(`Status ${status}`);
            }
            tickLatencies.push(latency);
            
            activeRequests--;
            fireRequest();
        });
    });

    req.on('error', (err) => {
        const latency = Date.now() - reqStartTime;
        tickFailed++;
        totalFailed++;
        tickLatencies.push(latency);
        recordError(err.message || 'Network Error');
        
        activeRequests--;
        fireRequest();
    });

    req.on('timeout', () => {
        req.destroy();
    });

    if (body) {
        req.write(body);
    }
    req.end();
}

function recordError(msg: string) {
    const count = errorCounts.get(msg) || 0;
    errorCounts.set(msg, count + 1);
}

/**
 * End the test, clear timers, and send final aggregated metrics
 */
function finishTest() {
    clearInterval(tickInterval);
    
    // Cleanup agent sockets
    httpAgent.destroy();
    httpsAgent.destroy();

    if (parentPort) {
        parentPort.postMessage({
            type: 'complete',
            data: {
                totalCompleted,
                totalFailed,
                errors: Object.fromEntries(errorCounts.entries()),
                durationMs: Date.now() - startTime
            }
        });
    }

    // Force terminate worker
    process.exit(0);
}

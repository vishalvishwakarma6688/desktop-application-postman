import { Worker } from 'worker_threads';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let activeWorker: Worker | null = null;

export interface StressParams {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: string | null;
    concurrency: number;
    duration: number; // in seconds
}

/**
 * Start a new stress test worker thread
 */
export function startStressTest(
    params: StressParams,
    onTick: (metrics: any) => void,
    onComplete: (report: any) => void
) {
    // If a stress test is already running, terminate it first
    stopStressTest();

    // Resolve path of stressWorker.js (outputted to dist-electron)
    const workerPath = path.join(__dirname, 'stressWorker.js');
    console.log(`[STRESS MANAGER] Spawning load worker from: ${workerPath}`);

    try {
        activeWorker = new Worker(workerPath, {
            workerData: params
        });

        activeWorker.on('message', (msg) => {
            if (msg.type === 'tick') {
                onTick(msg.data);
            } else if (msg.type === 'complete') {
                onComplete(msg.data);
                activeWorker = null;
            }
        });

        activeWorker.on('error', (err) => {
            console.error('[STRESS MANAGER] Worker thread error:', err.message);
            onComplete({ error: err.message });
            activeWorker = null;
        });

        activeWorker.on('exit', (code) => {
            console.log(`[STRESS MANAGER] Worker thread exited with code ${code}`);
            activeWorker = null;
        });

    } catch (err: any) {
        console.error('[STRESS MANAGER] Failed to spawn worker:', err.message);
        onComplete({ error: err.message });
        activeWorker = null;
    }
}

/**
 * Terminate the active stress test worker thread instantly
 */
export function stopStressTest() {
    if (activeWorker) {
        console.log('[STRESS MANAGER] Force terminating active load worker thread...');
        try {
            // Send stop command first for graceful exit if still responsive
            activeWorker.postMessage({ type: 'stop' });
            
            // Terminate thread to stop requests instantly
            activeWorker.terminate();
        } catch (err: any) {
            console.error('[STRESS MANAGER] Failed to stop worker:', err.message);
        }
        activeWorker = null;
    }
}

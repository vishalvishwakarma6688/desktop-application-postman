import { useState, useEffect, useRef } from 'react';
import { useStressStore, StressTick, StressFinalReport } from '@/store/useStressStore';
import { useRequestStore } from '@/store/useRequestStore';
import { Request, Environment, EnvironmentVariable, KeyValue } from '@/types';
import { Play, Square, AlertCircle, BarChart2, Gauge, Clock, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
    request: Request;
}

export default function StressTestTab({ request }: Props) {
    const { activeEnvironment } = useRequestStore();
    const {
        isRunning,
        completedCount,
        failedCount,
        latenciesHistory,
        rpsHistory,
        errors,
        testCompleted,
        error: runError,
        setRunning,
        addTick,
        completeTest,
        reset
    } = useStressStore();

    const [concurrency, setConcurrency] = useState(10);
    const [duration, setDuration] = useState(10); // in seconds

    // Register IPC listeners for progress metrics
    useEffect(() => {
        if (!window.electronAPI) return;

        window.electronAPI.receive('stress:metrics-tick', (tick: StressTick) => {
            addTick(tick);
        });

        window.electronAPI.receive('stress:complete', (report: StressFinalReport) => {
            completeTest(report);
            if (report.error) {
                toast.error(`Stress test failed: ${report.error}`);
            } else {
                toast.success('Stress test completed successfully!');
            }
        });

        return () => {
            window.electronAPI.removeListener('stress:metrics-tick');
            window.electronAPI.removeListener('stress:complete');
        };
    }, [addTick, completeTest]);

    const isRunningRef = useRef(isRunning);
    useEffect(() => {
        isRunningRef.current = isRunning;
    }, [isRunning]);

    // Cleanup running tests on component unmount
    useEffect(() => {
        return () => {
            if (isRunningRef.current && window.electronAPI) {
                window.electronAPI.invoke('stress:stop').catch(console.error);
            }
            reset();
        };
    }, [reset]);

    const handleStart = async () => {
        if (!window.electronAPI) {
            return toast.error('Stress testing is only available in the Desktop Application.');
        }

        try {
            // 1. Resolve variables, headers, auth, query params, and body
            const params = resolveRequestParams(request, activeEnvironment, concurrency, duration);

            // 2. Clear state and mark test running
            setRunning(true);

            // 3. Invoke electron main process to spawn the worker
            const res = await window.electronAPI.invoke('stress:start', { params });
            if (!res?.success) {
                throw new Error(res?.error || 'Failed to initialize load worker thread');
            }
        } catch (err: any) {
            console.error('[STRESS START] Failed:', err);
            toast.error(err.message || 'Failed to start stress test');
            reset();
        }
    };

    const handleStop = async () => {
        if (!window.electronAPI) return;
        try {
            await window.electronAPI.invoke('stress:stop');
            toast.success('Stress test terminated.');
        } catch (err: any) {
            console.error('[STRESS STOP] Failed:', err);
        }
    };

    const totalRequests = completedCount + failedCount;
    const successRate = totalRequests > 0 ? Math.round((completedCount / totalRequests) * 100) : 0;
    const avgLatency = latenciesHistory.length > 0
        ? Math.round(latenciesHistory.reduce((a, b) => a + b, 0) / latenciesHistory.length)
        : 0;
    const maxRps = rpsHistory.length > 0 ? Math.max(...rpsHistory) : 0;

    return (
        <div className="flex h-full flex-col bg-gray-900 text-gray-200">
            {/* Top configuration header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 bg-gray-950/20 px-6 py-4">
                <div className="flex items-center gap-6">
                    {/* Concurrency slider */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-gray-400">Concurrency (Users):</span>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            value={concurrency}
                            disabled={isRunning}
                            onChange={(e) => setConcurrency(parseInt(e.target.value))}
                            className="h-1.5 w-32 cursor-pointer appearance-none rounded-lg bg-gray-800 accent-orange-500 disabled:opacity-40"
                        />
                        <span className="text-sm font-bold text-orange-400 w-8">{concurrency}</span>
                    </div>

                    {/* Duration select */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-gray-400">Duration:</span>
                        <select
                            value={duration}
                            disabled={isRunning}
                            onChange={(e) => setDuration(parseInt(e.target.value))}
                            className="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-200 focus:border-orange-500 focus:outline-none disabled:opacity-40"
                        >
                            <option value={5}>5 seconds</option>
                            <option value={10}>10 seconds</option>
                            <option value={30}>30 seconds</option>
                            <option value={60}>60 seconds</option>
                        </select>
                    </div>
                </div>

                {/* Control Action Buttons */}
                <div className="flex items-center gap-2">
                    {isRunning ? (
                        <button
                            onClick={handleStop}
                            className="flex items-center gap-2 rounded bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 text-xs font-semibold transition-all active:scale-95 shadow-lg shadow-red-950/20"
                        >
                            <Square className="h-3.5 w-3.5 fill-current" />
                            <span>Stop Stress Test</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleStart}
                            className="flex items-center gap-2 rounded bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 text-xs font-semibold transition-all active:scale-95 shadow-lg shadow-orange-950/20"
                        >
                            <Play className="h-3.5 w-3.5 fill-current" />
                            <span>Start Stress Test</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Content panel */}
            <div className="flex-1 overflow-auto p-6 space-y-6">
                {/* Warnings / Error messages */}
                {runError && (
                    <div className="flex items-center gap-3 rounded-lg border border-red-800 bg-red-950/20 p-3.5 text-sm text-red-400">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <span>{runError}</span>
                    </div>
                )}

                {/* Active/Completed Stats Dashboard */}
                {(isRunning || testCompleted) && (
                    <>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <div className="rounded-lg border border-gray-800 bg-gray-950/20 p-4 flex items-center gap-3.5">
                                <div className="rounded-md bg-orange-500/10 p-2.5 text-orange-400">
                                    <Gauge className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Total Requests</div>
                                    <div className="text-xl font-bold text-gray-100">{totalRequests}</div>
                                </div>
                            </div>

                            <div className="rounded-lg border border-gray-800 bg-gray-950/20 p-4 flex items-center gap-3.5">
                                <div className="rounded-md bg-emerald-500/10 p-2.5 text-emerald-400">
                                    <BarChart2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Success Rate</div>
                                    <div className={`text-xl font-bold ${successRate >= 90 ? 'text-emerald-400' : 'text-yellow-500'}`}>
                                        {successRate}%
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border border-gray-800 bg-gray-950/20 p-4 flex items-center gap-3.5">
                                <div className="rounded-md bg-blue-500/10 p-2.5 text-blue-400">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Avg Latency</div>
                                    <div className="text-xl font-bold text-blue-400">{avgLatency} ms</div>
                                </div>
                            </div>

                            <div className="rounded-lg border border-gray-800 bg-gray-950/20 p-4 flex items-center gap-3.5">
                                <div className="rounded-md bg-purple-500/10 p-2.5 text-purple-400">
                                    <Gauge className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Peak RPS</div>
                                    <div className="text-xl font-bold text-purple-400">{maxRps} r/s</div>
                                </div>
                            </div>
                        </div>

                        {/* Real-time Line charts */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <SVGLineChart data={rpsHistory} color="#10b981" label="Requests Per Second (RPS)" />
                            <SVGLineChart data={latenciesHistory} color="#f97316" label="Latency history (ms)" />
                        </div>

                        {/* Errors summary panel */}
                        {Object.keys(errors).length > 0 && (
                            <div className="rounded-lg border border-gray-800 bg-gray-950/20 p-5">
                                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-400">
                                    <ShieldAlert className="h-4 w-4" />
                                    <span>Errors Summary</span>
                                </h4>
                                <div className="space-y-2.5">
                                    {Object.entries(errors).map(([errMsg, count]) => (
                                        <div key={errMsg} className="flex items-center justify-between rounded border border-red-950/30 bg-red-950/5 px-3 py-1.5 text-xs">
                                            <span className="font-mono text-red-300">{errMsg}</span>
                                            <span className="font-bold text-red-400">{count} occurances</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Idle instruction state */}
                {!isRunning && !testCompleted && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Gauge className="h-16 w-16 text-gray-700 mb-4 animate-pulse" />
                        <h3 className="text-base font-bold text-gray-300 mb-1">Local API Stress Tester</h3>
                        <p className="max-w-md text-xs text-gray-500 mb-5 leading-relaxed">
                            Simulate constant concurrent requests directly from the app. Perfect for benchmarking endpoint limits or monitoring thread locks on local servers.
                        </p>
                        <button
                            onClick={handleStart}
                            className="rounded bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 px-5 py-2 text-xs font-semibold transition-all hover:scale-105"
                        >
                            Launch Stress Run
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Replaces any double curly brace variable tags in a string using environment variables list
 */
function replaceVariables(str: string, variables: EnvironmentVariable[]): string {
    if (!str) return str;
    let result = str;
    variables.forEach(v => {
        if (v.enabled && v.key) {
            const regex = new RegExp(`\\{\\{\\s*${v.key}\\s*\\}\\}`, 'g');
            result = result.replace(regex, v.value || '');
        }
    });
    return result;
}

/**
 * Maps frontend Request model fields to worker-threads parameters
 */
function resolveRequestParams(
    request: Request,
    activeEnvironment: Environment | null,
    concurrency: number,
    duration: number
) {
    const vars = activeEnvironment?.variables || [];

    // 1. Resolve URL
    let resolvedUrl = replaceVariables(request.url, vars);

    // Append query parameters
    const qps = (request.queryParams as KeyValue[]) || [];
    const enabledQps = qps.filter(q => q.enabled && q.key);
    if (enabledQps.length > 0) {
        try {
            const urlObj = new URL(resolvedUrl);
            enabledQps.forEach(q => {
                const k = replaceVariables(q.key, vars);
                const v = replaceVariables(q.value, vars);
                urlObj.searchParams.append(k, v);
            });
            resolvedUrl = urlObj.toString();
        } catch {
            // URL parse failure fallback
        }
    }

    // 2. Resolve Custom Headers
    const headersObj: Record<string, string> = {};
    const reqHeaders = (request.headers as KeyValue[]) || [];
    reqHeaders.filter(h => h.enabled && h.key).forEach(h => {
        const k = replaceVariables(h.key, vars);
        const v = replaceVariables(h.value, vars);
        headersObj[k] = v;
    });

    // Add Auth header credentials
    const auth = request.auth;
    if (auth && auth.type !== 'none') {
        if (auth.type === 'bearer' && auth.bearer?.token) {
            const token = replaceVariables(auth.bearer.token, vars);
            headersObj['Authorization'] = `Bearer ${token}`;
        } else if (auth.type === 'basic' && auth.basic) {
            const u = replaceVariables(auth.basic.username, vars);
            const p = replaceVariables(auth.basic.password, vars);
            const credentials = Buffer.from(`${u}:${p}`).toString('base64');
            headersObj['Authorization'] = `Basic ${credentials}`;
        } else if (auth.type === 'apikey' && auth.apikey) {
            const k = replaceVariables(auth.apikey.key, vars);
            const v = replaceVariables(auth.apikey.value, vars);
            if (auth.apikey.addTo === 'header') {
                headersObj[k] = v;
            } else {
                try {
                    const urlObj = new URL(resolvedUrl);
                    urlObj.searchParams.append(k, v);
                    resolvedUrl = urlObj.toString();
                } catch {}
            }
        }
    }

    // 3. Resolve Request Body content
    let resolvedBody: string | null = null;
    const body = request.body;
    if (body && body.type !== 'none' && body.content) {
        if (body.type === 'json') {
            resolvedBody = typeof body.content === 'string'
                ? replaceVariables(body.content, vars)
                : replaceVariables(JSON.stringify(body.content), vars);
            if (!headersObj['Content-Type']) {
                headersObj['Content-Type'] = 'application/json';
            }
        } else if (body.type === 'raw' || body.type === 'form-data') {
            resolvedBody = replaceVariables(body.content, vars);
        }
    }

    return {
        url: resolvedUrl,
        method: request.method,
        headers: headersObj,
        body: resolvedBody,
        concurrency,
        duration
    };
}

/**
 * Custom line chart component rendered as standard SVG nodes
 */
function SVGLineChart({ data, color, label, height = 120 }: { data: number[]; color: string; label: string; height?: number }) {
    if (data.length === 0) {
        return (
            <div style={{ height }} className="flex items-center justify-center rounded-lg border border-gray-800 bg-gray-950/20 text-xs text-gray-500 font-medium">
                Waiting for metrics...
            </div>
        );
    }

    const maxVal = Math.max(...data, 10);
    const width = 500;
    const padding = 12;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Create polyline coordinate list
    const points = data.map((val, idx) => {
        const x = padding + (idx / Math.max(data.length - 1, 1)) * chartWidth;
        const y = height - padding - (val / maxVal) * chartHeight;
        return `${x},${y}`;
    }).join(' ');

    const firstX = padding;
    const lastX = padding + chartWidth;
    const bottomY = height - padding;
    const areaPoints = `${firstX},${bottomY} ${points} ${lastX},${bottomY}`;

    return (
        <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-4">
            <div className="mb-3 flex items-center justify-between text-xs font-semibold text-gray-400">
                <span>{label}</span>
                <span className="text-sm font-bold" style={{ color }}>{data[data.length - 1]}</span>
            </div>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
                <defs>
                    <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.0} />
                    </linearGradient>
                </defs>
                {/* Horizontal dotted gridlines */}
                <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#1f2937" strokeWidth="0.5" strokeDasharray="3,3" />
                <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#1f2937" strokeWidth="0.5" strokeDasharray="3,3" />
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#374151" strokeWidth="1" />

                {/* Shaded Area fill */}
                <polygon points={areaPoints} fill={`url(#grad-${color.replace('#', '')})`} />

                {/* Value Line */}
                <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                />
            </svg>
        </div>
    );
}

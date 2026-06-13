import { useState } from 'react';
import {
    Activity, ShieldAlert, ShieldCheck,
    ChevronDown, Info, Clock, Zap, Bell, BellOff,
    Radio, CheckCircle2, XCircle, RefreshCw, BookOpen
} from 'lucide-react';
import { Request } from '@/types';

interface Props {
    request: Request;
    onUpdate: (data: Partial<Request>) => void;
    isUpdating?: boolean;
}

const INTERVAL_OPTIONS = [
    { value: 15, label: 'Every 15 seconds', tag: 'Fastest' },
    { value: 30, label: 'Every 30 seconds', tag: '' },
    { value: 60, label: 'Every 1 minute', tag: 'Default' },
    { value: 300, label: 'Every 5 minutes', tag: '' },
    { value: 900, label: 'Every 15 minutes', tag: 'Battery Friendly' },
    { value: 1800, label: 'Every 30 minutes', tag: '' },
];

const HOW_TO_STEPS = [
    {
        icon: <CheckCircle2 className="h-4 w-4 text-orange-400" />,
        title: 'Enable the Monitor',
        desc: 'Toggle the switch in the header to activate background health checks for this endpoint.',
    },
    {
        icon: <Clock className="h-4 w-4 text-blue-400" />,
        title: 'Choose an Interval',
        desc: 'Pick how often APIFlow should ping this URL — from every 15 seconds to every 30 minutes.',
    },
    {
        icon: <RefreshCw className="h-4 w-4 text-purple-400" />,
        title: 'Save or Send the Request',
        desc: 'Hit Save (or Send). The monitor launches in the background even after the window is closed.',
    },
    {
        icon: <Bell className="h-4 w-4 text-emerald-400" />,
        title: 'Get Notified',
        desc: "When the endpoint goes down or recovers, you'll get an OS desktop notification from the System Tray.",
    },
];

export default function RequestMonitorSettings({ request, onUpdate, isUpdating = false }: Props) {
    const [showGuide, setShowGuide] = useState(false);

    const settings = request.monitorSettings ?? {
        isMonitored: false,
        interval: 60,
        lastStatus: 'unknown' as const,
    };

    const handleToggleMonitor = (enabled: boolean) => {
        onUpdate({
            monitorSettings: {
                ...settings,
                isMonitored: enabled,
                lastStatus: enabled ? settings.lastStatus : 'unknown',
            },
        });
    };

    const handleIntervalChange = (seconds: number) => {
        onUpdate({
            monitorSettings: { ...settings, interval: seconds },
        });
    };

    type StatusKey = 'healthy' | 'unhealthy' | 'unknown';
    const STATUS_MAP: Record<StatusKey, {
        label: string;
        icon: React.ReactNode;
        dotClass: string;
        cardClass: string;
        glowClass: string;
    }> = {
        healthy: {
            label: 'Healthy',
            icon: <ShieldCheck className="h-5 w-5 text-emerald-400" />,
            dotClass: 'bg-emerald-400 animate-pulse',
            cardClass: 'border-emerald-500/20 bg-emerald-500/5',
            glowClass: 'shadow-[0_0_24px_rgba(52,211,153,0.12)]',
        },
        unhealthy: {
            label: 'Unhealthy',
            icon: <ShieldAlert className="h-5 w-5 text-red-400" />,
            dotClass: 'bg-red-500 animate-ping',
            cardClass: 'border-red-500/20 bg-red-500/5',
            glowClass: 'shadow-[0_0_24px_rgba(239,68,68,0.12)]',
        },
        unknown: {
            label: 'Awaiting Check',
            icon: <Activity className="h-5 w-5 text-amber-400 animate-spin" />,
            dotClass: 'bg-amber-400',
            cardClass: 'border-amber-500/20 bg-amber-500/5',
            glowClass: '',
        },
    };

    const currentStatusKey = (settings.isMonitored ? (settings.lastStatus ?? 'unknown') : 'unknown') as StatusKey;
    const statusCfg = STATUS_MAP[currentStatusKey] ?? STATUS_MAP.unknown;
    const selectedInterval = INTERVAL_OPTIONS.find(o => o.value === settings.interval) ?? INTERVAL_OPTIONS[2];

    return (
        <div className="w-full space-y-5">

            {/* ═══════════════════════════════════════════════
                SECTION 1 — Control Header
            ═══════════════════════════════════════════════ */}
            <div className="rounded-xl border border-gray-800 bg-gray-900/60 backdrop-blur-sm overflow-hidden">

                {/* Top bar */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/80">
                    <div className="flex items-center gap-3">
                        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/20">
                            <Radio className="h-5 w-5 text-orange-400" />
                            {settings.isMonitored && (
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                                </span>
                            )}
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-gray-100 leading-none">Background Health Monitor</h4>
                            <p className="text-[11px] text-gray-500 mt-1">
                                Periodically ping this endpoint — even when the window is closed to tray.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {isUpdating && (
                            <span className="flex items-center gap-1.5 text-[10px] text-orange-400 animate-pulse">
                                <RefreshCw className="h-3 w-3 animate-spin" /> Saving…
                            </span>
                        )}
                        {/* Status pill */}
                        {settings.isMonitored && (
                            <div className={`hidden sm:flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${statusCfg.cardClass}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotClass}`} />
                                {statusCfg.label}
                            </div>
                        )}
                        {/* Toggle */}
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.isMonitored}
                                onChange={(e) => handleToggleMonitor(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="
                                w-12 h-6 rounded-full transition-all duration-300
                                bg-gray-800 border border-gray-700
                                peer-checked:bg-orange-500 peer-checked:border-orange-500
                                peer-focus:ring-2 peer-focus:ring-orange-500/30
                                after:content-[''] after:absolute after:top-[3px] after:left-[3px]
                                after:bg-gray-400 after:rounded-full after:h-[18px] after:w-[18px]
                                after:transition-all after:duration-300 after:shadow
                                peer-checked:after:translate-x-6 peer-checked:after:bg-white
                            " />
                        </label>
                    </div>
                </div>

                {/* Config + live status row — only when active */}
                {settings.isMonitored && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-800/70">
                        {/* Interval */}
                        <div className="px-6 py-4">
                            <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2.5">
                                <Clock className="h-3 w-3" /> Check Interval
                            </label>
                            <div className="relative">
                                <select
                                    value={settings.interval}
                                    onChange={(e) => handleIntervalChange(Number(e.target.value))}
                                    className="w-full appearance-none rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 pr-8 text-xs text-gray-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-colors cursor-pointer"
                                >
                                    {INTERVAL_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}{o.tag ? ` — ${o.tag}` : ''}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 text-gray-500" />
                            </div>
                            <p className="mt-2 text-[10px] text-gray-600">Minimum effective: <span className="text-gray-400 font-mono">15s</span></p>
                        </div>

                        {/* Live status (large) */}
                        <div className="px-6 py-4 flex flex-col justify-center">
                            <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2.5">
                                <Zap className="h-3 w-3" /> Live Status
                            </label>
                            <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${statusCfg.cardClass} ${statusCfg.glowClass}`}>
                                <span className={`relative flex h-3 w-3`}>
                                    <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${currentStatusKey === 'healthy' ? 'animate-ping bg-emerald-400' :
                                        currentStatusKey === 'unhealthy' ? 'animate-ping bg-red-500' : ''
                                        }`}></span>
                                    <span className={`relative inline-flex h-3 w-3 rounded-full ${currentStatusKey === 'healthy' ? 'bg-emerald-400' :
                                        currentStatusKey === 'unhealthy' ? 'bg-red-500' : 'bg-amber-400'
                                        }`}></span>
                                </span>
                                {statusCfg.icon}
                                <span className="font-semibold text-sm text-gray-100">{statusCfg.label}</span>
                            </div>
                        </div>

                        {/* Next check */}
                        <div className="px-6 py-4 flex flex-col justify-center">
                            <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2.5">
                                <RefreshCw className="h-3 w-3" /> Schedule
                            </label>
                            <p className="text-sm text-gray-300 font-medium">{selectedInterval.label}</p>
                            <p className="text-[11px] text-gray-600 mt-1">
                                Next check: <span className="text-gray-400">~{selectedInterval.label.replace('Every ', '')}</span>
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════════
                SECTION 2 — Telemetry (post first ping)
            ═══════════════════════════════════════════════ */}
            {settings.isMonitored && settings.lastChecked && (
                <div className={`rounded-xl border p-5 ${statusCfg.cardClass} ${statusCfg.glowClass}`}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-1.5">
                        <Activity className="h-3 w-3" /> Last Check Telemetry
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* Result */}
                        <div className="rounded-lg bg-gray-950/70 border border-gray-800/60 px-4 py-3">
                            <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1.5">Result</p>
                            <div className="flex items-center gap-1.5">
                                {currentStatusKey === 'healthy'
                                    ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                    : <XCircle className="h-4 w-4 text-red-400" />
                                }
                                <span className="text-sm font-semibold text-gray-100">{statusCfg.label}</span>
                            </div>
                        </div>

                        {/* Last pinged */}
                        <div className="rounded-lg bg-gray-950/70 border border-gray-800/60 px-4 py-3">
                            <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1.5">Last Pinged</p>
                            <span className="text-sm font-mono text-gray-100">
                                {new Date(settings.lastChecked).toLocaleTimeString()}
                            </span>
                        </div>

                        {/* Latency */}
                        <div className="rounded-lg bg-gray-950/70 border border-gray-800/60 px-4 py-3">
                            <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1.5">Latency</p>
                            {settings.lastResponseTime !== undefined ? (
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-lg font-bold font-mono ${settings.lastResponseTime < 300 ? 'text-emerald-400' :
                                        settings.lastResponseTime < 1000 ? 'text-amber-400' : 'text-red-400'
                                        }`}>
                                        {settings.lastResponseTime}
                                    </span>
                                    <span className="text-xs text-gray-500">ms</span>
                                </div>
                            ) : (
                                <span className="text-sm text-gray-600">—</span>
                            )}
                        </div>

                        {/* Speed grade */}
                        <div className="rounded-lg bg-gray-950/70 border border-gray-800/60 px-4 py-3">
                            <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1.5">Speed Grade</p>
                            {settings.lastResponseTime !== undefined ? (
                                <span className={`text-sm font-bold ${settings.lastResponseTime < 300 ? 'text-emerald-400' :
                                    settings.lastResponseTime < 1000 ? 'text-amber-400' : 'text-red-400'
                                    }`}>
                                    {settings.lastResponseTime < 300 ? '⚡ Fast' :
                                        settings.lastResponseTime < 1000 ? '⚠ Moderate' : '🔴 Slow'}
                                </span>
                            ) : (
                                <span className="text-sm text-gray-600">—</span>
                            )}
                        </div>
                    </div>

                    {/* Latency scale bar */}
                    {settings.lastResponseTime !== undefined && (
                        <div className="mt-4">
                            <div className="flex justify-between text-[9px] text-gray-600 mb-1">
                                <span>0 ms</span>
                                <span>300 ms</span>
                                <span>1000 ms</span>
                                <span>2000 ms+</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-gray-800 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ${settings.lastResponseTime < 300 ? 'bg-emerald-400' :
                                        settings.lastResponseTime < 1000 ? 'bg-amber-400' : 'bg-red-500'
                                        }`}
                                    style={{ width: `${Math.min((settings.lastResponseTime / 2000) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════════
                SECTION 3 — Disabled placeholder
            ═══════════════════════════════════════════════ */}
            {!settings.isMonitored && (
                <div className="rounded-xl border border-dashed border-gray-800 bg-gray-900/20 p-6 flex flex-col items-center justify-center text-center gap-2">
                    <BellOff className="h-8 w-8 text-gray-700" />
                    <p className="text-sm font-medium text-gray-600">Monitor is disabled</p>
                    <p className="text-xs text-gray-700 max-w-sm">
                        Toggle the switch above to start background health checks. The monitor will run continuously even when APIFlow is closed.
                    </p>
                </div>
            )}

            {/* ═══════════════════════════════════════════════
                SECTION 4 — How to Use Guide
            ═══════════════════════════════════════════════ */}
            <div className="rounded-xl border border-gray-800/70 bg-gray-900/40 overflow-hidden">
                <button
                    onClick={() => setShowGuide(g => !g)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-800/30 transition-colors group"
                >
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-400 group-hover:text-gray-200 transition-colors">
                        <BookOpen className="h-4 w-4 text-orange-400" />
                        How to use the Health Monitor
                    </span>
                    <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform duration-200 ${showGuide ? 'rotate-180' : ''}`} />
                </button>

                {showGuide && (
                    <div className="border-t border-gray-800/60 px-6 pb-6">
                        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0">
                            {HOW_TO_STEPS.map((step, i) => (
                                <div key={i} className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-800/80 border border-gray-700/60 mt-0.5">
                                            {step.icon}
                                        </div>
                                        {i < HOW_TO_STEPS.length - 2 && (
                                            <div className="w-px flex-1 mt-1.5 min-h-[20px] bg-gradient-to-b from-gray-700 to-transparent" />
                                        )}
                                    </div>
                                    <div className="pb-5">
                                        <p className="text-xs font-semibold text-gray-200 leading-none mb-1">
                                            <span className="text-gray-600 mr-1.5 font-mono">0{i + 1}.</span>
                                            {step.title}
                                        </p>
                                        <p className="text-[11px] text-gray-500 leading-relaxed">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pro tip banner */}
                        <div className="mt-2 flex gap-3 rounded-xl bg-orange-500/8 border border-orange-500/15 p-4">
                            <Info className="h-4 w-4 text-orange-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs font-semibold text-orange-300 mb-1">Pro Tip</p>
                                <p className="text-[11px] text-gray-400 leading-relaxed">
                                    The health monitor works even when APIFlow is fully minimized to the System Tray.
                                    Look for the colored dot next to each request in the sidebar — <span className="text-emerald-400">●</span> healthy,{' '}
                                    <span className="text-red-400">●</span> unhealthy, <span className="text-amber-400">●</span> awaiting.
                                    The tray icon also shows a live count of healthy vs total monitored endpoints.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}

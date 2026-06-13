import { useEffect, useRef, useState } from 'react';
import {
    Radio, Lock, Wifi,
    Bell, MonitorSmartphone, TrendingUp, ShieldCheck,
    GitBranch, Database, Layers,
    KeyRound, Eye, EyeOff, Terminal, Cpu,
    QrCode, Share2, Download, Users,
    CheckCircle, ArrowRight
} from 'lucide-react';

/* ─── Sub-feature data per new feature ─── */
const HEALTH_MONITOR_POINTS = [
    { icon: MonitorSmartphone, label: 'System Tray Agent', desc: 'Runs silently in the background even when APIFlow is fully closed.' },
    { icon: Bell, label: 'OS Notifications', desc: 'Native desktop alerts when an endpoint goes down or recovers.' },
    { icon: TrendingUp, label: 'Latency Telemetry', desc: 'Color-coded response time: ⚡ Fast, ⚠ Moderate, 🔴 Slow.' },
    { icon: ShieldCheck, label: 'Auth-Aware Pings', desc: 'Bearer, Basic, and API key headers are sent on every ping.' },
    { icon: GitBranch, label: 'Env Variable Injection', desc: '{{BASE_URL}} and Vault secrets resolved before each ping.' },
    { icon: Database, label: 'Persistent State', desc: 'Health status saved to DB — survives app restarts.' },
    { icon: Layers, label: 'Per-Request Intervals', desc: 'Mix 15-second critical checks with 30-minute background sweeps.' },
    { icon: Cpu, label: 'Sidebar Status Dots', desc: '🟢 🔴 🟡 dots update live next to every request name.' },
];

const VAULT_POINTS = [
    { icon: KeyRound, label: 'OS Keychain Storage', desc: 'Secrets stored in native Keychain / Credential Manager — zero plaintext.' },
    { icon: EyeOff, label: 'Masked Display', desc: 'Vault values are always shown as •••••• in the UI.' },
    { icon: Terminal, label: '{{vault:KEY}} Syntax', desc: 'Reference secrets directly in any URL, header, or body field.' },
    { icon: ShieldCheck, label: 'Per-Workspace Isolation', desc: 'Each workspace has its own isolated vault namespace.' },
];

const LAN_POINTS = [
    { icon: QrCode, label: 'QR Code Sharing', desc: 'Scan the QR code on any device on the same Wi-Fi to import instantly.' },
    { icon: Share2, label: 'Zero Config', desc: 'No accounts, no cloud, no setup — just click Share and scan.' },
    { icon: Download, label: 'One-Tap Import', desc: 'The receiver opens APIFlow and hits Import — done in seconds.' },
    { icon: Users, label: 'Team-Friendly', desc: 'Share entire workspaces with collections, environments, and settings.' },
];

/* ─── Animated intersection hook ─── */
function useVisible() {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisible(true); },
            { threshold: 0.08 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);
    return { ref, visible };
}

/* ─── Sub-point card ─── */
function PointCard({ icon: Icon, label, desc, delay }: { icon: any; label: string; desc: string; delay: number }) {
    const { ref, visible } = useVisible();
    return (
        <div
            ref={ref}
            className={`flex gap-3 rounded-xl bg-white/[0.03] border border-white/[0.07] p-4 transition-all duration-500 hover:border-orange-500/20 hover:bg-white/[0.06] ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-800/80 border border-gray-700/50">
                <Icon className="h-3.5 w-3.5 text-orange-400" />
            </div>
            <div>
                <p className="text-xs font-semibold text-gray-200">{label}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}

/* ─── Feature block ─── */
interface FeatureBlockProps {
    badge: string;
    badgeColor: string;
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
    glowColor: string;
    title: string;
    subtitle: string;
    description: string;
    points: { icon: any; label: string; desc: string }[];
    pointsGrid?: string;
    ctaLabel?: string;
    visual: React.ReactNode;
    reverse?: boolean;
}

function FeatureBlock({
    badge, badgeColor, icon: Icon, iconColor, iconBg, glowColor,
    title, subtitle, description,
    points, pointsGrid = 'grid-cols-1 sm:grid-cols-2',
    visual, reverse = false
}: FeatureBlockProps) {
    const { ref, visible } = useVisible();
    return (
        <div
            ref={ref}
            className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center transition-all duration-700 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
        >
            {/* Text column */}
            <div className={reverse ? 'lg:order-2' : ''}>
                <div className="flex items-center gap-3 mb-5">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg} border border-white/10`}>
                        <Icon className={`h-5 w-5 ${iconColor}`} />
                    </div>
                    <span className={`rounded-full border px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider ${badgeColor}`}>
                        {badge}
                    </span>
                </div>

                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{subtitle}</p>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">{title}</h3>
                <p className="text-base text-gray-400 leading-relaxed mb-8">{description}</p>

                <div className={`grid ${pointsGrid} gap-3`}>
                    {points.map((p, i) => (
                        <PointCard key={p.label} icon={p.icon} label={p.label} desc={p.desc} delay={i * 60} />
                    ))}
                </div>
            </div>

            {/* Visual column */}
            <div className={`relative ${reverse ? 'lg:order-1' : ''}`}>
                <div className={`absolute inset-0 rounded-3xl blur-3xl opacity-20 ${glowColor}`} />
                <div className="relative">
                    {visual}
                </div>
            </div>
        </div>
    );
}

/* ─── Visuals ─── */
function HealthMonitorVisual() {
    const statuses = [
        { name: 'GET /api/users', method: 'GET', status: 'healthy', latency: 142, color: 'text-emerald-400', dot: 'bg-emerald-400 animate-pulse', bar: 'bg-emerald-400' },
        { name: 'POST /api/auth', method: 'POST', status: 'healthy', latency: 89, color: 'text-emerald-400', dot: 'bg-emerald-400 animate-pulse', bar: 'bg-emerald-400' },
        { name: 'GET /api/orders', method: 'GET', status: 'unhealthy', latency: 8203, color: 'text-red-400', dot: 'bg-red-500 animate-ping', bar: 'bg-red-500' },
        { name: 'GET /api/products', method: 'GET', status: 'healthy', latency: 201, color: 'text-emerald-400', dot: 'bg-emerald-400 animate-pulse', bar: 'bg-emerald-400' },
    ];
    return (
        <div className="glass rounded-2xl overflow-hidden border border-white/10">
            <div className="border-b border-white/10 px-4 py-3 flex items-center gap-2">
                <Radio className="h-4 w-4 text-orange-400 animate-pulse" />
                <span className="text-xs font-semibold text-gray-300">Health Monitor — Live Dashboard</span>
                <div className="ml-auto flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-emerald-400 font-medium">3 Healthy</span>
                    <span className="text-gray-600 mx-1">·</span>
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                    <span className="text-[10px] text-red-400 font-medium">1 Down</span>
                </div>
            </div>
            <div className="p-4 space-y-3">
                {statuses.map((s, i) => (
                    <div key={i} className="rounded-lg bg-gray-900/60 border border-white/5 px-3 py-2.5 flex items-center gap-3">
                        <span className={`relative flex h-2.5 w-2.5 shrink-0`}>
                            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${s.status === 'unhealthy' ? 'animate-ping bg-red-500' : ''}`} />
                            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${s.dot}`} />
                        </span>
                        <span className={`text-[10px] font-bold w-10 shrink-0 ${
                            s.method === 'GET' ? 'text-green-400' : 'text-yellow-400'
                        }`}>{s.method}</span>
                        <span className="text-xs text-gray-300 flex-1 font-mono truncate">{s.name}</span>
                        <div className="flex items-center gap-1.5">
                            <div className="w-16 h-1 rounded-full bg-gray-800">
                                <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${Math.min((s.latency / 2000) * 100, 100)}%` }} />
                            </div>
                            <span className={`text-[10px] font-mono font-bold w-14 text-right ${s.color}`}>
                                {s.latency > 1000 ? 'Timeout' : `${s.latency}ms`}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            {/* OS notification */}
            <div className="border-t border-white/5 px-4 py-3 bg-red-500/5">
                <div className="flex gap-2.5 items-center">
                    <Bell className="h-4 w-4 text-red-400 shrink-0" />
                    <div>
                        <p className="text-[11px] font-semibold text-red-300">🚨 API Alert: Failed</p>
                        <p className="text-[10px] text-gray-500">"GET /api/orders" went offline. Details: Timeout (exceeded 8s)</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function VaultVisual() {
    return (
        <div className="glass rounded-2xl overflow-hidden border border-white/10">
            <div className="border-b border-white/10 px-4 py-3 flex items-center gap-2">
                <Lock className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-semibold text-gray-300">Secure Variables Vault</span>
                <div className="ml-auto flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400">OS Keychain</span>
                </div>
            </div>
            <div className="p-4 space-y-3">
                {[
                    { key: 'STRIPE_SECRET_KEY', value: 'sk_live_••••••••••••••', type: 'vault' },
                    { key: 'API_TOKEN', value: 'eyJhbGciOi••••••••••', type: 'vault' },
                    { key: 'DB_PASSWORD', value: '••••••••••••', type: 'vault' },
                    { key: 'BASE_URL', value: 'https://api.production.com', type: 'env' },
                ].map((v, i) => (
                    <div key={i} className="rounded-lg bg-gray-900/60 border border-white/5 px-3 py-2.5 flex items-center gap-3">
                        {v.type === 'vault'
                            ? <Lock className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                            : <CheckCircle className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                        }
                        <span className="text-xs font-mono text-gray-300 w-40 shrink-0">{v.key}</span>
                        <span className="text-xs font-mono text-gray-500 flex-1 truncate">{v.value}</span>
                        <EyeOff className="h-3.5 w-3.5 text-gray-600 shrink-0" />
                    </div>
                ))}
            </div>
            <div className="border-t border-white/5 bg-purple-500/5 px-4 py-3">
                <p className="text-[11px] text-gray-400">
                    Reference in requests: <span className="font-mono text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded">{'{{vault:STRIPE_SECRET_KEY}}'}</span>
                </p>
            </div>
        </div>
    );
}

function LanVisual() {
    return (
        <div className="glass rounded-2xl overflow-hidden border border-white/10">
            <div className="border-b border-white/10 px-4 py-3 flex items-center gap-2">
                <Wifi className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-semibold text-gray-300">LAN Workspace Share</span>
                <span className="ml-auto text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">Server Active</span>
            </div>
            <div className="p-5 flex gap-6 items-center">
                {/* QR mock */}
                <div className="shrink-0 rounded-xl bg-white p-3 shadow-lg">
                    <div className="grid grid-cols-7 gap-0.5">
                        {Array.from({ length: 49 }).map((_, i) => {
                            const corners = [0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,41,42,43,44,45,46,47,48];
                            const inner = [8,9,10,15,16,17,22,23,24];
                            const isCorner = corners.includes(i);
                            const isInner = inner.includes(i);
                            const isRand = [25,26,30,31,32,36,37,38,39,40].includes(i);
                            return (
                                <div key={i} className={`h-2.5 w-2.5 rounded-[1px] ${
                                    isCorner || isInner || isRand ? 'bg-gray-900' : 'bg-white'
                                }`} />
                            );
                        })}
                    </div>
                </div>
                <div className="flex-1 space-y-3">
                    <div>
                        <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Local Address</p>
                        <p className="text-sm font-mono text-cyan-300 bg-cyan-500/5 border border-cyan-500/15 rounded-lg px-3 py-1.5">192.168.1.42:4242</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Workspace</p>
                        <p className="text-sm text-gray-300 font-medium">My Dev Workspace</p>
                        <p className="text-[10px] text-gray-600">4 collections · 12 environments</p>
                    </div>
                </div>
            </div>
            <div className="border-t border-white/5 bg-cyan-500/5 px-4 py-3 flex items-center gap-2">
                <ArrowRight className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <p className="text-[11px] text-gray-400">Receiver scans → clicks <span className="text-cyan-300 font-medium">Import Workspace</span> → done in 3 seconds</p>
            </div>
        </div>
    );
}

/* ─── Main Section ─── */
export default function NewFeaturesShowcase() {
    return (
        <section id="new-features" className="relative py-28 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900/30 to-gray-950 pointer-events-none" />
            <div className="absolute left-0 top-1/4 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />
            <div className="absolute right-0 bottom-1/4 h-[600px] w-[600px] translate-x-1/2 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Section header */}
                <div className="text-center mb-24">
                    <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-sm text-orange-400 mb-5">
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
                        What's New in APIFlow
                    </span>
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-5">
                        Three Powerful <span className="gradient-text">New Features</span>
                    </h2>
                    <p className="max-w-2xl mx-auto text-lg text-gray-400">
                        Built to make API development faster, safer, and more collaborative — without leaving your desktop.
                    </p>
                </div>

                {/* Divider helper */}
                <div className="space-y-28">

                    {/* ── Feature 1: Health Monitor ── */}
                    <FeatureBlock
                        badge="New Feature"
                        badgeColor="border-orange-500/30 bg-orange-500/10 text-orange-400"
                        icon={Radio}
                        iconColor="text-orange-400"
                        iconBg="bg-orange-500/10"
                        glowColor="bg-orange-500"
                        title="Background API Health Monitor"
                        subtitle="Always-On Monitoring"
                        description="Automatically ping any endpoint on a schedule — from every 15 seconds to every 30 minutes. APIFlow keeps running checks in the System Tray even after you close the window, and fires native desktop alerts the moment something breaks."
                        points={HEALTH_MONITOR_POINTS}
                        pointsGrid="grid-cols-1 sm:grid-cols-2"
                        visual={<HealthMonitorVisual />}
                    />

                    {/* Separator */}
                    <div className="flex items-center gap-6">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent" />
                    </div>

                    {/* ── Feature 2: Secure Vault ── */}
                    <FeatureBlock
                        badge="New Feature"
                        badgeColor="border-purple-500/30 bg-purple-500/10 text-purple-400"
                        icon={Lock}
                        iconColor="text-purple-400"
                        iconBg="bg-purple-500/10"
                        glowColor="bg-purple-500"
                        title="Secure Variables Vault"
                        subtitle="OS-Level Secret Storage"
                        description="Stop putting API keys in plaintext environment files. APIFlow stores secrets in the native OS Keychain (Windows Credential Manager / macOS Keychain), then injects them into any request using the simple {{vault:KEY}} syntax."
                        points={VAULT_POINTS}
                        pointsGrid="grid-cols-1 sm:grid-cols-2"
                        visual={<VaultVisual />}
                        reverse
                    />

                    {/* Separator */}
                    <div className="flex items-center gap-6">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent" />
                    </div>

                    {/* ── Feature 3: LAN Share ── */}
                    <FeatureBlock
                        badge="New Feature"
                        badgeColor="border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                        icon={Wifi}
                        iconColor="text-cyan-400"
                        iconBg="bg-cyan-500/10"
                        glowColor="bg-cyan-500"
                        title="LAN Workspace Share"
                        subtitle="AirDrop-Style Sharing"
                        description="Share entire workspaces with teammates on the same Wi-Fi in seconds. No cloud account, no export files — just click Share, show the QR code, and your colleague imports everything instantly on their machine."
                        points={LAN_POINTS}
                        pointsGrid="grid-cols-1 sm:grid-cols-2"
                        visual={<LanVisual />}
                    />
                </div>
            </div>
        </section>
    );
}

import { useEffect, useRef, useState } from 'react';
import {
    Send, FolderOpen, Globe, History, Sparkles, Shield,
    Code2, Zap, Terminal, GitBranch, Play,
    Lock, Radio, Wifi, ChevronLeft, ChevronRight
} from 'lucide-react';

const FEATURES = [
    {
        icon: Radio,
        title: 'API Health Monitor',
        description: 'Background health checks with OS tray notifications. Monitor any endpoint even when the window is closed.',
        color: 'text-orange-400',
        bg: 'bg-orange-400/10',
        border: 'border-orange-400/20',
        highlight: true,
        badge: 'New',
    },
    {
        icon: Lock,
        title: 'Secure Variables Vault',
        description: 'Store secrets in the OS Keychain (not plaintext). Access them with {{vault:SECRET}} in any request.',
        color: 'text-purple-400',
        bg: 'bg-purple-400/10',
        border: 'border-purple-400/20',
        highlight: true,
        badge: 'New',
    },
    {
        icon: Wifi,
        title: 'LAN Workspace Share',
        description: 'Instantly share your workspace over local Wi-Fi via QR code. No account needed — AirDrop style.',
        color: 'text-cyan-400',
        bg: 'bg-cyan-400/10',
        border: 'border-cyan-400/20',
        highlight: true,
        badge: 'New',
    },
    {
        icon: GitBranch,
        title: 'Local-First Git Sync',
        description: 'Link workspaces to local folders, version-control your APIs with native Git — no cloud lock-in, ever.',
        color: 'text-emerald-400',
        bg: 'bg-emerald-400/10',
        border: 'border-emerald-400/20',
    },
    {
        icon: Send,
        title: 'HTTP Request Builder',
        description: 'Send GET, POST, PUT, DELETE, PATCH requests with full control over headers, params, body, and auth.',
        color: 'text-green-400',
        bg: 'bg-green-400/10',
        border: 'border-green-400/20',
    },
    {
        icon: FolderOpen,
        title: 'Collections & Workspaces',
        description: 'Organize your APIs into collections and workspaces. Import/export Postman collections seamlessly.',
        color: 'text-orange-400',
        bg: 'bg-orange-400/10',
        border: 'border-orange-400/20',
    },
    {
        icon: Globe,
        title: 'Environment Variables',
        description: 'Use {{variables}} across requests. Switch between dev, staging, and production environments instantly.',
        color: 'text-blue-400',
        bg: 'bg-blue-400/10',
        border: 'border-blue-400/20',
    },
    {
        icon: History,
        title: 'Request History',
        description: 'Every request is automatically saved. Browse, replay, and inspect past requests with full response details.',
        color: 'text-purple-400',
        bg: 'bg-purple-400/10',
        border: 'border-purple-400/20',
    },
    {
        icon: Sparkles,
        title: 'AI Assistant',
        description: 'Built-in Gemini AI to explain responses, fix errors, generate request bodies, and write test assertions.',
        color: 'text-yellow-400',
        bg: 'bg-yellow-400/10',
        border: 'border-yellow-400/20',
    },
    {
        icon: Terminal,
        title: 'Pre/Post Scripts',
        description: 'Write JavaScript scripts to run before requests or after responses. Automate workflows like Postman.',
        color: 'text-pink-400',
        bg: 'bg-pink-400/10',
        border: 'border-pink-400/20',
    },
    {
        icon: Play,
        title: 'Collection Runner',
        description: 'Run entire collections sequentially with configurable delays. View pass/fail results with response previews.',
        color: 'text-cyan-400',
        bg: 'bg-cyan-400/10',
        border: 'border-cyan-400/20',
    },
    {
        icon: Code2,
        title: 'Code Snippets',
        description: 'Generate code snippets in cURL, JavaScript, Python, and more for any request with one click.',
        color: 'text-indigo-400',
        bg: 'bg-indigo-400/10',
        border: 'border-indigo-400/20',
    },
    {
        icon: Shield,
        title: 'Auth Support',
        description: 'Bearer token, Basic auth, API Key — all auth types supported with a clean, intuitive editor.',
        color: 'text-red-400',
        bg: 'bg-red-400/10',
        border: 'border-red-400/20',
    },
    {
        icon: Zap,
        title: 'Lightning Fast',
        description: 'Built on Electron + React + Vite. Instant startup, smooth UI, and real-time response rendering.',
        color: 'text-orange-400',
        bg: 'bg-orange-400/10',
        border: 'border-orange-400/20',
    },
];

function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisible(true); },
            { threshold: 0.1 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    const Icon = feature.icon;

    return (
        <div
            ref={ref}
            className={`group glass rounded-2xl p-6 hover:border-orange-500/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-500/10 ${(feature as any).highlight ? 'ring-1 ring-emerald-500/30 border-emerald-500/20' : ''
                } ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: `${(index % 5) * 80}ms` }}
        >
            <div className="flex items-center gap-2 mb-4">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg} border ${feature.border} group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                {(feature as any).highlight && (
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 animate-pulse-slow">
                        New
                    </span>
                )}
            </div>
            <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
        </div>
    );
}

export default function Features() {
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 8;
    const totalPages = Math.ceil(FEATURES.length / itemsPerPage);

    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentFeatures = FEATURES.slice(startIndex, endIndex);

    const goToNextPage = () => {
        setCurrentPage((prev) => (prev + 1) % totalPages);
    };

    const goToPrevPage = () => {
        setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
    };

    const goToPage = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <section id="features" className="py-24 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900/50 to-gray-950 pointer-events-none" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <span className="inline-block rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1 text-sm text-orange-400 mb-4">
                        Everything You Need
                    </span>
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
                        Packed with <span className="gradient-text">Powerful Features</span>
                    </h2>
                    <p className="max-w-2xl mx-auto text-lg text-gray-400">
                        Everything a developer needs to test, debug, and document APIs — all in a beautiful desktop app.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                    {currentFeatures.map((f, i) => (
                        <FeatureCard key={f.title} feature={f} index={i} />
                    ))}
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-center gap-4">
                    <button
                        onClick={goToPrevPage}
                        className="group flex items-center justify-center h-10 w-10 rounded-xl bg-gray-800/60 border border-gray-700/60 text-gray-400 hover:bg-orange-500/10 hover:border-orange-500/30 hover:text-orange-400 transition-all duration-200 hover:scale-105"
                        aria-label="Previous page"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>

                    {/* Page indicators */}
                    <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }).map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => goToPage(idx)}
                                className={`h-2 rounded-full transition-all duration-300 ${idx === currentPage
                                        ? 'w-8 bg-orange-500'
                                        : 'w-2 bg-gray-700 hover:bg-gray-600'
                                    }`}
                                aria-label={`Go to page ${idx + 1}`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={goToNextPage}
                        className="group flex items-center justify-center h-10 w-10 rounded-xl bg-gray-800/60 border border-gray-700/60 text-gray-400 hover:bg-orange-500/10 hover:border-orange-500/30 hover:text-orange-400 transition-all duration-200 hover:scale-105"
                        aria-label="Next page"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>

                {/* Page counter */}
                <div className="text-center mt-4">
                    <span className="text-sm text-gray-500">
                        Page {currentPage + 1} of {totalPages}
                        <span className="mx-2">•</span>
                        Showing {startIndex + 1}-{Math.min(endIndex, FEATURES.length)} of {FEATURES.length} features
                    </span>
                </div>
            </div>
        </section>
    );
}

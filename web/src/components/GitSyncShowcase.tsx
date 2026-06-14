import { useEffect, useRef, useState } from 'react';
import {
    GitBranch, FolderSync, ShieldCheck, Users, ArrowRight,
    HardDrive, CloudOff, GitCommit, GitPullRequest, Workflow
} from 'lucide-react';

const ADVANTAGES = [
    {
        icon: HardDrive,
        title: 'Your Data, Your Disk',
        description: 'Collections and environments are saved as readable JSON files in any folder you choose.',
        color: 'text-emerald-400',
        bg: 'bg-emerald-400/10',
        border: 'border-emerald-400/20',
    },
    {
        icon: CloudOff,
        title: 'No Cloud Lock-in',
        description: 'No proprietary cloud. No forced accounts. Use any Git remote — GitHub, GitLab, Bitbucket, or self-hosted.',
        color: 'text-orange-400',
        bg: 'bg-orange-400/10',
        border: 'border-orange-400/20',
    },
    {
        icon: GitCommit,
        title: 'Full Version History',
        description: 'Every change is a Git commit. Roll back requests, diff API specs, and track exactly what changed and when.',
        color: 'text-blue-400',
        bg: 'bg-blue-400/10',
        border: 'border-blue-400/20',
    },
    {
        icon: Users,
        title: 'Team Collaboration',
        description: 'Share API workspaces through Git branches and pull requests — the workflow developers already know.',
        color: 'text-purple-400',
        bg: 'bg-purple-400/10',
        border: 'border-purple-400/20',
    },
];

const COMPARISON = [
    { feature: 'Storage location', postman: 'Postman Cloud (required)', ours: 'Your local filesystem' },
    { feature: 'Version control', postman: 'Paid teams only', ours: 'Native Git (free)' },
    { feature: 'Offline access', postman: 'Limited', ours: 'Full offline support' },
    { feature: 'Vendor lock-in', postman: 'Yes', ours: 'Zero — use any Git remote' },
    { feature: 'Branch & merge', postman: 'Not available', ours: 'Full Git workflow' },
    { feature: 'Team sharing', postman: 'Requires paid account', ours: 'Via any Git provider' },
];

const WORKFLOW_STEPS = [
    { step: '1', label: 'Link Folder', description: 'Choose any local directory', icon: FolderSync },
    { step: '2', label: 'Auto-Export', description: 'Collections sync to JSON', icon: Workflow },
    { step: '3', label: 'Git Commit', description: 'Version every change', icon: GitCommit },
    { step: '4', label: 'Push & Share', description: 'Collaborate via Git', icon: GitPullRequest },
];

function AdvantageCard({ item, index }: { item: typeof ADVANTAGES[0]; index: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisible(true); },
            { threshold: 0.15 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    const Icon = item.icon;

    return (
        <div
            ref={ref}
            className={`glass rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: `${index * 120}ms` }}
        >
            <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${item.bg} border ${item.border} mb-4`}>
                <Icon className={`h-6 w-6 ${item.color}`} />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">{item.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
        </div>
    );
}

export default function GitSyncShowcase() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const [sectionVisible, setSectionVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setSectionVisible(true); },
            { threshold: 0.05 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <section id="git-sync" ref={sectionRef} className="py-24 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-emerald-950/10 to-gray-950 pointer-events-none" />
            <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Section header */}
                <div className={`text-center mb-16 transition-all duration-1000 ${sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400 mb-5">
                        <GitBranch className="h-3.5 w-3.5" />
                        What Makes Us Different
                    </span>
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-5">
                        Local-First <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">Git Syncing</span>
                    </h2>
                    <p className="max-w-3xl mx-auto text-lg sm:text-xl text-gray-400 leading-relaxed">
                        Your API collections are <strong className="text-gray-200">yours</strong>. Export them as plain JSON files, version-control with Git, 
                        and collaborate through the workflow you already know — no proprietary cloud required.
                    </p>
                </div>

                {/* Workflow pipeline — visual horizontal flow */}
                <div className={`mb-20 transition-all duration-1000 delay-200 ${sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-0">
                        {WORKFLOW_STEPS.map((ws, i) => {
                            const Icon = ws.icon;
                            return (
                                <div key={ws.step} className="flex items-center">
                                    <div className="flex flex-col items-center text-center w-40">
                                        <div className="relative mb-3">
                                            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group hover:scale-110 transition-transform">
                                                <Icon className="h-7 w-7 text-emerald-400" />
                                            </div>
                                            <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                                {ws.step}
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-semibold text-white mb-1">{ws.label}</h4>
                                        <p className="text-xs text-gray-500">{ws.description}</p>
                                    </div>
                                    {i < WORKFLOW_STEPS.length - 1 && (
                                        <ArrowRight className="h-5 w-5 text-emerald-500/40 mx-2 shrink-0 hidden sm:block" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Advantage cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
                    {ADVANTAGES.map((item, i) => (
                        <AdvantageCard key={item.title} item={item} index={i} />
                    ))}
                </div>

                {/* Interactive mock of the Git panel */}
                <div className={`mb-20 transition-all duration-1000 delay-300 ${sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="max-w-4xl mx-auto">
                        <div className="rounded-2xl border border-gray-800 bg-gray-900/80 backdrop-blur-sm shadow-2xl overflow-hidden" style={{ boxShadow: '0 0 60px rgba(16, 185, 129, 0.08)' }}>
                            {/* Titlebar */}
                            <div className="flex items-center gap-2 px-4 py-3 bg-gray-950 border-b border-gray-800">
                                <div className="h-3 w-3 rounded-full bg-red-500" />
                                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                                <div className="h-3 w-3 rounded-full bg-green-500" />
                                <div className="flex-1 mx-4 rounded bg-gray-800 h-5 text-xs text-gray-500 flex items-center px-3 gap-1.5">
                                    <GitBranch className="h-3 w-3 text-emerald-400" />
                                    Git Repository Sync
                                </div>
                            </div>

                            <div className="flex h-72">
                                {/* Left panel */}
                                <div className="w-60 border-r border-gray-800 p-4 bg-gray-950 space-y-4 hidden sm:flex flex-col">
                                    {/* Directory */}
                                    <div>
                                        <div className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-1">Local Directory</div>
                                        <div className="text-[11px] font-mono text-gray-400 bg-gray-900 rounded px-2 py-1.5 border border-gray-800 break-all">
                                            ~/projects/my-api
                                        </div>
                                        <div className="flex gap-1.5 mt-2">
                                            <div className="flex-1 h-6 rounded bg-gray-800 text-[10px] text-gray-400 flex items-center justify-center">Save to Disk</div>
                                            <div className="flex-1 h-6 rounded bg-gray-800 text-[10px] text-gray-400 flex items-center justify-center">Load from Disk</div>
                                        </div>
                                    </div>
                                    {/* Git Status */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-600">Repository</div>
                                            <span className="flex items-center gap-1 text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                                                <ShieldCheck className="h-2.5 w-2.5" /> Active
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[11px] text-gray-400">
                                            <GitBranch className="h-3 w-3 text-orange-400" /> Branch: <span className="text-white font-semibold">main</span>
                                        </div>
                                        <div className="text-[10px] text-gray-500 mt-1 break-all">origin: github.com/team/api-tests</div>
                                    </div>
                                    {/* Actions */}
                                    <div className="flex gap-1.5">
                                        <div className="flex-1 h-7 rounded-lg border border-gray-800 bg-gray-900 text-[10px] text-gray-400 flex items-center justify-center gap-1">
                                            ↓ Pull
                                        </div>
                                        <div className="flex-1 h-7 rounded-lg border border-gray-800 bg-gray-900 text-[10px] text-gray-400 flex items-center justify-center gap-1">
                                            ↑ Push
                                        </div>
                                    </div>
                                </div>

                                {/* Right panel */}
                                <div className="flex-1 p-4 flex flex-col space-y-3">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Changes (3)</div>
                                    <div className="flex-1 border border-gray-800 rounded-lg bg-gray-950 p-2.5 space-y-1.5 overflow-hidden">
                                        {/* Mock file entries */}
                                        {[
                                            { status: 'M', name: 'collections/Auth API.json', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
                                            { status: 'A', name: 'collections/Payment Flow.json', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                                            { status: '??', name: 'environments/Production.json', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                                        ].map((f, i) => (
                                            <div key={i} className="flex items-center justify-between rounded p-1.5 border border-transparent hover:border-gray-800 hover:bg-gray-900 text-xs">
                                                <span className="font-mono text-[11px] text-gray-300 truncate flex-1 pr-3">{f.name}</span>
                                                <span className={`px-2 py-0.5 text-[10px] font-medium border rounded-full ${f.color}`}>
                                                    {f.status === '??' ? 'New' : f.status === 'A' ? 'Added' : 'Modified'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Commit area */}
                                    <div className="border border-gray-800 rounded-lg p-2.5 bg-gray-950 flex gap-2 items-center">
                                        <div className="flex-1 h-7 rounded border border-gray-800 bg-gray-900 px-2.5 text-[11px] text-gray-500 flex items-center">
                                            Add payment flow endpoints...
                                        </div>
                                        <div className="h-7 px-3 rounded bg-orange-500 text-[11px] text-white font-semibold flex items-center shrink-0">
                                            Commit
                                        </div>
                                    </div>

                                    {/* Log area */}
                                    <div className="border border-gray-800 rounded-lg bg-gray-950 p-2 flex-1 min-h-0 overflow-hidden">
                                        <div className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-1.5 flex items-center gap-1">
                                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Execution Logs
                                        </div>
                                        <div className="space-y-0.5 font-mono text-[9px] text-gray-500">
                                            <div>[10:24:01] Syncing workspace to disk...</div>
                                            <div>[10:24:02] Wrote 3 collections, 2 environments</div>
                                            <div className="text-emerald-400">[10:24:02] ✓ Files exported successfully</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Glow */}
                        <div className="mx-auto w-3/4 h-8 bg-emerald-500/10 blur-2xl rounded-full -mt-4" />
                    </div>
                </div>

                {/* Comparison table */}
                <div className={`max-w-3xl mx-auto transition-all duration-1000 delay-400 ${sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8">
                        Why <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">Go Local</span>?
                    </h3>
                    <div className="glass rounded-2xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="py-4 px-6 text-left text-gray-400 font-medium">Feature</th>
                                    <th className="py-4 px-6 text-center text-gray-500 font-medium">Postman</th>
                                    <th className="py-4 px-6 text-center font-semibold">
                                        <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">DataCourier</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {COMPARISON.map((row, i) => (
                                    <tr key={row.feature} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/[0.02]' : ''} hover:bg-white/[0.04] transition-colors`}>
                                        <td className="py-3.5 px-6 text-gray-300 font-medium">{row.feature}</td>
                                        <td className="py-3.5 px-6 text-center text-gray-500 text-xs">{row.postman}</td>
                                        <td className="py-3.5 px-6 text-center text-emerald-400 text-xs font-semibold">{row.ours}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    );
}

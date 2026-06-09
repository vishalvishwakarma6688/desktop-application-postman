import { Link } from 'react-router-dom';
import { Bug, ExternalLink, FileText, Github, ShieldCheck } from 'lucide-react';

const REPOSITORY_URL = 'https://github.com/vishalvishwakarma6688/desktop-application-postman';
const ISSUES_URL = `${REPOSITORY_URL}/issues`;

const TRUST_POINTS = [
    {
        icon: Github,
        title: 'Open-source and reviewable',
        description: 'Inspect the application source, dependencies, and build configuration before installing.',
        color: 'text-orange-400',
        bg: 'bg-orange-400/10',
        border: 'border-orange-400/20',
    },
    {
        icon: ShieldCheck,
        title: 'Official release downloads',
        description: 'Installers are linked directly from the project’s official GitHub release page.',
        color: 'text-green-400',
        bg: 'bg-green-400/10',
        border: 'border-green-400/20',
    },
    {
        icon: FileText,
        title: 'Documented data practices',
        description: 'Our privacy policy explains what information is collected, why it is used, and how it is handled.',
        color: 'text-blue-400',
        bg: 'bg-blue-400/10',
        border: 'border-blue-400/20',
    },
    {
        icon: Bug,
        title: 'Public issue tracking',
        description: 'Review known issues, report problems, and follow fixes through the public issue tracker.',
        color: 'text-purple-400',
        bg: 'bg-purple-400/10',
        border: 'border-purple-400/20',
    },
];

export default function SecurityPrivacy() {
    return (
        <section id="security" className="relative overflow-hidden py-24">
            <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900/40 to-gray-950 pointer-events-none" />
            <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-14">
                    <span className="inline-block rounded-full border border-green-400/30 bg-green-400/10 px-4 py-1 text-sm text-green-400 mb-4">
                        Built with Transparency
                    </span>
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
                        Security &amp; <span className="gradient-text">Privacy</span>
                    </h2>
                    <p className="max-w-3xl mx-auto text-lg text-gray-400 leading-relaxed">
                        Trust should be earned through clear information and verifiable sources. Review how
                        APIFlow is built, downloaded, and maintained before you install it.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {TRUST_POINTS.map(point => {
                        const Icon = point.icon;
                        return (
                            <article
                                key={point.title}
                                className="glass rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/10"
                            >
                                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl border ${point.bg} ${point.border} mb-4`}>
                                    <Icon className={`h-6 w-6 ${point.color}`} aria-hidden="true" />
                                </div>
                                <h3 className="text-base font-semibold text-white mb-2">{point.title}</h3>
                                <p className="text-sm leading-relaxed text-gray-400">{point.description}</p>
                            </article>
                        );
                    })}
                </div>

                <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <a
                        href={REPOSITORY_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition-all hover:scale-105 hover:bg-orange-600"
                    >
                        <Github className="h-4 w-4" aria-hidden="true" />
                        Review the source code
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                    <Link
                        to="/privacy"
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800/50 px-5 py-3 text-sm font-semibold text-gray-300 transition-all hover:border-orange-500/30 hover:bg-gray-800 hover:text-white"
                    >
                        <FileText className="h-4 w-4" aria-hidden="true" />
                        Read our privacy policy
                    </Link>
                    <a
                        href={ISSUES_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800/50 px-5 py-3 text-sm font-semibold text-gray-300 transition-all hover:border-orange-500/30 hover:bg-gray-800 hover:text-white"
                    >
                        <Bug className="h-4 w-4" aria-hidden="true" />
                        View known issues
                    </a>
                </div>
            </div>
        </section>
    );
}

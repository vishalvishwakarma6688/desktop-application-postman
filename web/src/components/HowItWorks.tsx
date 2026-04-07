import { useEffect, useRef, useState } from 'react';
import { Download, FolderOpen, Send, CheckCircle } from 'lucide-react';

const STEPS = [
    {
        icon: Download,
        title: 'Download & Install',
        description: 'Get the desktop app for Windows or Linux. No signup required, completely free.',
        color: 'text-orange-400',
        bg: 'bg-orange-400/10',
        border: 'border-orange-400/20',
    },
    {
        icon: FolderOpen,
        title: 'Create Collections',
        description: 'Organize your APIs into workspaces and collections. Import existing Postman collections.',
        color: 'text-blue-400',
        bg: 'bg-blue-400/10',
        border: 'border-blue-400/20',
    },
    {
        icon: Send,
        title: 'Send Requests',
        description: 'Configure and send HTTP requests with headers, params, body, and auth. Use environment variables.',
        color: 'text-green-400',
        bg: 'bg-green-400/10',
        border: 'border-green-400/20',
    },
    {
        icon: CheckCircle,
        title: 'Test & Debug',
        description: 'View responses, check history, use AI assistant, and generate code snippets instantly.',
        color: 'text-purple-400',
        bg: 'bg-purple-400/10',
        border: 'border-purple-400/20',
    },
];

function StepCard({ step, index }: { step: typeof STEPS[0]; index: number }) {
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

    const Icon = step.icon;

    return (
        <div
            ref={ref}
            className={`relative transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: `${index * 150}ms` }}
        >
            {/* Connector line */}
            {index < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-orange-500/50 to-transparent" />
            )}

            <div className="relative glass rounded-2xl p-8 hover:border-orange-500/30 transition-all hover:-translate-y-2">
                {/* Step number */}
                <div className="absolute -top-4 -left-4 h-10 w-10 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-lg shadow-lg">
                    {index + 1}
                </div>

                <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl ${step.bg} border ${step.border} mb-6`}>
                    <Icon className={`h-8 w-8 ${step.color}`} />
                </div>

                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed">{step.description}</p>
            </div>
        </div>
    );
}

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900/30 to-gray-950 pointer-events-none" />

            {/* Decorative elements */}
            <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <span className="inline-block rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1 text-sm text-orange-400 mb-4">
                        Simple Process
                    </span>
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
                        Get Started in <span className="gradient-text">4 Easy Steps</span>
                    </h2>
                    <p className="max-w-2xl mx-auto text-lg text-gray-400">
                        From download to testing your first API in minutes. No complex setup, no learning curve.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
                    {STEPS.map((step, i) => (
                        <StepCard key={step.title} step={step} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}

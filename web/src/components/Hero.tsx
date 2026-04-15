import { useEffect, useState } from 'react';
import { ArrowDown, Star, Download } from 'lucide-react';
import DownloadButton from './DownloadButton';

const TYPED_WORDS = ['APIs', 'Endpoints', 'Requests', 'Responses'];

export default function Hero() {
    const [wordIdx, setWordIdx] = useState(0);
    const [displayed, setDisplayed] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(true);
    }, []);

    useEffect(() => {
        const word = TYPED_WORDS[wordIdx];
        let timeout: ReturnType<typeof setTimeout>;

        if (!deleting && displayed.length < word.length) {
            timeout = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 100);
        } else if (!deleting && displayed.length === word.length) {
            timeout = setTimeout(() => setDeleting(true), 1800);
        } else if (deleting && displayed.length > 0) {
            timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 60);
        } else if (deleting && displayed.length === 0) {
            setDeleting(false);
            setWordIdx(i => (i + 1) % TYPED_WORDS.length);
        }
        return () => clearTimeout(timeout);
    }, [displayed, deleting, wordIdx]);

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-24">
            {/* Background effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-orange-600/5 rounded-full blur-3xl pointer-events-none" />

            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: 'linear-gradient(rgba(249,115,22,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.5) 1px, transparent 1px)',
                backgroundSize: '60px 60px'
            }} />

            <div className={`relative z-10 w-full max-w-[1400px] mt-24 mx-auto px-4 sm:px-6 lg:px-8 text-center transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

                {/* Badge */}
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-sm text-orange-400 mb-8 animate-pulse-slow">
                    <Star className="h-3.5 w-3.5 fill-orange-400" />
                    Free & Open Source Desktop App
                </div>

                {/* Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-tight mb-6">
                    {/* Desktop layout - single line */}
                    <div className="hidden sm:flex flex-col items-center gap-2">
                        <div className="flex items-center justify-center gap-x-3 sm:gap-x-4">
                            <span>Test & Debug Your</span>
                            <span className="gradient-text inline-block min-w-[180px] sm:min-w-[240px] lg:min-w-[300px] text-left">
                                {displayed}<span className="animate-pulse">|</span>
                            </span>
                        </div>
                        <div className="text-gray-300">Like a Pro</div>
                    </div>

                    {/* Mobile layout - typing text in middle */}
                    <div className="flex sm:hidden flex-col items-center gap-2">
                        <div>Test & Debug</div>
                        <div>Your <span className="gradient-text">{displayed}<span className="animate-pulse">|</span></span></div>
                        <div className="text-gray-300">Like a Pro</div>
                    </div>
                </h1>

                <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-400 mb-10 leading-relaxed">
                    A powerful, beautiful Postman-like desktop app built for developers.
                    Send requests, manage collections, use environments, and explore APIs — all in one place.
                </p>

                {/* CTA buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                    <DownloadButton size="lg" />
                    <a
                        href="https://github.com/vishalvishwakarma6688/desktop-application-postman"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800/50 px-6 py-3.5 text-base font-semibold text-gray-300 hover:bg-gray-700 hover:text-white transition-all hover:scale-105"
                    >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                        View on GitHub
                    </a>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap items-center justify-center gap-8 mb-16">
                    {[
                        { value: '100%', label: 'Free Forever' },
                        { value: '2', label: 'Platforms' },
                        { value: '∞', label: 'API Requests' },
                    ].map(s => (
                        <div key={s.label} className="text-center">
                            <div className="text-3xl font-extrabold gradient-text">{s.value}</div>
                            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* App preview mockup */}
                <div className="relative max-w-5xl mx-auto animate-float">
                    <div className="rounded-2xl border border-gray-700/50 bg-gray-900/80 backdrop-blur-sm shadow-2xl overflow-hidden glow-orange">
                        {/* Fake titlebar */}
                        <div className="flex items-center gap-2 px-4 py-3 bg-gray-950 border-b border-gray-800">
                            <div className="h-3 w-3 rounded-full bg-red-500" />
                            <div className="h-3 w-3 rounded-full bg-yellow-500" />
                            <div className="h-3 w-3 rounded-full bg-green-500" />
                            <div className="flex-1 mx-4 rounded bg-gray-800 h-5 text-xs text-gray-500 flex items-center px-3">
                                Postman Like — API Testing
                            </div>
                        </div>
                        {/* Fake app UI */}
                        <div className="flex h-64 sm:h-80">
                            {/* Sidebar */}
                            <div className="w-48 bg-gray-800/50 border-r border-gray-700/50 p-3 space-y-2 hidden sm:block">
                                <div className="h-6 rounded bg-gray-700/50 w-3/4" />
                                <div className="h-4 rounded bg-orange-500/20 w-full" />
                                <div className="h-4 rounded bg-gray-700/30 w-5/6" />
                                <div className="h-4 rounded bg-gray-700/30 w-4/6" />
                                <div className="mt-4 h-4 rounded bg-gray-700/50 w-3/4" />
                                <div className="h-4 rounded bg-gray-700/30 w-full" />
                                <div className="h-4 rounded bg-gray-700/30 w-5/6" />
                            </div>
                            {/* Main */}
                            <div className="flex-1 p-4 space-y-3">
                                <div className="flex gap-2">
                                    <div className="h-8 w-20 rounded bg-green-500/20 border border-green-500/30 flex items-center justify-center text-xs text-green-400 font-bold">GET</div>
                                    <div className="flex-1 h-8 rounded bg-gray-800 border border-gray-700" />
                                    <div className="h-8 w-16 rounded bg-orange-500 flex items-center justify-center text-xs text-white font-bold">Send</div>
                                </div>
                                <div className="flex gap-2">
                                    {['Params', 'Headers', 'Body', 'Auth'].map(t => (
                                        <div key={t} className={`h-6 px-3 rounded text-xs flex items-center ${t === 'Params' ? 'bg-orange-500/20 text-orange-400' : 'text-gray-500'}`}>{t}</div>
                                    ))}
                                </div>
                                <div className="rounded bg-gray-800/50 border border-gray-700/50 p-3 space-y-1.5 flex-1">
                                    <div className="h-3 rounded bg-green-400/30 w-1/3" />
                                    <div className="h-3 rounded bg-blue-400/30 w-1/2" />
                                    <div className="h-3 rounded bg-yellow-400/30 w-2/5" />
                                    <div className="h-3 rounded bg-gray-700/50 w-3/4" />
                                    <div className="h-3 rounded bg-gray-700/50 w-1/2" />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Glow under */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-orange-500/20 blur-2xl rounded-full" />
                </div>

                {/* Scroll indicator */}
                <div className="mt-20 flex justify-center animate-bounce">
                    <a href="#features" className="text-gray-600 hover:text-orange-400 transition-colors">
                        <ArrowDown className="h-6 w-6" />
                    </a>
                </div>
            </div>
        </section>
    );
}

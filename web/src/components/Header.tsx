import { useState, useEffect } from 'react';
import { Menu, X, Zap } from 'lucide-react';

const NAV = [
    { label: 'Features', href: '#features' },
    { label: 'How it Works', href: '#how-it-works' },
    { label: 'Download', href: '#download' },
];

export default function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-gray-950/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <a href="#" className="flex items-center gap-2.5 group">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white font-bold text-sm group-hover:bg-orange-400 transition-colors glow-orange">
                            A
                        </div>
                        <span className="font-bold text-lg text-white">API<span className="gradient-text">Flow</span></span>
                    </a>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        {NAV.map(n => (
                            <a key={n.href} href={n.href} className="text-sm text-gray-400 hover:text-orange-400 transition-colors font-medium">
                                {n.label}
                            </a>
                        ))}
                    </nav>

                    {/* CTA */}
                    <div className="hidden md:flex items-center gap-5">
                        <a
                            href="https://github.com/vishalvishwakarma6688/desktop-application-postman"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                            GitHub
                        </a>
                        <a
                            href="#download"
                            className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-all hover:scale-105 glow-orange"
                        >
                            <Zap className="h-4 w-4" />
                            Download Free
                        </a>
                    </div>

                    {/* Mobile menu button */}
                    <button onClick={() => setMenuOpen(v => !v)} className="md:hidden rounded p-2 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
                        {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {menuOpen && (
                <div className="md:hidden bg-gray-900/95 backdrop-blur-md">
                    <div className="px-4 py-4 space-y-3">
                        {NAV.map(n => (
                            <a key={n.href} href={n.href} onClick={() => setMenuOpen(false)} className="block text-sm text-gray-300 hover:text-orange-400 transition-colors py-1">
                                {n.label}
                            </a>
                        ))}
                        <a href="#download" onClick={() => setMenuOpen(false)} className="block w-full text-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors mt-2">
                            Download Free
                        </a>
                    </div>
                </div>
            )}
        </header>
    );
}

import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Mail, Heart } from 'lucide-react';

const FOOTER_LINKS = {
    Product: [
        { label: 'Features', href: '#features', external: false },
        { label: 'How it Works', href: '#how-it-works', external: false },
        { label: 'Download', href: '#download', external: false },
    ],
    Resources: [
        { label: 'Documentation', href: '/documentation', external: false },
        { label: 'GitHub', href: 'https://github.com/vishalvishwakarma6688/desktop-application-postman', external: true },
        { label: 'Issues', href: 'https://github.com/vishalvishwakarma6688/desktop-application-postman/issues', external: true },
    ],
    Legal: [
        { label: 'Privacy Policy', href: '/privacy', external: false },
        { label: 'Terms of Service', href: '/terms', external: false },
        { label: 'License', href: '/license', external: false },
    ],
};

const SOCIAL_LINKS = [
    { icon: Github, href: 'https://github.com/vishalvishwakarma6688/desktop-application-postman', label: 'GitHub' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Mail, href: 'mailto:contact@postmanlike.dev', label: 'Email' },
];

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative border-t border-gray-800 bg-gray-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Main footer content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
                    {/* Brand column */}
                    <div className="lg:col-span-2">
                        <a href="#" className="flex items-center gap-2.5 group mb-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white font-bold text-sm group-hover:bg-orange-400 transition-colors">
                                A
                            </div>
                            <span className="font-bold text-lg text-white">
                                API<span className="gradient-text">Flow</span>
                            </span>
                        </a>
                        <p className="text-gray-400 text-sm mb-4 max-w-xs">
                            A powerful, free, and open-source desktop API testing tool for developers. Test, debug, and explore APIs with ease.
                        </p>
                        <div className="flex gap-3">
                            {SOCIAL_LINKS.map(social => {
                                const Icon = social.icon;
                                return (
                                    <a
                                        key={social.label}
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-9 w-9 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-orange-400 transition-all hover:scale-110"
                                        aria-label={social.label}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    {/* Links columns */}
                    {Object.entries(FOOTER_LINKS).map(([category, links]) => (
                        <div key={category}>
                            <h3 className="font-semibold text-white mb-4">{category}</h3>
                            <ul className="space-y-2">
                                {links.map(link => (
                                    <li key={link.label}>
                                        {link.external ? (
                                            <a
                                                href={link.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-gray-400 hover:text-orange-400 transition-colors"
                                            >
                                                {link.label}
                                            </a>
                                        ) : link.href.startsWith('#') ? (
                                            <a
                                                href={link.href}
                                                className="text-sm text-gray-400 hover:text-orange-400 transition-colors"
                                            >
                                                {link.label}
                                            </a>
                                        ) : (
                                            <Link
                                                to={link.href}
                                                className="text-sm text-gray-400 hover:text-orange-400 transition-colors"
                                            >
                                                {link.label}
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-gray-500 text-center md:text-left">
                        © {currentYear} APIFlow. All rights reserved.
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                        Made with <Heart className="h-4 w-4 text-red-500 fill-red-500" /> by developers, for developers
                    </p>
                </div>
            </div>

            {/* Decorative gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
        </footer>
    );
}

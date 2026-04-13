import { useEffect, useState } from 'react';
import { Monitor, Terminal, Apple, Download as DownloadIcon } from 'lucide-react';
import DownloadButton from './DownloadButton';

const PLATFORMS = [
    {
        os: 'windows' as const,
        icon: Monitor,
        name: 'Windows',
        description: 'Windows 10 or later',
        color: 'text-blue-400',
        bg: 'bg-blue-400/10',
        border: 'border-blue-400/20',
    },
    {
        os: 'linux' as const,
        icon: Terminal,
        name: 'Linux',
        description: 'Ubuntu, Debian, Fedora',
        color: 'text-orange-400',
        bg: 'bg-orange-400/10',
        border: 'border-orange-400/20',
    },
    {
        os: 'mac' as const,
        icon: Apple,
        name: 'macOS',
        description: 'Coming Soon',
        color: 'text-gray-400',
        bg: 'bg-gray-400/10',
        border: 'border-gray-400/20',
        disabled: true,
    },
];

export default function Download() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(true);
    }, []);

    return (
        <section id="download" className="py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900/50 to-gray-950 pointer-events-none" />

            {/* Glow effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="text-center mb-16">
                    <span className="inline-block rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1 text-sm text-orange-400 mb-4">
                        Ready to Start?
                    </span>
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
                        Download <span className="gradient-text">APIFlow</span>
                    </h2>
                    <p className="max-w-2xl mx-auto text-lg text-gray-400 mb-8">
                        Free forever. No signup required. Start testing APIs in seconds.
                    </p>
                </div>

                {/* Platform cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
                    {PLATFORMS.map((platform, i) => {
                        const Icon = platform.icon;
                        return (
                            <div
                                key={platform.os}
                                className={`glass rounded-2xl p-6 text-center transition-all duration-500 ${platform.disabled ? 'opacity-60' : 'hover:border-orange-500/30 hover:-translate-y-2'}`}
                                style={{ transitionDelay: `${i * 100}ms` }}
                            >
                                <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl ${platform.bg} border ${platform.border} mb-4`}>
                                    <Icon className={`h-8 w-8 ${platform.color}`} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{platform.name}</h3>
                                <p className="text-sm text-gray-400 mb-6">{platform.description}</p>
                                {platform.disabled ? (
                                    <button
                                        disabled
                                        className="w-full rounded-lg bg-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-400 cursor-not-allowed"
                                    >
                                        Coming Soon
                                    </button>
                                ) : (
                                    <DownloadButton os={platform.os} size="md" />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Linux Installation Commands */}
                <div className="glass rounded-2xl p-8 max-w-4xl mx-auto mb-12">
                    <div className="text-center mb-6">
                        <Terminal className="h-8 w-8 text-orange-400 mx-auto mb-3" />
                        <h3 className="text-2xl font-bold text-white mb-2">Linux Installation Commands</h3>
                        <p className="text-gray-400 text-sm">
                            For Ubuntu/Debian → use .deb  •  For other Linux → use AppImage
                        </p>
                    </div>

                    <div className="space-y-4">
                        {/* Ubuntu/Debian Command */}
                        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-orange-400">Ubuntu / Debian (.deb)</span>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText('wget -O postman-like.deb https://github.com/vishalvishwakarma6688/desktop-application-postman/releases/download/v1.2.5/Postman-Like-linux.deb && sudo dpkg -i postman-like.deb || sudo apt-get install -f -y');
                                    }}
                                    className="text-xs text-gray-400 hover:text-orange-400 transition-colors"
                                >
                                    Copy
                                </button>
                            </div>
                            <code className="text-xs text-gray-300 break-all block">
                                wget -O postman-like.deb https://github.com/vishalvishwakarma6688/desktop-application-postman/releases/download/v1.2.5/Postman-Like-linux.deb && sudo dpkg -i postman-like.deb || sudo apt-get install -f -y
                            </code>
                        </div>

                        {/* Universal Linux Command */}
                        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-blue-400">Universal Linux (AppImage)</span>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText('wget -O postman-like.AppImage https://github.com/vishalvishwakarma6688/desktop-application-postman/releases/download/v1.2.5/Postman-Like-linux.AppImage && chmod +x postman-like.AppImage && ./postman-like.AppImage');
                                    }}
                                    className="text-xs text-gray-400 hover:text-blue-400 transition-colors"
                                >
                                    Copy
                                </button>
                            </div>
                            <code className="text-xs text-gray-300 break-all block">
                                wget -O postman-like.AppImage https://github.com/vishalvishwakarma6688/desktop-application-postman/releases/download/v1.2.5/Postman-Like-linux.AppImage && chmod +x postman-like.AppImage && ./postman-like.AppImage
                            </code>
                        </div>
                    </div>
                </div>

                {/* Quick download CTA */}
                <div className="glass rounded-2xl p-8 max-w-2xl mx-auto text-center">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 mb-4">
                        <DownloadIcon className="h-6 w-6 text-orange-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Quick Download</h3>
                    <p className="text-gray-400 mb-6">
                        We'll automatically detect your operating system
                    </p>
                    <DownloadButton size="lg" />
                    <p className="text-xs text-gray-500 mt-4">
                        By downloading, you agree to our terms of service
                    </p>
                </div>

                {/* Features reminder */}
                <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                    {[
                        { label: '100% Free', value: '∞' },
                        { label: 'No Signup', value: '✓' },
                        { label: 'Open Source', value: '✓' },
                        { label: 'Cross Platform', value: '2+' },
                    ].map(item => (
                        <div key={item.label} className="text-center">
                            <div className="text-3xl font-bold gradient-text mb-1">{item.value}</div>
                            <div className="text-sm text-gray-500">{item.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

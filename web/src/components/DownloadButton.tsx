import { Download, Monitor, Terminal, Apple } from 'lucide-react';
import { useOS } from '@/hooks/useOS';
import { useLatestRelease } from '@/hooks/useLatestRelease';

const OS_ICONS = {
    windows: Monitor,
    linux: Terminal,
    mac: Apple,
    unknown: Download,
};

interface Props {
    size?: 'sm' | 'md' | 'lg';
    os?: 'windows' | 'linux' | 'mac';
}

export default function DownloadButton({ size = 'md', os: forcedOs }: Props) {
    const detectedOs = useOS();
    const { downloadLinks, loading } = useLatestRelease();

    const os = forcedOs || (detectedOs === 'unknown' ? 'windows' : detectedOs);
    const Icon = OS_ICONS[os as keyof typeof OS_ICONS] || Download;

    // Get the appropriate download URL based on OS
    const getDownloadUrl = () => {
        if (os === 'windows') return downloadLinks.windows;
        if (os === 'linux') return downloadLinks.linuxAppImage;
        if (os === 'mac') return 'https://github.com/vishalvishwakarma6688/desktop-application-postman/releases';
        return downloadLinks.windows;
    };

    const getLabel = () => {
        if (os === 'windows') return 'Download for Windows';
        if (os === 'linux') return 'Download for Linux';
        if (os === 'mac') return 'Download for macOS';
        return 'Download';
    };

    const downloadUrl = getDownloadUrl();
    const label = getLabel();

    const sizeClasses = {
        sm: 'px-4 py-2 text-sm gap-1.5',
        md: 'px-5 py-2.5 text-sm gap-2',
        lg: 'px-7 py-4 text-base gap-2.5',
    };

    if (loading) {
        return (
            <button
                disabled
                className={`inline-flex items-center rounded-xl bg-gray-700 font-semibold text-gray-400 cursor-wait ${sizeClasses[size]}`}
            >
                <Icon className={size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
                Loading...
            </button>
        );
    }

    if (!downloadUrl) {
        return (
            <button
                disabled
                className={`inline-flex items-center rounded-xl bg-gray-700 font-semibold text-gray-400 cursor-not-allowed ${sizeClasses[size]}`}
            >
                <Icon className={size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
                Not Available
            </button>
        );
    }

    return (
        <a
            href={downloadUrl}
            className={`inline-flex items-center rounded-xl bg-orange-500 font-semibold text-white hover:bg-orange-600 transition-all hover:scale-105 glow-orange ${sizeClasses[size]}`}
        >
            <Icon className={size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
            {label}
        </a>
    );
}

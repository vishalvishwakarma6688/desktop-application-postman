import { Download, Monitor, Terminal, Apple } from 'lucide-react';
import { useOS, DOWNLOADS } from '@/hooks/useOS';

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
    const os = forcedOs || (detectedOs === 'unknown' ? 'windows' : detectedOs);
    const dl = DOWNLOADS[os as keyof typeof DOWNLOADS] || DOWNLOADS.windows;
    const Icon = OS_ICONS[os as keyof typeof OS_ICONS] || Download;

    const sizeClasses = {
        sm: 'px-4 py-2 text-sm gap-1.5',
        md: 'px-5 py-2.5 text-sm gap-2',
        lg: 'px-7 py-4 text-base gap-2.5',
    };

    return (
        <a
            href={dl.url}
            className={`inline-flex items-center rounded-xl bg-orange-500 font-semibold text-white hover:bg-orange-600 transition-all hover:scale-105 glow-orange ${sizeClasses[size]}`}
        >
            <Icon className={size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
            {dl.label}
        </a>
    );
}

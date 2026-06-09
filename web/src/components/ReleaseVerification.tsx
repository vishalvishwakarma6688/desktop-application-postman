import { useState } from 'react';
import { CalendarDays, Check, Clipboard, ExternalLink, FileCheck2, Tag } from 'lucide-react';
import type { ReleaseDetails } from '@/hooks/useLatestRelease';

interface ReleaseVerificationProps {
    release: ReleaseDetails;
    loading: boolean;
}

const formatDate = (date: string | null) => {
    if (!date) return 'Available on GitHub';
    return new Intl.DateTimeFormat('en', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date));
};

const formatSize = (bytes?: number) => {
    if (!bytes) return null;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const isInstallerAsset = (name: string) => {
    const normalizedName = name.toLowerCase();
    return normalizedName.endsWith('.exe')
        || normalizedName.endsWith('.appimage')
        || normalizedName.endsWith('.deb');
};

export default function ReleaseVerification({ release, loading }: ReleaseVerificationProps) {
    const [copiedDigest, setCopiedDigest] = useState<string | null>(null);
    const assetsWithChecksums = release.assets.filter(asset => asset.digest && isInstallerAsset(asset.name));
    const checksumManifest = release.assets.find(asset => asset.name.toLowerCase() === 'sha256sums.txt');

    const copyChecksum = async (digest: string) => {
        await navigator.clipboard.writeText(digest);
        setCopiedDigest(digest);
        window.setTimeout(() => setCopiedDigest(null), 2000);
    };

    return (
        <div className="glass rounded-2xl p-6 sm:p-8 max-w-5xl mx-auto mb-12">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-orange-400">
                        <FileCheck2 className="h-5 w-5" aria-hidden="true" />
                        <span className="text-sm font-semibold uppercase tracking-wider">Release verification</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white">Know exactly what you are downloading</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400">
                        Release information is loaded directly from the official GitHub repository. Verify the
                        version and available checksum before running an installer.
                    </p>
                </div>

                <a
                    href={release.releaseNotesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-2.5 text-sm font-semibold text-orange-400 transition-colors hover:bg-orange-500/20 hover:text-orange-300"
                >
                    View release notes
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
            </div>

            <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-700/60 bg-gray-900/50 p-4">
                    <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                        <Tag className="h-4 w-4 text-orange-400" aria-hidden="true" />
                        Latest version
                    </dt>
                    <dd className="mt-2 font-semibold text-white">{loading ? 'Checking GitHub...' : release.version}</dd>
                </div>
                <div className="rounded-xl border border-gray-700/60 bg-gray-900/50 p-4">
                    <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                        <CalendarDays className="h-4 w-4 text-blue-400" aria-hidden="true" />
                        Release date
                    </dt>
                    <dd className="mt-2 font-semibold text-white">{loading ? 'Checking GitHub...' : formatDate(release.publishedAt)}</dd>
                </div>
            </dl>

            <div className="mt-5 rounded-xl border border-gray-700/60 bg-gray-900/50 p-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h4 className="text-sm font-semibold text-white">SHA-256 checksums</h4>
                        <p className="mt-1 text-xs text-gray-500">Use these values to verify downloaded files when provided.</p>
                    </div>
                    <span className="rounded-full border border-green-400/20 bg-green-400/10 px-2.5 py-1 text-xs font-medium text-green-400">
                        GitHub metadata
                    </span>
                </div>

                {assetsWithChecksums.length > 0 ? (
                    <div className="mt-4 space-y-3">
                        {assetsWithChecksums.map(asset => (
                            <div key={asset.name} className="rounded-lg border border-gray-700/50 bg-gray-950/60 p-3">
                                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-xs font-semibold text-gray-300">{asset.name}</span>
                                    {formatSize(asset.size) && <span className="text-xs text-gray-500">{formatSize(asset.size)}</span>}
                                </div>
                                <div className="flex items-start gap-2">
                                    <code className="min-w-0 flex-1 break-all text-xs text-gray-400">{asset.digest}</code>
                                    <button
                                        type="button"
                                        onClick={() => copyChecksum(asset.digest!)}
                                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-orange-400"
                                        aria-label={`Copy checksum for ${asset.name}`}
                                    >
                                        {copiedDigest === asset.digest
                                            ? <Check className="h-4 w-4 text-green-400" aria-hidden="true" />
                                            : <Clipboard className="h-4 w-4" aria-hidden="true" />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : checksumManifest ? (
                    <div className="mt-4 rounded-lg border border-green-400/20 bg-green-400/5 p-3">
                        <p className="text-xs leading-relaxed text-green-100/80">
                            SHA-256 checksums are published in the official release checksum manifest.
                        </p>
                        <a
                            href={checksumManifest.browser_download_url}
                            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-green-400 transition-colors hover:text-green-300"
                        >
                            Open SHA256SUMS.txt
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                    </div>
                ) : (
                    <p className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-xs leading-relaxed text-amber-100/80">
                        Checksums have not been published in the latest GitHub release metadata yet. You can
                        still confirm the version and download source on the official release page.
                    </p>
                )}
            </div>
        </div>
    );
}

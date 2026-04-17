import { useEffect, useState } from 'react';

export interface ReleaseAsset {
    name: string;
    browser_download_url: string;
}

export interface GitHubRelease {
    tag_name: string;
    assets: ReleaseAsset[];
}

export interface DownloadLinks {
    windows: string | null;
    linuxAppImage: string | null;
    linuxDeb: string | null;
    version: string;
}

const GITHUB_API_URL = 'https://api.github.com/repos/vishalvishwakarma6688/desktop-application-postman/releases/latest';

// Fallback URLs in case API fails
const FALLBACK_LINKS: DownloadLinks = {
    windows: 'https://github.com/vishalvishwakarma6688/desktop-application-postman/releases/download/v1.3.3/Postman-Like-win.exe',
    linuxAppImage: 'https://github.com/vishalvishwakarma6688/desktop-application-postman/releases/download/v1.3.3/Postman-Like-linux.AppImage',
    linuxDeb: 'https://github.com/vishalvishwakarma6688/desktop-application-postman/releases/download/v1.3.3/Postman-Like-linux.deb',
    version: 'v1.3.3',
};

const getDownloadLinks = (assets: ReleaseAsset[], version: string): DownloadLinks => {
    // Filter for the main Windows executable (not elevate.exe or other helper files)
    const windows = assets.find(a =>
        a.name.endsWith('.exe') &&
        !a.name.toLowerCase().includes('elevate') &&
        (a.name.includes('Postman-Like') || a.name.includes('postman-like'))
    );

    const linuxAppImage = assets.find(a => a.name.endsWith('.AppImage'));
    const linuxDeb = assets.find(a => a.name.endsWith('.deb'));

    return {
        windows: windows?.browser_download_url || null,
        linuxAppImage: linuxAppImage?.browser_download_url || null,
        linuxDeb: linuxDeb?.browser_download_url || null,
        version,
    };
};

export function useLatestRelease() {
    const [downloadLinks, setDownloadLinks] = useState<DownloadLinks>(FALLBACK_LINKS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLatestRelease = async () => {
            try {
                const response = await fetch(GITHUB_API_URL);

                if (!response.ok) {
                    throw new Error(`GitHub API error: ${response.status}`);
                }

                const data: GitHubRelease = await response.json();
                const links = getDownloadLinks(data.assets, data.tag_name);

                // Validate that we have at least some download links
                if (!links.windows && !links.linuxAppImage && !links.linuxDeb) {
                    throw new Error('No valid download links found in release');
                }

                setDownloadLinks(links);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch latest release:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
                // Keep fallback links on error
                setDownloadLinks(FALLBACK_LINKS);
            } finally {
                setLoading(false);
            }
        };

        fetchLatestRelease();
    }, []);

    return { downloadLinks, loading, error };
}

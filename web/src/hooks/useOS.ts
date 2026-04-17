export type OS = 'windows' | 'linux' | 'mac' | 'unknown';

export interface DownloadInfo {
    url: string;
    label: string;
    version: string;
    ext: string;
}

export function detectOS(): OS {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('win')) return 'windows';
    if (ua.includes('linux') && !ua.includes('android')) return 'linux';
    if (ua.includes('mac')) return 'mac';
    return 'unknown';
}

export function useOS(): OS {
    return detectOS();
}

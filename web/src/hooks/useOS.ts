export type OS = 'windows' | 'linux' | 'mac' | 'unknown';

export const DOWNLOADS = {
    windows: {
        url: 'https://github.com/vishalvishwakarma6688/desktop-application-postman/releases/download/v1.0.1/Postman.Like.Setup.1.0.0.exe',
        label: 'Download for Windows',
        version: 'v1.0.1 · Windows 10/11 · 64-bit',
        ext: '.exe',
    },
    linux: {
        url: 'https://github.com/vishalvishwakarma6688/desktop-application-postman/releases/download/v1.0.1/Postman.Like-1.0.0.AppImage',
        label: 'Download for Linux',
        version: 'v1.0.1 · AppImage · 64-bit',
        ext: '.AppImage',
    },
    mac: {
        url: 'https://github.com/vishalvishwakarma6688/desktop-application-postman/releases',
        label: 'Download for macOS',
        version: 'Coming soon',
        ext: '.dmg',
    },
};

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

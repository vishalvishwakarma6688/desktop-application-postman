import fs from 'fs';
import path from 'path';
import os from 'os';

const cacheDir = path.join(os.homedir(), 'AppData/Local/datacourier-electron-updater');

console.log('=== Auto-Updater Diagnostic & Cache Clear ===');
console.log(`Checking local cache path: ${cacheDir}`);

if (fs.existsSync(cacheDir)) {
    console.log('Cache directory found. Clearing update cache to force a fresh update check...');
    try {
        fs.rmSync(cacheDir, { recursive: true, force: true });
        console.log('✅ Successfully cleared the local update cache!');
    } catch (err) {
        console.error(`❌ Failed to delete cache directory: ${err.message}`);
    }
} else {
    console.log('No local update cache directory found. A fresh check will run automatically.');
}

const roamingDir = path.join(os.homedir(), 'AppData/Roaming/datacourier-electron');
const chromeCaches = [
    path.join(roamingDir, 'Cache'),
    path.join(roamingDir, 'Code Cache'),
    path.join(roamingDir, 'Network/Cache'),
    path.join(roamingDir, 'Network/Code Cache')
];

console.log('\n--- Clearing Chromium Network Caches ---');
chromeCaches.forEach(p => {
    if (fs.existsSync(p)) {
        console.log(`Clearing: ${p}`);
        try {
            fs.rmSync(p, { recursive: true, force: true });
            console.log(`✅ Successfully cleared: ${path.basename(p)}`);
        } catch (err) {
            console.warn(`⚠️ Could not clear ${path.basename(p)} (it may be locked if the app is still open): ${err.message}`);
        }
    }
});

console.log('\n--- Checking GitHub Releases Metadata ---');
const checkGitHub = async () => {
    try {
        const res = await fetch('https://api.github.com/repos/vishalvishwakarma6688/desktop-application-postman/releases/latest');
        if (!res.ok) {
            console.error(`GitHub API error: ${res.status} ${res.statusText}`);
            return;
        }
        const data = await res.json();
        console.log(`Latest Tag on GitHub: ${data.tag_name}`);
        console.log(`Release Name: ${data.name}`);
        console.log(`Published At: ${data.published_at}`);
        
        const assets = data.assets.map(a => a.name);
        console.log('Release Assets:', assets);
    } catch (err) {
        console.error(`Failed to fetch GitHub metadata: ${err.message}`);
    }
};

await checkGitHub();

import { Tray, Menu, nativeImage, BrowserWindow, app } from 'electron';

let tray: Tray | null = null;
let currentWindow: BrowserWindow | null = null;
let onSweepTriggered: (() => void) | null = null;

// Base64 16x16 PNG Dots
const ICONS = {
    orange: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAZElEQVQ4T2NkoBAwUqifAWpiYGBg+M+AroEvw/8ZCDPIyMDAwMiALs7wH0oTlmqGJgEkg/4zQDTCbEB/A0g2gBqGg/oGgDRR7wBSDEBnA0gxAFUegNoGkOoFMAayDqY96AGQCAD7DdkK679Y4gAAAABJRU5ErkJggg==',
    green: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAZ0lEQVQ4T2NkQAPyDAx/GVDETAwMDH8Z0DXwZfg/A2EGLwPCDDIyMDIgizz8h9KEGZqhCQDJIP8MEI2EGYC+BhBtADkMR/UNAGmi3gEkGIDMBpBiAKo8ALUNINULYAxkHUx70AMgEADAiMsKhE4u9gAAAABJRU5ErkJggg==',
    red: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAZklEQVQ4T2NkQAPyDAx/GVDETAwMDH8Z0DXwZfg/A2EGLwMCDDIyMDIgizz8h9KEGZqhCQDJIP8MEI2EGYC+BhBtADkMR/UNAGmi3gEkGIDMBpBiAKo8ALUNINULYAxkHUx70AMgEADA+M8KhD0c8wAAAABJRU5ErkJggg=='
};

function getNativeImage(color: keyof typeof ICONS) {
    return nativeImage.createFromDataURL(ICONS[color]);
}

export function setupTray(mainWindow: BrowserWindow, triggerSweep: () => void) {
    currentWindow = mainWindow;
    onSweepTriggered = triggerSweep;

    // Create the tray with default orange icon
    const img = getNativeImage('orange');
    tray = new Tray(img);
    tray.setToolTip('APIFlow Health Monitor');

    // Make tray double-click toggle the window
    tray.on('double-click', () => {
        toggleWindow();
    });

    updateTrayMenu(0, 0);
}

export function updateTrayStatus(healthyCount: number, totalCount: number) {
    if (!tray) return;

    let iconColor: keyof typeof ICONS = 'orange';
    let tooltip = 'APIFlow Health Monitor';

    if (totalCount > 0) {
        if (healthyCount === totalCount) {
            iconColor = 'green';
            tooltip = `APIFlow • All Healthy (${healthyCount}/${totalCount})`;
        } else {
            iconColor = 'red';
            tooltip = `APIFlow • ${totalCount - healthyCount} Failed (${healthyCount}/${totalCount})`;
        }
    }

    tray.setImage(getNativeImage(iconColor));
    tray.setToolTip(tooltip);
    updateTrayMenu(healthyCount, totalCount);
}

function updateTrayMenu(healthyCount: number, totalCount: number) {
    if (!tray) return;

    const statusText = totalCount === 0 
        ? 'No active monitors' 
        : `Status: ${healthyCount}/${totalCount} Healthy`;

    const contextMenu = Menu.buildFromTemplate([
        { 
            label: `APIFlow Health Check`, 
            enabled: false 
        },
        { 
            label: statusText, 
            enabled: false 
        },
        { type: 'separator' },
        { 
            label: 'Open APIFlow', 
            click: () => {
                if (currentWindow) {
                    currentWindow.show();
                    currentWindow.focus();
                }
            } 
        },
        { 
            label: 'Run Checks Now', 
            click: () => {
                if (onSweepTriggered) onSweepTriggered();
            } 
        },
        { type: 'separator' },
        { 
            label: 'Quit APIFlow', 
            click: () => {
                // Fully quit the app, bypassing Close-to-Tray logic
                (app as any).isQuitting = true;
                app.quit();
            } 
        }
    ]);

    tray.setContextMenu(contextMenu);
}

function toggleWindow() {
    if (!currentWindow) return;
    if (currentWindow.isVisible()) {
        currentWindow.hide();
    } else {
        currentWindow.show();
        currentWindow.focus();
    }
}

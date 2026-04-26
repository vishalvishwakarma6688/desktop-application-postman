import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Forward auto-updater logs from main process to DevTools console
const electronAPI = (window as any).electronAPI;
if (electronAPI?.receive) {
    electronAPI.receive('updater:log', (msg: string) => {
        console.log('%c' + msg, 'color: #f97316; font-weight: bold;');
    });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

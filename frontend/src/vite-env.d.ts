/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_BACKEND_URL: string
    // add more env variables as needed
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
interface Window {
    electronAPI: {
        send: (channel: string, data?: any) => void;
        receive: (channel: string, func: (...args: any[]) => void) => void;
        invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
}

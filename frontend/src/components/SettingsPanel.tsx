import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
    X, User, Globe, Shield, Info, Database, Plus, Trash2, 
    RefreshCw, Key
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRequestStore } from '@/store/useRequestStore';
import { historyApi } from '@/features/history/api';
import toast from 'react-hot-toast';

interface Props { onClose: () => void; }

type SettingsTab = 'general' | 'account' | 'headers' | 'proxy' | 'data' | 'about';

interface DefaultHeader {
    key: string;
    value: string;
    enabled: boolean;
}

export default function SettingsPanel({ onClose }: Props) {
    const queryClient = useQueryClient();
    const [tab, setTab] = useState<SettingsTab>('general');
    const { user } = useAuthStore();
    const { activeEnvironment } = useRequestStore();

    // Persisted settings via localStorage
    const [sslVerify, setSslVerify] = useState(() => localStorage.getItem('setting_ssl_verify') !== 'false');
    const [followRedirects, setFollowRedirects] = useState(() => localStorage.getItem('setting_follow_redirects') !== 'false');
    const [timeout, setTimeout_] = useState(() => parseInt(localStorage.getItem('setting_timeout') || '30000'));
    const [proxyEnabled, setProxyEnabled] = useState(() => localStorage.getItem('setting_proxy_enabled') === 'true');
    const [proxyUrl, setProxyUrl] = useState(() => localStorage.getItem('setting_proxy_url') || '');

    // Default Headers state
    const [defaultHeaders, setDefaultHeaders] = useState<DefaultHeader[]>(() => {
        try {
            const saved = localStorage.getItem('setting_default_headers');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // App Version state (dynamic fetch from Electron)
    const [version, setVersion] = useState('1.4.4');

    // History clear confirmation state
    const [confirmClearHistory, setConfirmClearHistory] = useState(false);

    useEffect(() => {
        const fetchVersion = async () => {
            const api = (window as any).electronAPI;
            if (api && typeof api.invoke === 'function') {
                try {
                    const ver = await api.invoke('app:getVersion');
                    if (ver) setVersion(ver);
                } catch (e) {
                    console.warn('[SETTINGS] Could not fetch version from main process:', e);
                }
            }
        };
        fetchVersion();
    }, []);

    // Save helper
    const save = (key: string, value: string) => localStorage.setItem(key, value);

    // Default Headers save helper
    const saveDefaultHeaders = (headers: DefaultHeader[]) => {
        setDefaultHeaders(headers);
        localStorage.setItem('setting_default_headers', JSON.stringify(headers));
    };

    const handleAddHeader = () => {
        saveDefaultHeaders([...defaultHeaders, { key: '', value: '', enabled: true }]);
    };

    const handleHeaderChange = (index: number, updates: Partial<DefaultHeader>) => {
        const updated = defaultHeaders.map((h, i) => {
            if (i === index) return { ...h, ...updates };
            return h;
        });
        saveDefaultHeaders(updated);
    };

    const handleHeaderDelete = (index: number) => {
        saveDefaultHeaders(defaultHeaders.filter((_, i) => i !== index));
    };

    // Reset settings helper
    const handleResetSettings = () => {
        setSslVerify(true);
        setFollowRedirects(true);
        setTimeout_(30000);
        setProxyEnabled(false);
        setProxyUrl('');
        saveDefaultHeaders([]);

        save('setting_ssl_verify', 'true');
        save('setting_follow_redirects', 'true');
        save('setting_timeout', '30000');
        save('setting_proxy_enabled', 'false');
        save('setting_proxy_url', '');

        toast.success('Settings reset to default configuration');
    };

    // Clear request history helper
    const handleClearHistory = async () => {
        if (!confirmClearHistory) {
            setConfirmClearHistory(true);
            // Auto reset confirmation state in 4 seconds
            setTimeout(() => setConfirmClearHistory(false), 4000);
            return;
        }

        try {
            await historyApi.clearAll();
            queryClient.invalidateQueries({ queryKey: ['history'] });
            toast.success('Request history cleared successfully');
            setConfirmClearHistory(false);
        } catch (err: any) {
            toast.error(err.message || 'Failed to clear history');
        }
    };

    const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
        { id: 'general', label: 'General', icon: <Globe className="h-4 w-4" /> },
        { id: 'account', label: 'Account', icon: <User className="h-4 w-4" /> },
        { id: 'headers', label: 'Default Headers', icon: <Key className="h-4 w-4" /> },
        { id: 'proxy', label: 'Proxy', icon: <Shield className="h-4 w-4" /> },
        { id: 'data', label: 'Data Management', icon: <Database className="h-4 w-4" /> },
        { id: 'about', label: 'About', icon: <Info className="h-4 w-4" /> },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            <div className="relative z-10 flex h-[520px] w-[750px] max-w-[95vw] max-h-[90vh] rounded-xl border border-gray-800 bg-gray-900 shadow-2xl overflow-hidden animate-fade-in text-gray-200">

                {/* Sidebar Navigation */}
                <div className="w-48 shrink-0 border-r border-gray-800 bg-gray-950/20 flex flex-col justify-between">
                    <div>
                        <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
                            <div className="h-6 w-6 rounded bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-xs">D</div>
                            <h2 className="text-xs font-bold text-white tracking-wide">Settings</h2>
                        </div>
                        <nav className="flex-1 py-2 px-2 space-y-0.5">
                            {TABS.map(t => {
                                const isActive = tab === t.id;
                                return (
                                    <button
                                        key={t.id}
                                        onClick={() => setTab(t.id)}
                                        className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                                            isActive 
                                                ? 'bg-gray-800 text-orange-400' 
                                                : 'text-gray-400 hover:bg-gray-800/40 hover:text-gray-200'
                                        }`}
                                    >
                                        <span className={isActive ? 'text-orange-400' : 'text-gray-500'}>{t.icon}</span>
                                        {t.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Bottom build tag */}
                    <div className="px-5 py-3 border-t border-gray-800 bg-gray-950/10 text-[10px] text-gray-500 flex items-center justify-between">
                        <span>Desktop Build</span>
                        <span className="font-mono bg-gray-800 px-1 rounded text-gray-400">v{version}</span>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
                        <h3 className="text-xs font-bold tracking-wider uppercase text-gray-300">{tab} Settings</h3>
                        <button onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Tab Body */}
                    <div className="flex-1 overflow-auto px-6 py-2">
                        
                        {/* GENERAL TAB */}
                        {tab === 'general' && (
                            <div className="divide-y divide-gray-800">
                                <SettingRow
                                    title="SSL Certificate Verification"
                                    description="Enforce security checks and verify SSL certificates when initiating HTTP requests. Disable this if you need to call local APIs with self-signed certificates."
                                >
                                    <Toggle
                                        value={sslVerify}
                                        onChange={(v) => { setSslVerify(v); save('setting_ssl_verify', String(v)); }}
                                    />
                                </SettingRow>

                                <SettingRow
                                    title="Follow HTTP Redirects"
                                    description="Automatically follow redirection responses (such as 301, 302, and 307 headers) sent from endpoints."
                                >
                                    <Toggle
                                        value={followRedirects}
                                        onChange={(v) => { setFollowRedirects(v); save('setting_follow_redirects', String(v)); }}
                                    />
                                </SettingRow>

                                <SettingRow
                                    title="Request Timeout (ms)"
                                    description="Define the maximum time limit (in milliseconds) the executor should wait for a remote server response before throwing a timeout error."
                                >
                                    <input
                                        type="number"
                                        value={timeout}
                                        min={1000}
                                        max={300000}
                                        step={1000}
                                        onChange={(e) => {
                                            const v = Math.max(1000, parseInt(e.target.value) || 30000);
                                            setTimeout_(v);
                                            save('setting_timeout', String(v));
                                        }}
                                        className="w-24 rounded border border-gray-750 bg-gray-950 px-2 py-1 text-xs text-gray-200 font-mono focus:border-orange-500 focus:outline-none focus:ring-0"
                                    />
                                </SettingRow>
                            </div>
                        )}

                        {/* ACCOUNT TAB */}
                        {tab === 'account' && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-4 py-4 border-b border-gray-800">
                                    <div className="flex h-12 w-12 items-center justify-center rounded bg-orange-500 text-lg font-bold text-white shrink-0">
                                        {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-white tracking-wide truncate">{user?.name}</p>
                                        <p className="text-[10px] text-gray-500 font-mono truncate">{user?.email}</p>
                                        <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] text-emerald-400 uppercase font-bold mt-1">Authenticated</span>
                                    </div>
                                </div>

                                <div className="divide-y divide-gray-800">
                                    <SettingRow title="Workspace Integration" description="Current environment scope. Substitution applies to all outgoing requests.">
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${activeEnvironment ? 'border-orange-500/30 bg-orange-500/10 text-orange-400' : 'border-gray-800 text-gray-500'}`}>
                                            {activeEnvironment?.name ? `Active Env: ${activeEnvironment.name}` : 'No Active Environment'}
                                        </span>
                                    </SettingRow>
                                </div>
                            </div>
                        )}

                        {/* DEFAULT HEADERS TAB */}
                        {tab === 'headers' && (
                            <div className="space-y-4 py-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] text-gray-500">Global headers appended to all requests unless overridden.</p>
                                    <button
                                        onClick={handleAddHeader}
                                        className="flex items-center gap-1 px-2.5 py-1 bg-orange-500 hover:bg-orange-600 transition-colors text-[10px] font-semibold text-white rounded"
                                    >
                                        <Plus className="h-3 w-3" /> Add Row
                                    </button>
                                </div>

                                <div className="border border-gray-800 rounded-lg overflow-hidden bg-gray-950/20">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-gray-950/60 border-b border-gray-855 text-gray-400 font-bold uppercase tracking-wider text-[9px]">
                                                <th className="py-2 px-3 w-10 text-center">Use</th>
                                                <th className="py-2 px-4 w-1/2">Header Key</th>
                                                <th className="py-2 px-4 w-1/2">Header Value</th>
                                                <th className="py-2 px-3 w-10 text-center"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {defaultHeaders.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="py-6 text-center text-xs text-gray-500 italic">
                                                        No default headers configured. Click "Add Row" to append one.
                                                    </td>
                                                </tr>
                                            ) : (
                                                defaultHeaders.map((h, i) => (
                                                    <tr key={i} className="border-b border-gray-800/80 last:border-0 hover:bg-white/[0.01]">
                                                        <td className="py-1.5 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={h.enabled}
                                                                onChange={(e) => handleHeaderChange(i, { enabled: e.target.checked })}
                                                                className="rounded border-gray-700 text-orange-500 bg-gray-800 focus:ring-0 cursor-pointer h-3 w-3"
                                                            />
                                                        </td>
                                                        <td className="py-1.5 px-2">
                                                            <input
                                                                type="text"
                                                                value={h.key}
                                                                onChange={(e) => handleHeaderChange(i, { key: e.target.value })}
                                                                placeholder="e.g. X-Request-Source"
                                                                className="w-full rounded border border-transparent bg-transparent hover:border-gray-800 focus:border-orange-500 focus:bg-gray-900/40 px-2 py-0.5 text-xs text-gray-200 focus:outline-none"
                                                            />
                                                        </td>
                                                        <td className="py-1.5 px-2">
                                                            <input
                                                                type="text"
                                                                value={h.value}
                                                                onChange={(e) => handleHeaderChange(i, { value: e.target.value })}
                                                                placeholder="e.g. DataCourierClient"
                                                                className="w-full rounded border border-transparent bg-transparent hover:border-gray-800 focus:border-orange-500 focus:bg-gray-900/40 px-2 py-0.5 text-xs text-gray-200 focus:outline-none"
                                                            />
                                                        </td>
                                                        <td className="py-1.5 text-center">
                                                            <button
                                                                onClick={() => handleHeaderDelete(i)}
                                                                className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-gray-800/40 transition-colors"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* PROXY TAB */}
                        {tab === 'proxy' && (
                            <div className="divide-y divide-gray-800">
                                <SettingRow title="Route via Proxy Server" description="Reroute all requests made from the application client through a dedicated HTTP or HTTPS proxy agent.">
                                    <Toggle
                                        value={proxyEnabled}
                                        onChange={(v) => { setProxyEnabled(v); save('setting_proxy_enabled', String(v)); }}
                                    />
                                </SettingRow>
                                
                                {proxyEnabled && (
                                    <div className="py-4 space-y-1.5 animate-slide-down">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Proxy URL Server Address</label>
                                        <input
                                            type="text"
                                            value={proxyUrl}
                                            onChange={(e) => { setProxyUrl(e.target.value); save('setting_proxy_url', e.target.value); }}
                                            placeholder="http://username:password@proxy.example.com:8080"
                                            className="w-full rounded border border-gray-700 bg-gray-950 px-3 py-1.5 text-xs text-gray-200 focus:border-orange-500 focus:outline-none font-mono"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* DATA MANAGEMENT TAB */}
                        {tab === 'data' && (
                            <div className="divide-y divide-gray-800">
                                <SettingRow
                                    title="Reset Application Settings"
                                    description="Restore all configuration variables (timeout, redirects, SSL verification, custom headers) back to default client settings."
                                >
                                    <button
                                        onClick={handleResetSettings}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-750 transition-colors text-xs font-semibold text-white rounded border border-gray-700"
                                    >
                                        <RefreshCw className="h-3 w-3" /> Reset Config
                                    </button>
                                </SettingRow>

                                <SettingRow
                                    title="Clear Saved Request History"
                                    description="Instantly wipe out all request history metrics and suggestions for your account from the database. Warning: This cannot be undone."
                                >
                                    <button
                                        onClick={handleClearHistory}
                                        className={`flex items-center gap-1 px-3 py-1.5 border rounded transition-all text-xs font-semibold ${
                                            confirmClearHistory 
                                                ? 'bg-red-650 hover:bg-red-700 text-white border-transparent' 
                                                : 'bg-red-950/20 hover:bg-red-955/40 text-red-400 border-red-900/30'
                                        }`}
                                    >
                                        <Trash2 className="h-3 w-3" /> 
                                        {confirmClearHistory ? 'Confirm' : 'Clear History'}
                                    </button>
                                </SettingRow>
                            </div>
                        )}

                        {/* ABOUT TAB */}
                        {tab === 'about' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 py-4 border-b border-gray-800">
                                    <div className="flex h-11 w-11 items-center justify-center rounded bg-orange-500/10 border border-orange-500/20 text-lg font-bold text-orange-500 shrink-0">
                                        DC
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-white tracking-wide">DataCourier Desktop</h4>
                                        <p className="text-[10px] text-gray-500 mt-0.5">Version {version}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 px-1 text-xs">
                                    <h5 className="font-bold text-gray-300 border-b border-gray-800 pb-1.5 text-[10px] uppercase tracking-wide">System Stack</h5>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-[10px] text-gray-500">
                                        <div className="flex justify-between py-1 border-b border-gray-950">
                                            <span>Runtime:</span>
                                            <span className="text-gray-400">Electron + Node</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-gray-950">
                                            <span>Framework:</span>
                                            <span className="text-gray-400">React + Vite</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-gray-950">
                                            <span>State Engine:</span>
                                            <span className="text-gray-400">Zustand</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-gray-950">
                                            <span>Database:</span>
                                            <span className="text-gray-400">Mongoose</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
}

function SettingRow({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-5 py-4 border-b border-gray-800 last:border-0">
            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-200 tracking-wide">{title}</p>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{description}</p>
            </div>
            <div className="shrink-0 mt-0.5">{children}</div>
        </div>
    );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!value)}
            className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out focus:outline-none ${value ? 'bg-orange-500' : 'bg-gray-700'}`}
        >
            <span 
                className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-250 ease-in-out ${value ? 'translate-x-4' : 'translate-x-0'}`} 
            />
        </button>
    );
}

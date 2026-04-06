import { useState } from 'react';
import { X, User, Globe, Shield, Info } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRequestStore } from '@/store/useRequestStore';

interface Props { onClose: () => void; }

type SettingsTab = 'general' | 'account' | 'proxy' | 'about';

export default function SettingsPanel({ onClose }: Props) {
    const [tab, setTab] = useState<SettingsTab>('general');
    const { user } = useAuthStore();
    const { activeEnvironment } = useRequestStore();

    // Persisted settings via localStorage
    const [sslVerify, setSslVerify] = useState(() => localStorage.getItem('setting_ssl_verify') !== 'false');
    const [followRedirects, setFollowRedirects] = useState(() => localStorage.getItem('setting_follow_redirects') !== 'false');
    const [timeout, setTimeout_] = useState(() => parseInt(localStorage.getItem('setting_timeout') || '30000'));
    const [proxyEnabled, setProxyEnabled] = useState(() => localStorage.getItem('setting_proxy_enabled') === 'true');
    const [proxyUrl, setProxyUrl] = useState(() => localStorage.getItem('setting_proxy_url') || '');

    const save = (key: string, value: string) => localStorage.setItem(key, value);

    const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
        { id: 'general', label: 'General', icon: <Globe className="h-4 w-4" /> },
        { id: 'account', label: 'Account', icon: <User className="h-4 w-4" /> },
        { id: 'proxy', label: 'Proxy', icon: <Shield className="h-4 w-4" /> },
        { id: 'about', label: 'About', icon: <Info className="h-4 w-4" /> },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative z-10 flex h-[500px] w-[720px] max-w-[95vw] max-h-[90vh] rounded-lg border border-gray-700 bg-gray-900 shadow-2xl overflow-hidden">

                {/* Sidebar */}
                <div className="w-44 shrink-0 border-r border-gray-700 bg-gray-800 flex flex-col">
                    <div className="px-4 py-4 border-b border-gray-700">
                        <h2 className="text-sm font-semibold text-gray-100">Settings</h2>
                    </div>
                    <nav className="flex-1 py-2">
                        {TABS.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`flex w-full items-center gap-2.5 px-4 py-2 text-sm transition-colors ${tab === t.id ? 'bg-gray-700 text-gray-100' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}
                            >
                                {t.icon}
                                {t.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 shrink-0">
                        <h3 className="text-sm font-semibold text-gray-100 capitalize">{tab}</h3>
                        <button onClick={onClose} className="rounded p-1 hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-auto p-5 space-y-5">
                        {tab === 'general' && (
                            <>
                                <SettingRow
                                    label="SSL Certificate Verification"
                                    description="Verify SSL certificates when making requests"
                                >
                                    <Toggle
                                        value={sslVerify}
                                        onChange={(v) => { setSslVerify(v); save('setting_ssl_verify', String(v)); }}
                                    />
                                </SettingRow>

                                <SettingRow
                                    label="Follow Redirects"
                                    description="Automatically follow HTTP redirects"
                                >
                                    <Toggle
                                        value={followRedirects}
                                        onChange={(v) => { setFollowRedirects(v); save('setting_follow_redirects', String(v)); }}
                                    />
                                </SettingRow>

                                <SettingRow
                                    label="Request Timeout (ms)"
                                    description="Maximum time to wait for a response"
                                >
                                    <input
                                        type="number"
                                        value={timeout}
                                        min={1000}
                                        max={300000}
                                        step={1000}
                                        onChange={(e) => {
                                            const v = parseInt(e.target.value) || 30000;
                                            setTimeout_(v);
                                            save('setting_timeout', String(v));
                                        }}
                                        className="w-28 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-100 focus:border-orange-500 focus:outline-none"
                                    />
                                </SettingRow>
                            </>
                        )}

                        {tab === 'account' && (
                            <>
                                <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-700 bg-gray-800">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-lg font-bold text-white shrink-0">
                                        {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-100">{user?.name}</p>
                                        <p className="text-xs text-gray-400">{user?.email}</p>
                                    </div>
                                </div>
                                <SettingRow label="Active Environment" description="Currently selected environment for variable substitution">
                                    <span className={`text-xs px-2 py-1 rounded border ${activeEnvironment ? 'border-orange-500/40 bg-orange-500/10 text-orange-400' : 'border-gray-700 text-gray-500'}`}>
                                        {activeEnvironment?.name || 'None'}
                                    </span>
                                </SettingRow>
                            </>
                        )}

                        {tab === 'proxy' && (
                            <>
                                <SettingRow label="Enable Proxy" description="Route requests through a proxy server">
                                    <Toggle
                                        value={proxyEnabled}
                                        onChange={(v) => { setProxyEnabled(v); save('setting_proxy_enabled', String(v)); }}
                                    />
                                </SettingRow>
                                {proxyEnabled && (
                                    <SettingRow label="Proxy URL" description="e.g. http://proxy.example.com:8080">
                                        <input
                                            type="text"
                                            value={proxyUrl}
                                            onChange={(e) => { setProxyUrl(e.target.value); save('setting_proxy_url', e.target.value); }}
                                            placeholder="http://proxy.example.com:8080"
                                            className="w-64 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-100 placeholder-gray-600 focus:border-orange-500 focus:outline-none"
                                        />
                                    </SettingRow>
                                )}
                            </>
                        )}

                        {tab === 'about' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500 text-xl font-bold text-white">P</div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-100">Postman Desktop</p>
                                        <p className="text-xs text-gray-500">Version 1.0.0</p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-xs text-gray-500">
                                    <p>Built with Electron + React + Node.js</p>
                                    <p>MongoDB · Express · Tailwind CSS</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SettingRow({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-800 last:border-0">
            <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            </div>
            <div className="shrink-0">{children}</div>
        </div>
    );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!value)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${value ? 'bg-orange-500' : 'bg-gray-600'}`}
        >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${value ? 'translate-x-4' : 'translate-x-1'}`} />
        </button>
    );
}

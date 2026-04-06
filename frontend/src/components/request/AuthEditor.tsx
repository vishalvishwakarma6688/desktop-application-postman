import { RequestAuth } from '@/types';

interface Props {
    auth: RequestAuth;
    onChange: (auth: RequestAuth) => void;
}

const AUTH_TYPES: RequestAuth['type'][] = ['none', 'bearer', 'basic', 'apikey'];

export default function AuthEditor({ auth, onChange }: Props) {
    const setType = (type: RequestAuth['type']) => onChange({ type });

    const inputCls = "w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:border-orange-500 focus:outline-none";
    const labelCls = "block text-xs font-medium text-gray-400 mb-1";

    return (
        <div className="space-y-4 pt-2">
            {/* Auth type selector */}
            <div className="flex items-center gap-1 flex-wrap">
                {AUTH_TYPES.map((t) => (
                    <button
                        key={t}
                        onClick={() => setType(t)}
                        className={`rounded px-3 py-1 text-xs font-medium capitalize transition-colors ${auth.type === t
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                            }`}
                    >
                        {t === 'apikey' ? 'API Key' : t === 'bearer' ? 'Bearer Token' : t}
                    </button>
                ))}
            </div>

            {/* None */}
            {auth.type === 'none' && (
                <p className="text-sm text-gray-500 py-4 text-center">
                    No authentication will be sent with this request
                </p>
            )}

            {/* Bearer */}
            {auth.type === 'bearer' && (
                <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4 space-y-3">
                    <div>
                        <label className={labelCls}>Token</label>
                        <input
                            type="text"
                            value={auth.bearer?.token || ''}
                            onChange={(e) => onChange({ ...auth, bearer: { token: e.target.value } })}
                            placeholder="Enter bearer token"
                            className={inputCls}
                        />
                    </div>
                    <p className="text-xs text-gray-600">
                        Token will be sent as: <span className="font-mono text-gray-500">Authorization: Bearer &lt;token&gt;</span>
                    </p>
                </div>
            )}

            {/* Basic */}
            {auth.type === 'basic' && (
                <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4 space-y-3">
                    <div>
                        <label className={labelCls}>Username</label>
                        <input
                            type="text"
                            value={auth.basic?.username || ''}
                            onChange={(e) => onChange({ ...auth, basic: { ...auth.basic, username: e.target.value, password: auth.basic?.password || '' } })}
                            placeholder="Enter username"
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Password</label>
                        <input
                            type="password"
                            value={auth.basic?.password || ''}
                            onChange={(e) => onChange({ ...auth, basic: { username: auth.basic?.username || '', password: e.target.value } })}
                            placeholder="Enter password"
                            className={inputCls}
                        />
                    </div>
                    <p className="text-xs text-gray-600">
                        Credentials will be Base64 encoded and sent as: <span className="font-mono text-gray-500">Authorization: Basic &lt;encoded&gt;</span>
                    </p>
                </div>
            )}

            {/* API Key */}
            {auth.type === 'apikey' && (
                <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4 space-y-3">
                    <div>
                        <label className={labelCls}>Key</label>
                        <input
                            type="text"
                            value={auth.apikey?.key || ''}
                            onChange={(e) => onChange({ ...auth, apikey: { ...auth.apikey, key: e.target.value, value: auth.apikey?.value || '', addTo: auth.apikey?.addTo || 'header' } })}
                            placeholder="e.g. X-API-Key"
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Value</label>
                        <input
                            type="text"
                            value={auth.apikey?.value || ''}
                            onChange={(e) => onChange({ ...auth, apikey: { ...auth.apikey, key: auth.apikey?.key || '', value: e.target.value, addTo: auth.apikey?.addTo || 'header' } })}
                            placeholder="Enter API key value"
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Add to</label>
                        <div className="flex gap-2">
                            {(['header', 'query'] as const).map((loc) => (
                                <button
                                    key={loc}
                                    onClick={() => onChange({ ...auth, apikey: { key: auth.apikey?.key || '', value: auth.apikey?.value || '', addTo: loc } })}
                                    className={`rounded px-3 py-1.5 text-xs font-medium capitalize transition-colors ${(auth.apikey?.addTo || 'header') === loc
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                        }`}
                                >
                                    {loc === 'header' ? 'Header' : 'Query Param'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

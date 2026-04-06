import { useState } from 'react';

interface Scripts {
    pre?: string;
    post?: string;
}

interface Props {
    scripts: Scripts;
    onChange: (scripts: Scripts) => void;
}

const PRE_SNIPPETS = [
    {
        label: 'Set variable',
        code: `// Set an environment variable\npm.environment.set("token", "my-value");`,
    },
    {
        label: 'Set Bearer token',
        code: `// Dynamically set Authorization header\npm.request.headers.add({ key: "Authorization", value: "Bearer " + pm.environment.get("token") });`,
    },
    {
        label: 'Log request URL',
        code: `console.log("Sending to:", pm.request.url);`,
    },
];

const POST_SNIPPETS = [
    {
        label: 'Status is 200',
        code: `pm.test("Status is 200", () => {\n  pm.response.to.have.status(200);\n});`,
    },
    {
        label: 'Response has JSON body',
        code: `pm.test("Response is JSON", () => {\n  pm.response.to.be.json;\n});`,
    },
    {
        label: 'Save response field',
        code: `const json = pm.response.json();\npm.environment.set("id", json.id);`,
    },
    {
        label: 'Response time < 500ms',
        code: `pm.test("Response time OK", () => {\n  pm.expect(pm.response.responseTime).to.be.below(500);\n});`,
    },
];

const TEXTAREA_CLASS =
    'h-44 w-full rounded border border-gray-700 bg-gray-800 p-3 font-mono text-sm text-gray-100 placeholder-gray-600 focus:border-orange-500 focus:outline-none resize-none';

export default function ScriptEditor({ scripts, onChange }: Props) {
    const [activeScript, setActiveScript] = useState<'pre' | 'post'>('pre');

    const currentValue = activeScript === 'pre' ? (scripts.pre || '') : (scripts.post || '');
    const snippets = activeScript === 'pre' ? PRE_SNIPPETS : POST_SNIPPETS;

    const handleChange = (value: string) => {
        onChange({ ...scripts, [activeScript]: value });
    };

    const insertSnippet = (code: string) => {
        const current = currentValue;
        const newVal = current ? current + '\n\n' + code : code;
        handleChange(newVal);
    };

    return (
        <div className="space-y-3 pt-2">
            {/* Sub-tab toggle */}
            <div className="flex items-center gap-1">
                {(['pre', 'post'] as const).map((s) => (
                    <button
                        key={s}
                        onClick={() => setActiveScript(s)}
                        className={`rounded px-3 py-1 text-xs font-medium transition-colors ${activeScript === s
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                            }`}
                    >
                        {s === 'pre' ? 'Pre-request' : 'Post-response'}
                    </button>
                ))}
                <span className="ml-auto text-xs text-gray-600">JavaScript</span>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-500">
                {activeScript === 'pre'
                    ? 'Runs before the request is sent. Use pm.* to set variables or modify the request.'
                    : 'Runs after the response is received. Use pm.test() to write assertions.'}
            </p>

            <div className="flex gap-3">
                {/* Editor */}
                <div className="flex-1">
                    <textarea
                        value={currentValue}
                        onChange={(e) => handleChange(e.target.value)}
                        placeholder={activeScript === 'pre'
                            ? '// Write pre-request script here\n// pm.environment.set("key", "value");'
                            : '// Write test assertions here\n// pm.test("Status is 200", () => {\n//   pm.response.to.have.status(200);\n// });'
                        }
                        spellCheck={false}
                        className={TEXTAREA_CLASS}
                    />
                    {currentValue && (
                        <button
                            onClick={() => handleChange('')}
                            className="mt-1 text-xs text-gray-600 hover:text-red-400 transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {/* Snippets panel */}
                <div className="w-44 shrink-0 space-y-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Snippets</p>
                    {snippets.map((s) => (
                        <button
                            key={s.label}
                            onClick={() => insertSnippet(s.code)}
                            className="w-full text-left rounded border border-gray-700 px-2.5 py-1.5 text-xs text-gray-400 hover:border-orange-500 hover:text-orange-400 transition-colors"
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* pm API reference */}
            <details className="group">
                <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-400 transition-colors select-none">
                    pm API reference
                </summary>
                <div className="mt-2 rounded border border-gray-800 bg-gray-800/50 p-3 font-mono text-xs text-gray-400 space-y-1">
                    <div><span className="text-orange-400">pm.environment.set</span>(key, value)</div>
                    <div><span className="text-orange-400">pm.environment.get</span>(key)</div>
                    <div><span className="text-orange-400">pm.response.status</span> — HTTP status code</div>
                    <div><span className="text-orange-400">pm.response.json</span>() — parsed body</div>
                    <div><span className="text-orange-400">pm.response.responseTime</span> — ms</div>
                    <div><span className="text-orange-400">pm.test</span>(name, fn) — assertion</div>
                    <div><span className="text-orange-400">pm.expect</span>(value) — chai assertion</div>
                </div>
            </details>
        </div>
    );
}

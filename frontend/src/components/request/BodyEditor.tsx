import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { RequestBody, KeyValue } from '@/types';
import KeyValueEditor from './KeyValueEditor';

interface Props {
    body: RequestBody;
    onChange: (body: RequestBody) => void;
}

const BODY_TYPES: RequestBody['type'][] = ['none', 'json', 'form-data', 'raw'];

export default function BodyEditor({ body, onChange }: Props) {
    const [rawLang, setRawLang] = useState<'text' | 'html' | 'xml'>('text');

    const jsonValue = typeof body.content === 'string' ? body.content : JSON.stringify(body.content, null, 2);

    const jsonError = useMemo(() => {
        if (body.type !== 'json' || !jsonValue.trim()) return null;
        try {
            JSON.parse(jsonValue);
            return null;
        } catch (e: any) {
            return e.message as string;
        }
    }, [body.type, jsonValue]);

    const formatJson = () => {
        try {
            const parsed = JSON.parse(jsonValue);
            setContent(JSON.stringify(parsed, null, 2));
            toast.success('JSON formatted');
        } catch {
            // invalid json, do nothing
        }
    };

    const setType = (type: RequestBody['type']) => {
        onChange({ type, content: type === 'form-data' ? [{ key: '', value: '', enabled: true }] : '' });
    };

    const setContent = (content: any) => onChange({ ...body, content });

    const formRows: KeyValue[] = Array.isArray(body.content)
        ? body.content
        : [{ key: '', value: '', enabled: true }];

    return (
        <div className="space-y-3 pt-2">
            {/* Type selector */}
            <div className="flex items-center gap-1 flex-wrap">
                {BODY_TYPES.map((t) => (
                    <button
                        key={t}
                        onClick={() => setType(t)}
                        className={`rounded px-3 py-1 text-xs font-medium capitalize transition-colors ${body.type === t
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                            }`}
                    >
                        {t}
                    </button>
                ))}

                {/* Raw sub-type */}
                {body.type === 'raw' && (
                    <div className="ml-auto flex items-center gap-1">
                        {(['text', 'html', 'xml'] as const).map((lang) => (
                            <button
                                key={lang}
                                onClick={() => setRawLang(lang)}
                                className={`rounded px-2 py-1 text-xs uppercase transition-colors ${rawLang === lang
                                    ? 'bg-gray-700 text-gray-100'
                                    : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                {lang}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Content area */}
            {body.type === 'none' && (
                <p className="text-sm text-gray-500 py-4 text-center">
                    This request does not have a body
                </p>
            )}

            {body.type === 'json' && (
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-mono">JSON</span>
                        <button
                            onClick={formatJson}
                            disabled={!!jsonError || !jsonValue.trim()}
                            className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            Format JSON
                        </button>
                    </div>
                    <textarea
                        value={jsonValue}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={'{\n  "key": "value"\n}'}
                        spellCheck={false}
                        className={`h-48 w-full rounded border bg-gray-800 p-3 font-mono text-sm placeholder-gray-600 focus:outline-none resize-none transition-colors ${jsonError
                            ? 'border-red-500 text-red-400 focus:border-red-400'
                            : 'border-gray-700 text-gray-100 focus:border-orange-500'
                            }`}
                    />
                    {jsonError && (
                        <p className="text-xs text-red-400 font-mono px-1">{jsonError}</p>
                    )}
                </div>
            )}

            {body.type === 'raw' && (
                <div className="relative">
                    <textarea
                        value={typeof body.content === 'string' ? body.content : ''}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={`Enter ${rawLang} content...`}
                        spellCheck={false}
                        className="h-48 w-full rounded border border-gray-700 bg-gray-800 p-3 font-mono text-sm text-gray-100 placeholder-gray-600 focus:border-orange-500 focus:outline-none resize-none"
                    />
                    <span className="absolute top-2 right-2 text-xs text-gray-600 font-mono uppercase">{rawLang}</span>
                </div>
            )}

            {body.type === 'form-data' && (
                <KeyValueEditor
                    rows={formRows}
                    onChange={(rows) => setContent(rows)}
                    placeholder="Field name"
                    showFileUpload={true}
                />
            )}
        </div>
    );
}

import { useRef, useState } from 'react';
import { Plus, Trash2, Paperclip, X } from 'lucide-react';
import { KeyValue } from '@/types';

interface Props {
    rows: KeyValue[];
    onChange: (rows: KeyValue[]) => void;
    placeholder?: string;
    showFileUpload?: boolean;
}

// Common header name suggestions
const HEADER_KEY_SUGGESTIONS = [
    'Accept', 'Accept-Encoding', 'Accept-Language', 'Authorization',
    'Cache-Control', 'Content-Type', 'Content-Length', 'Cookie',
    'Origin', 'Referer', 'User-Agent', 'X-API-Key', 'X-Auth-Token',
    'X-Requested-With', 'X-Forwarded-For', 'X-Custom-Header',
];

// Common header value suggestions per key
const HEADER_VALUE_SUGGESTIONS: Record<string, string[]> = {
    'Content-Type': [
        'application/json', 'application/x-www-form-urlencoded',
        'multipart/form-data', 'text/plain', 'text/html', 'application/xml',
    ],
    'Accept': [
        'application/json', 'text/html', 'text/plain', '*/*',
        'application/xml', 'application/octet-stream',
    ],
    'Authorization': ['Bearer ', 'Basic ', 'ApiKey '],
    'Cache-Control': ['no-cache', 'no-store', 'max-age=0', 'must-revalidate'],
};

function SuggestionInput({
    value, onChange, placeholder, suggestions, className,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    suggestions: string[];
    className?: string;
}) {
    const [focused, setFocused] = useState(false);

    const filtered = focused
        ? suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()))
        : [];

    return (
        <div className="relative">
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 150)}
                placeholder={placeholder}
                className={className}
                autoComplete="off"
            />
            {focused && filtered.length > 0 && (
                <ul className="absolute z-50 top-full left-0 mt-0.5 w-full max-h-40 overflow-auto rounded border border-gray-700 bg-gray-900 shadow-lg">
                    {filtered.map((s) => (
                        <li
                            key={s}
                            onMouseDown={(e) => { e.preventDefault(); onChange(s); setFocused(false); }}
                            className="cursor-pointer px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-white"
                        >
                            {s}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default function KeyValueEditor({ rows, onChange, placeholder = 'Key', showFileUpload = false }: Props) {
    const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const update = (index: number, field: keyof KeyValue, value: any) => {
        onChange(rows.map((r, i) => i === index ? { ...r, [field]: value } : r));
    };

    const add = () => onChange([...rows, { key: '', value: '', enabled: true }]);

    const remove = (index: number) => {
        const updated = rows.filter((_, i) => i !== index);
        onChange(updated.length === 0 ? [{ key: '', value: '', enabled: true }] : updated);
    };

    const handleFileChange = (index: number, file: File | null) => {
        if (!file) {
            onChange(rows.map((r, i) => i === index
                ? { ...r, type: 'text', fileData: undefined, fileName: undefined, fileType: undefined }
                : r));
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = (e.target?.result as string).split(',')[1];
            onChange(rows.map((r, i) => i === index
                ? { ...r, type: 'file', value: file.name, fileData: base64, fileName: file.name, fileType: file.type }
                : r));
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="pt-2 space-y-2">
            {/* Column headers */}
            <div className={`grid gap-2 px-1 ${showFileUpload ? 'grid-cols-[20px_1fr_1fr_32px_32px]' : 'grid-cols-[20px_1fr_1fr_36px]'}`}>
                <span />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Key</span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Value</span>
                {showFileUpload && <span />}
                <span />
            </div>

            {rows.map((row, i) => {
                const isFile = (row as any).type === 'file';
                const valueSuggestions = HEADER_VALUE_SUGGESTIONS[row.key] || [];

                return (
                    <div key={i} className={`grid gap-2 items-center ${showFileUpload ? 'grid-cols-[20px_1fr_1fr_32px_32px]' : 'grid-cols-[20px_1fr_1fr_36px]'}`}>
                        <input
                            type="checkbox"
                            checked={row.enabled}
                            onChange={(e) => update(i, 'enabled', e.target.checked)}
                            className="h-4 w-4 accent-orange-500 cursor-pointer"
                        />

                        {/* Key input with suggestions (only for headers) */}
                        {!showFileUpload ? (
                            <SuggestionInput
                                value={row.key}
                                onChange={(v) => update(i, 'key', v)}
                                placeholder={placeholder}
                                suggestions={HEADER_KEY_SUGGESTIONS}
                                className="h-9 w-full rounded border border-gray-700 bg-gray-800 px-3 text-sm text-gray-100 placeholder-gray-600 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/20"
                            />
                        ) : (
                            <input
                                type="text"
                                value={row.key}
                                onChange={(e) => update(i, 'key', e.target.value)}
                                placeholder={placeholder}
                                className="h-9 w-full rounded border border-gray-700 bg-gray-800 px-3 text-sm text-gray-100 placeholder-gray-600 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/20"
                            />
                        )}

                        {/* Value input — file badge or text/suggestion */}
                        {isFile ? (
                            <div className="h-9 flex items-center gap-1.5 rounded border border-gray-700 bg-gray-800 px-2 text-xs text-gray-400 overflow-hidden">
                                <Paperclip className="h-3 w-3 shrink-0 text-orange-400" />
                                <span className="truncate flex-1">{(row as any).fileName || 'file'}</span>
                                <button
                                    onClick={() => handleFileChange(i, null)}
                                    className="shrink-0 text-gray-600 hover:text-red-400"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ) : !showFileUpload ? (
                            <SuggestionInput
                                value={row.value}
                                onChange={(v) => update(i, 'value', v)}
                                placeholder="Value"
                                suggestions={valueSuggestions}
                                className="h-9 w-full rounded border border-gray-700 bg-gray-800 px-3 text-sm text-gray-100 placeholder-gray-600 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/20"
                            />
                        ) : (
                            <input
                                type="text"
                                value={row.value}
                                onChange={(e) => update(i, 'value', e.target.value)}
                                placeholder="Value"
                                className="h-9 w-full rounded border border-gray-700 bg-gray-800 px-3 text-sm text-gray-100 placeholder-gray-600 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/20"
                            />
                        )}

                        {/* File upload button (form-data only) */}
                        {showFileUpload && (
                            <>
                                <button
                                    onClick={() => fileInputRefs.current[i]?.click()}
                                    title="Attach file"
                                    className="flex h-9 w-8 items-center justify-center rounded border border-gray-700 text-gray-500 hover:border-orange-500 hover:text-orange-400 transition-colors"
                                >
                                    <Paperclip className="h-3.5 w-3.5" />
                                </button>
                                <input
                                    ref={(el) => { fileInputRefs.current[i] = el; }}
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => handleFileChange(i, e.target.files?.[0] || null)}
                                />
                            </>
                        )}

                        <button
                            onClick={() => remove(i)}
                            className="flex h-9 w-9 items-center justify-center rounded border border-transparent text-gray-600 hover:border-gray-700 hover:bg-gray-800 hover:text-red-400 transition-colors"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                );
            })}

            <div className="pt-1">
                <button
                    onClick={add}
                    className="flex items-center gap-1.5 rounded border border-dashed border-gray-700 px-3 py-1.5 text-xs text-gray-500 hover:border-orange-500 hover:text-orange-400 transition-colors"
                >
                    <Plus className="h-3 w-3" /> Add Row
                </button>
            </div>
        </div>
    );
}

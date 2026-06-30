import { useState } from 'react';
import { Trash2, CheckCircle2, AlertCircle, Calendar, Database, ArrowUpRight, Copy, Check } from 'lucide-react';
import { Request, SavedExample } from '@/types';
import toast from 'react-hot-toast';

interface Props {
    request: Request;
    onUpdate: (updates: Partial<Request>) => void;
}

export default function SavedExamplesTab({ request, onUpdate }: Props) {
    const [selectedExampleId, setSelectedExampleId] = useState<string | null>(null);
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

    const examples = request.examples || [];

    const handleDelete = (index: number) => {
        if (!confirm('Are you sure you want to delete this saved example?')) return;
        const nextExamples = [...examples];
        nextExamples.splice(index, 1);
        onUpdate({ examples: nextExamples });
        toast.success('Example deleted');
        if (selectedExampleId === String(index)) {
            setSelectedExampleId(null);
        }
    };

    const handleApply = (example: SavedExample) => {
        onUpdate({
            method: example.method,
            url: example.url,
            headers: example.headers,
            queryParams: example.queryParams,
            body: example.body
        });
        toast.success('Example parameters applied to editor!');
    };

    const copyToClipboard = (text: string, idx: number) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedIdx(idx);
            setTimeout(() => setCopiedIdx(null), 2000);
        });
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 select-text p-6 overflow-auto">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
                <div>
                    <h3 className="text-sm font-semibold text-gray-200">Response Examples</h3>
                    <p className="text-xs text-gray-500">View and apply saved mock baselines and snapshot responses.</p>
                </div>
                <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-semibold text-orange-400 border border-orange-500/20">
                    {examples.length} Saved
                </span>
            </div>

            {examples.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-gray-800 rounded-xl bg-gray-950/20 my-4">
                    <Database className="h-10 w-10 text-gray-700 mb-2.5" />
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">No Saved Examples</h4>
                    <p className="text-xs text-gray-600 max-w-sm mt-1 leading-relaxed">
                        Execute this request and click the "Save Response" button in the response panel to store mock snapshots.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    {/* Left: Examples List */}
                    <div className="md:col-span-1 space-y-2.5">
                        {examples.map((ex, index) => {
                            const isSelected = selectedExampleId === String(index) || (selectedExampleId === null && index === 0);
                            const idStr = String(index);
                            const dateStr = ex.savedAt ? new Date(ex.savedAt).toLocaleDateString() : 'Unknown';
                            const isSuccess = ex.response.status >= 200 && ex.response.status < 300;

                            return (
                                <div
                                    key={index}
                                    onClick={() => setSelectedExampleId(idStr)}
                                    className={`group cursor-pointer rounded-xl border p-3.5 transition-all text-left ${
                                        isSelected
                                            ? 'bg-gray-800/80 border-orange-500/30 shadow-lg shadow-orange-500/5'
                                            : 'bg-gray-950/40 border-gray-800 hover:border-gray-700 hover:bg-gray-800/30'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-bold text-gray-200 truncate pr-2 max-w-[150px]">{ex.name}</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(index); }}
                                            className="opacity-0 group-hover:opacity-100 rounded p-1 hover:bg-gray-800 text-gray-500 hover:text-red-400 transition-all shrink-0"
                                            title="Delete Example"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                            ex.method === 'GET' ? 'bg-green-500/10 text-green-400' :
                                            ex.method === 'POST' ? 'bg-yellow-500/10 text-yellow-400' :
                                            ex.method === 'PUT' ? 'bg-blue-500/10 text-blue-400' :
                                            'bg-red-500/10 text-red-400'
                                        }`}>{ex.method}</span>
                                        <span className={`text-[10px] font-bold flex items-center gap-1 ${
                                            isSuccess ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                            {isSuccess ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                                            {ex.response.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] text-gray-500 font-mono">
                                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{dateStr}</span>
                                        <span>{ex.response.time}ms</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right: Selected Example Details */}
                    <div className="md:col-span-2 rounded-xl border border-gray-800 bg-gray-950/40 p-5 space-y-4">
                        {(() => {
                            const selectedIndex = selectedExampleId !== null ? Number(selectedExampleId) : 0;
                            const ex = examples[selectedIndex];
                            if (!ex) return null;

                            const responseBody = ex.response.data
                                ? (typeof ex.response.data === 'string' ? ex.response.data : JSON.stringify(ex.response.data, null, 2))
                                : '';

                            return (
                                <div className="space-y-4 text-left">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-800 pb-3 gap-3">
                                        <div>
                                            <h4 className="text-sm font-semibold text-orange-400">{ex.name}</h4>
                                            <p className="text-xs text-gray-400 truncate max-w-md font-mono mt-0.5">{ex.url}</p>
                                        </div>
                                        <button
                                            onClick={() => handleApply(ex)}
                                            className="shrink-0 flex items-center justify-center gap-1 rounded bg-orange-500 hover:bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                                        >
                                            Apply parameters
                                            <ArrowUpRight className="h-3.5 w-3.5" />
                                        </button>
                                    </div>

                                    {/* Snapshot request parameters info */}
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Request Headers</span>
                                            <div className="border border-gray-800 rounded bg-gray-900/50 p-2 font-mono text-[10px] text-gray-400 max-h-24 overflow-auto space-y-1">
                                                {ex.headers && ex.headers.filter(h => h.key).length > 0 ? (
                                                    ex.headers.filter(h => h.key).map((h, i) => (
                                                        <div key={i} className="truncate"><span className="text-orange-400/80">{h.key}</span>: {h.value}</div>
                                                    ))
                                                ) : (
                                                    <span className="italic text-gray-600">No custom headers</span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Request Params</span>
                                            <div className="border border-gray-800 rounded bg-gray-900/50 p-2 font-mono text-[10px] text-gray-400 max-h-24 overflow-auto space-y-1">
                                                {ex.queryParams && ex.queryParams.filter(q => q.key).length > 0 ? (
                                                    ex.queryParams.filter(q => q.key).map((q, i) => (
                                                        <div key={i} className="truncate"><span className="text-orange-400/80">{q.key}</span>: {q.value}</div>
                                                    ))
                                                ) : (
                                                    <span className="italic text-gray-600">No query params</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Snapshot response data */}
                                    <div className="space-y-1.5 flex-1 flex flex-col">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Saved Response Body</span>
                                            {responseBody && (
                                                <button
                                                    onClick={() => copyToClipboard(responseBody, selectedIndex)}
                                                    className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                                                >
                                                    {copiedIdx === selectedIndex ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                                                    Copy Body
                                                </button>
                                            )}
                                        </div>
                                        <div className="border border-gray-800 rounded-lg overflow-hidden bg-gray-950 p-3 max-h-96 overflow-auto font-mono text-[11px] text-orange-200/90 whitespace-pre-wrap leading-relaxed select-text">
                                            {responseBody || <span className="italic text-gray-600">Empty response payload</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}

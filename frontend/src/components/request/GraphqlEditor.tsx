import { useState } from 'react';
import { Play, Square, Code, Layers, FileJson, Info } from 'lucide-react';
import { Request, KeyValue } from '@/types';
import axios from 'axios';
import toast from 'react-hot-toast';
import KeyValueEditor from './KeyValueEditor';

interface Props {
    request: Request;
    onUpdate: (updates: Partial<Request>) => void;
}

const DEFAULT_URL = 'https://countries.trevorblades.com/';
const DEFAULT_QUERY = `query GetCountries {
  countries(filter: { code: { eq: "US" } }) {
    code
    name
    emoji
    capital
    currency
  }
}`;

export default function GraphqlEditor({ request, onUpdate }: Props) {
    const [queryText, setQueryText] = useState(DEFAULT_QUERY);
    const [variablesText, setVariablesText] = useState('{\n  "code": "US"\n}');
    const [headers, setHeaders] = useState<KeyValue[]>([{ key: '', value: '', enabled: true }]);
    const [isSending, setIsSending] = useState(false);
    const [responseBody, setResponseBody] = useState('');
    const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
    const [executionTime, setExecutionTime] = useState<number | null>(null);
    const [statusCode, setStatusCode] = useState<number | null>(null);
    const [activeLeftTab, setActiveLeftTab] = useState<'query' | 'variables' | 'headers'>('query');

    // Make sure request URL has a default if empty
    const currentUrl = request.url || DEFAULT_URL;

    const handleSend = async () => {
        if (!currentUrl.trim()) {
            toast.error('Please enter a GraphQL endpoint URL');
            return;
        }

        setIsSending(false);
        setResponseBody('');
        setResponseHeaders({});
        setStatusCode(null);
        setExecutionTime(null);

        setIsSending(true);
        const startTime = Date.now();

        try {
            // Parse variables JSON if present
            let variablesObj = {};
            if (variablesText.trim()) {
                try {
                    variablesObj = JSON.parse(variablesText);
                } catch (e) {
                    toast.error('Invalid Variables JSON format');
                    setIsSending(false);
                    return;
                }
            }

            // Build request headers
            const requestHeaders: Record<string, string> = {
                'Content-Type': 'application/json'
            };
            headers.forEach(h => {
                if (h.enabled && h.key.trim()) {
                    requestHeaders[h.key.trim()] = h.value;
                }
            });

            // Perform live GraphQL POST request
            const res = await axios.post(
                currentUrl,
                {
                    query: queryText,
                    variables: variablesObj
                },
                {
                    headers: requestHeaders,
                    timeout: 20000 // 20s timeout
                }
            );

            const endTime = Date.now();
            setExecutionTime(endTime - startTime);
            setStatusCode(res.status);
            setResponseHeaders(res.headers as any);
            setResponseBody(JSON.stringify(res.data, null, 2));

            toast.success('Query executed successfully!');
        } catch (err: any) {
            const endTime = Date.now();
            setExecutionTime(endTime - startTime);
            
            if (err.response) {
                setStatusCode(err.response.status);
                setResponseHeaders(err.response.headers as any);
                setResponseBody(JSON.stringify(err.response.data || 'Error occurred', null, 2));
            } else {
                setResponseBody(JSON.stringify({ error: err.message }, null, 2));
            }
            toast.error(err.response?.data?.errors?.[0]?.message || err.message || 'Failed to execute query');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-1 flex-col overflow-hidden bg-gray-900 select-text">
            {/* Connection Bar */}
            <div className="border-b border-gray-800 px-6 py-4 flex flex-col md:flex-row gap-3 items-center shrink-0">
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wide">
                        GraphQL
                    </span>
                    <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${isSending ? 'bg-amber-500 animate-pulse' : 'bg-gray-650'}`} />
                        <span className="text-[10px] uppercase font-bold text-gray-500">{isSending ? 'sending' : 'idle'}</span>
                    </div>
                </div>

                <input
                    type="text"
                    value={currentUrl}
                    onChange={(e) => onUpdate({ url: e.target.value })}
                    placeholder="https://api.example.com/graphql"
                    className="flex-1 w-full rounded border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 font-mono"
                />

                {isSending ? (
                    <button
                        disabled
                        className="shrink-0 flex items-center justify-center gap-1.5 rounded bg-gray-750 px-5 py-2 text-sm font-semibold text-gray-400 cursor-not-allowed w-full md:w-auto"
                    >
                        <Square className="h-4 w-4 animate-spin" /> Querying...
                    </button>
                ) : (
                    <button
                        onClick={handleSend}
                        className="shrink-0 flex items-center justify-center gap-1.5 rounded bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors w-full md:w-auto"
                    >
                        <Play className="h-4 w-4" /> Send Query
                    </button>
                )}
            </div>

            {/* Split Layout */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
                {/* Left Side: Query details, Variables, Headers */}
                <div className="border-r border-gray-850 flex flex-col overflow-hidden">
                    {/* Left side tabs */}
                    <div className="flex border-b border-gray-800 bg-gray-950/20 shrink-0">
                        <button
                            onClick={() => setActiveLeftTab('query')}
                            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
                                activeLeftTab === 'query' 
                                    ? 'border-orange-500 text-orange-500 bg-gray-900/10' 
                                    : 'border-transparent text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            <Code className="h-3.5 w-3.5" /> Query Editor
                        </button>
                        <button
                            onClick={() => setActiveLeftTab('variables')}
                            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
                                activeLeftTab === 'variables' 
                                    ? 'border-orange-500 text-orange-500 bg-gray-900/10' 
                                    : 'border-transparent text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            <FileJson className="h-3.5 w-3.5" /> Query Variables
                        </button>
                        <button
                            onClick={() => setActiveLeftTab('headers')}
                            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
                                activeLeftTab === 'headers' 
                                    ? 'border-orange-500 text-orange-500 bg-gray-900/10' 
                                    : 'border-transparent text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            <Layers className="h-3.5 w-3.5" /> Query Headers
                        </button>
                    </div>

                    <div className="flex-1 overflow-hidden flex flex-col p-4">
                        {activeLeftTab === 'query' && (
                            <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Write GraphQL Query schema</span>
                                <textarea
                                    value={queryText}
                                    onChange={(e) => setQueryText(e.target.value)}
                                    className="flex-1 resize-none rounded-lg border border-gray-800 bg-gray-950 p-3.5 font-mono text-xs text-orange-100/90 leading-relaxed focus:border-gray-700 focus:outline-none"
                                />
                            </div>
                        )}

                        {activeLeftTab === 'variables' && (
                            <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">GraphQL Query JSON Variables</span>
                                <textarea
                                    value={variablesText}
                                    onChange={(e) => setVariablesText(e.target.value)}
                                    className="flex-1 resize-none rounded-lg border border-gray-800 bg-gray-950 p-3.5 font-mono text-xs text-orange-100/90 leading-relaxed focus:border-gray-700 focus:outline-none"
                                />
                            </div>
                        )}

                        {activeLeftTab === 'headers' && (
                            <div className="flex-1 overflow-auto space-y-3">
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block">HTTP Headers for GraphQL request</span>
                                <KeyValueEditor 
                                    rows={headers} 
                                    onChange={(rows) => setHeaders(rows)} 
                                    placeholder="Header name" 
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Response payloads */}
                <div className="flex flex-col overflow-hidden bg-gray-950/40">
                    <div className="flex items-center justify-between border-b border-gray-850 px-4 py-2 bg-gray-950/30 shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-550 flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5 text-orange-400" /> Response Payload
                        </span>
                        
                        <div className="flex items-center gap-3 text-[10px] font-mono text-gray-500 font-bold select-none">
                            {statusCode !== null && (
                                <span className={statusCode >= 200 && statusCode < 300 ? 'text-green-400' : 'text-red-400'}>
                                    STATUS: {statusCode}
                                </span>
                            )}
                            {executionTime !== null && (
                                <span>
                                    TIME: {executionTime}ms
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 p-4 overflow-auto flex flex-col space-y-4">
                        {/* Headers display */}
                        {Object.keys(responseHeaders).length > 0 && (
                            <div>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-550 block mb-1">Response Headers</span>
                                <div className="border border-gray-800 rounded bg-gray-900/40 p-2 font-mono text-[9px] text-gray-400 space-y-0.5 max-h-28 overflow-auto">
                                    {Object.entries(responseHeaders).map(([k, v]) => (
                                        <div key={k} className="truncate"><span className="text-purple-400/80">{k}</span>: {String(v)}</div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Query output display */}
                        <div className="flex-1 flex flex-col">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-550 block mb-1">JSON Response Data</span>
                            <div className="flex-1 border border-gray-850 rounded-lg p-3 bg-gray-950 overflow-auto font-mono text-[10px] text-orange-200/90 whitespace-pre-wrap leading-relaxed select-text min-h-36">
                                {responseBody ? (
                                    responseBody
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-700 py-10">
                                        <Info className="h-8 w-8 text-gray-850 mb-1" />
                                        <span className="italic text-[10px]">No query results loaded. Click "Send Query" to fetch GraphQL data.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

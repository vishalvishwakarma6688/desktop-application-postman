import { useState, useEffect, useRef } from 'react';
import { Network, Play, Square, Send, Search, Trash2, Copy, Check } from 'lucide-react';
import { Request } from '@/types';
import toast from 'react-hot-toast';

interface Props {
    request: Request;
    onUpdate: (updates: Partial<Request>) => void;
}

interface MessageLog {
    time: string;
    dir: 'in' | 'out' | 'info';
    text: string;
}

export default function WebSocketEditor({ request, onUpdate }: Props) {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
    const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Scroll to bottom on new messages
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messageLogs]);

    // Clean up socket on unmount
    useEffect(() => {
        return () => {
            if (socket) {
                socket.close();
            }
        };
    }, [socket]);

    const addLog = (dir: 'in' | 'out' | 'info', text: string) => {
        const time = new Date().toLocaleTimeString();
        setMessageLogs(prev => [...prev, { time, dir, text }]);
    };

    const handleConnect = () => {
        if (!request.url.trim()) {
            toast.error('Please enter a WebSocket URL');
            return;
        }

        setStatus('connecting');
        addLog('info', `Connecting to ${request.url}...`);

        try {
            const ws = new WebSocket(request.url);

            ws.onopen = () => {
                setSocket(ws);
                setStatus('connected');
                addLog('info', '✓ WebSocket connection successfully established');
                toast.success('Connected to WebSocket!');
            };

            ws.onmessage = (event) => {
                const text = typeof event.data === 'string' 
                    ? event.data 
                    : JSON.stringify(event.data);
                addLog('in', text);
            };

            ws.onclose = (event) => {
                setSocket(null);
                setStatus('disconnected');
                addLog('info', `✕ WebSocket connection closed (Code: ${event.code})`);
                toast.error('WebSocket disconnected');
            };

            ws.onerror = () => {
                setStatus('error');
                addLog('info', '⚠ WebSocket connection error occurred');
                toast.error('Connection failed');
            };

        } catch (err: any) {
            setStatus('error');
            addLog('info', `⚠ Connection initialization error: ${err.message}`);
            toast.error('Invalid URL or Protocol');
        }
    };

    const handleDisconnect = () => {
        if (socket) {
            socket.close();
        }
    };

    const handleSend = () => {
        if (!socket || status !== 'connected') {
            toast.error('Socket is not connected');
            return;
        }
        if (!messageInput.trim()) return;

        try {
            socket.send(messageInput);
            addLog('out', messageInput);
            setMessageInput('');
        } catch (err: any) {
            addLog('info', `⚠ Failed to send message: ${err.message}`);
        }
    };

    const handleCopy = (text: string, idx: number) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedIdx(idx);
            setTimeout(() => setCopiedIdx(null), 2000);
        });
    };

    const filteredLogs = messageLogs.filter(log =>
        log.text.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-1 flex-col overflow-hidden bg-gray-900 select-text">
            {/* Connection Bar */}
            <div className="border-b border-gray-800 px-6 py-4 flex flex-col md:flex-row gap-3 items-center shrink-0">
                {/* WS Badge indicator */}
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wide">
                        WebSocket
                    </span>
                    <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${
                            status === 'connected' ? 'bg-emerald-500 animate-pulse' :
                            status === 'connecting' ? 'bg-amber-500 animate-pulse' :
                            status === 'error' ? 'bg-red-500' : 'bg-gray-600'
                        }`} />
                        <span className="text-[10px] uppercase font-bold text-gray-500">{status}</span>
                    </div>
                </div>

                {/* Connection URL Bar */}
                <input
                    type="text"
                    value={request.url}
                    disabled={status === 'connected' || status === 'connecting'}
                    onChange={(e) => onUpdate({ url: e.target.value })}
                    placeholder="ws://echo.websocket.org"
                    className="flex-1 w-full rounded border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 font-mono disabled:opacity-50"
                />

                {/* Connection Toggle buttons */}
                {status === 'connected' || status === 'connecting' ? (
                    <button
                        onClick={handleDisconnect}
                        className="shrink-0 flex items-center justify-center gap-1.5 rounded bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors w-full md:w-auto"
                    >
                        <Square className="h-4 w-4" /> Disconnect
                    </button>
                ) : (
                    <button
                        onClick={handleConnect}
                        className="shrink-0 flex items-center justify-center gap-1.5 rounded bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors w-full md:w-auto"
                    >
                        <Play className="h-4 w-4" /> Connect
                    </button>
                )}
            </div>

            {/* Split layout: Top/Left message composer, Bottom/Right Terminal logs */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Message Composer Area */}
                <div className="border-b border-gray-850 p-4 shrink-0 bg-gray-950/20">
                    <div className="flex items-start justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-550 flex items-center gap-1.5">
                            <Send className="h-3 w-3 text-orange-400" /> Send Message Payload
                        </span>
                        <span className="text-[10px] text-gray-600 italic">Supports text and JSON messages</span>
                    </div>
                    <div className="flex gap-3">
                        <textarea
                            value={messageInput}
                            disabled={status !== 'connected'}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder={status === 'connected' ? "Type message and press Enter (Shift+Enter for newline)..." : "Connect to socket server to enable message sender"}
                            rows={3}
                            className="flex-1 resize-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-100 placeholder-gray-600 focus:border-orange-500 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed max-h-24"
                        />
                        <button
                            onClick={handleSend}
                            disabled={status !== 'connected' || !messageInput.trim()}
                            className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors self-end"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Event Logs Terminal Console */}
                <div className="flex-1 flex flex-col overflow-hidden bg-gray-950">
                    {/* Console Header Bar */}
                    <div className="flex items-center justify-between border-b border-gray-800/80 px-4 py-2 shrink-0 bg-gray-900/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                            <Network className="h-3.5 w-3.5 text-indigo-400" /> Event Stream Console
                        </span>
                        
                        <div className="flex items-center gap-3">
                            {/* Search bar */}
                            {messageLogs.length > 0 && (
                                <div className="relative flex items-center">
                                    <Search className="absolute left-2.5 h-3 w-3 text-gray-600 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Filter stream logs..."
                                        className="pl-7 pr-2.5 py-0.5 w-40 rounded border border-gray-800 bg-gray-950 text-[10px] text-gray-300 placeholder-gray-700 focus:border-gray-700 focus:outline-none focus:ring-0"
                                    />
                                </div>
                            )}

                            {/* Clear logs button */}
                            {messageLogs.length > 0 && (
                                <button
                                    onClick={() => setMessageLogs([])}
                                    className="text-[10px] text-gray-600 hover:text-red-400 font-semibold flex items-center gap-1 transition-colors"
                                >
                                    <Trash2 className="h-3 w-3" /> Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Console Stream view */}
                    <div className="flex-1 p-4 overflow-auto font-mono text-[11px] space-y-2 select-text scrollbar-thin">
                        {filteredLogs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-700 py-10">
                                <Network className="h-10 w-10 text-gray-850 mb-2" />
                                <span className="italic text-[10px]">No active data packets or event streams logged.</span>
                            </div>
                        ) : (
                            filteredLogs.map((log, idx) => {
                                const isIncoming = log.dir === 'in';
                                const isInfo = log.dir === 'info';

                                return (
                                    <div 
                                        key={idx} 
                                        className={`flex items-start gap-2 border-b border-gray-900/40 pb-2 group ${
                                            isInfo ? 'text-gray-500 italic' :
                                            isIncoming ? 'text-emerald-350' : 'text-blue-350'
                                        }`}
                                    >
                                        {/* Timestamp */}
                                        <span className="text-gray-750 text-[9px] select-none pt-0.5">{log.time}</span>
                                        
                                        {/* Direction arrow badge */}
                                        {!isInfo && (
                                            <span className={`text-[10px] font-bold select-none px-1 rounded ${
                                                isIncoming ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                                            }`}>
                                                {isIncoming ? '← IN' : '→ OUT'}
                                            </span>
                                        )}
                                        
                                        {/* Message text content */}
                                        <span className="flex-1 break-all whitespace-pre-wrap leading-relaxed">
                                            {log.text}
                                        </span>

                                        {/* Copy button */}
                                        {!isInfo && (
                                            <button
                                                onClick={() => handleCopy(log.text, idx)}
                                                className="opacity-0 group-hover:opacity-100 rounded hover:bg-gray-850 p-1 text-gray-700 hover:text-gray-400 transition-all shrink-0 self-center"
                                                title="Copy Message"
                                            >
                                                {copiedIdx === idx ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        )}
                        <div ref={logsEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
}

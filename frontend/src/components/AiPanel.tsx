import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Loader2, Copy, Check, Wand2, Bug, TestTube } from 'lucide-react';
import { aiApi } from '@/features/ai/api';
import { useTabStore } from '@/store/useTabStore';

interface Message {
    role: 'user' | 'assistant';
    text: string;
}

interface Props {
    response?: any; // current response from RequestEditor
}

const QUICK_ACTIONS = [
    { id: 'explain', icon: Sparkles, label: 'Explain response', color: 'text-purple-400' },
    { id: 'fix', icon: Bug, label: 'Fix this error', color: 'text-red-400' },
    { id: 'generate-body', icon: Wand2, label: 'Generate body', color: 'text-blue-400' },
    { id: 'generate-tests', icon: TestTube, label: 'Generate tests', color: 'text-green-400' },
] as const;

function MarkdownText({ text }: { text: string }) {
    // Simple markdown: bold, code blocks, inline code
    const lines = text.split('\n');
    return (
        <div className="space-y-1">
            {lines.map((line, i) => {
                if (line.startsWith('```')) return null;
                if (line.startsWith('### ')) return <p key={i} className="text-xs font-bold text-gray-200 mt-2">{line.slice(4)}</p>;
                if (line.startsWith('## ')) return <p key={i} className="text-xs font-bold text-gray-100 mt-2">{line.slice(3)}</p>;
                if (line.startsWith('# ')) return <p key={i} className="text-sm font-bold text-white mt-2">{line.slice(2)}</p>;
                if (line.startsWith('- ') || line.startsWith('* ')) return (
                    <p key={i} className="text-xs text-gray-300 flex gap-1.5">
                        <span className="text-orange-400 shrink-0">•</span>
                        <span dangerouslySetInnerHTML={{ __html: formatInline(line.slice(2)) }} />
                    </p>
                );
                if (/^\d+\. /.test(line)) return (
                    <p key={i} className="text-xs text-gray-300" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
                );
                if (line.trim() === '') return <div key={i} className="h-1" />;
                return <p key={i} className="text-xs text-gray-300" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />;
            })}
        </div>
    );
}

function formatInline(text: string) {
    return text
        .replace(/`([^`]+)`/g, '<code class="bg-gray-700 px-1 rounded text-orange-300 font-mono text-xs">$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-gray-100">$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

export default function AiPanel({ response }: Props) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const { tabs, activeTabId } = useTabStore();
    const activeRequest = tabs.find(t => t.id === activeTabId)?.request;

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const addMessage = (role: 'user' | 'assistant', text: string) => {
        setMessages(prev => [...prev, { role, text }]);
    };

    const handleQuickAction = async (id: typeof QUICK_ACTIONS[number]['id']) => {
        if (!activeRequest) return;
        setLoading(true);

        try {
            let userMsg = '';
            let result = '';

            if (id === 'explain' && response && !response.error) {
                userMsg = `Explain this ${response.status} response from ${activeRequest.method} ${activeRequest.url}`;
                result = await aiApi.explainResponse({
                    status: response.status, statusText: response.statusText,
                    data: response.data, headers: response.headers,
                    method: activeRequest.method, url: activeRequest.url,
                });
            } else if (id === 'fix' && response?.error) {
                userMsg = `Help me fix this error from ${activeRequest.method} ${activeRequest.url}`;
                result = await aiApi.fixRequest({
                    method: activeRequest.method, url: activeRequest.url,
                    headers: activeRequest.headers, body: activeRequest.body,
                    errorResponse: response.error || response.data,
                    errorStatus: response.status || 0,
                });
            } else if (id === 'generate-body') {
                userMsg = `Generate a request body for ${activeRequest.method} ${activeRequest.url}`;
                result = await aiApi.generateBody({
                    method: activeRequest.method, url: activeRequest.url,
                });
            } else if (id === 'generate-tests' && response && !response.error) {
                userMsg = `Generate test assertions for this response`;
                result = await aiApi.generateTests({
                    method: activeRequest.method, url: activeRequest.url,
                    responseStatus: response.status, responseData: response.data,
                });
            } else {
                setLoading(false);
                return;
            }

            addMessage('user', userMsg);
            addMessage('assistant', result);
        } catch (err: any) {
            addMessage('assistant', `Error: ${err?.response?.data?.error?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleChat = async () => {
        if (!input.trim() || loading) return;
        const msg = input.trim();
        setInput('');
        addMessage('user', msg);
        setLoading(true);
        try {
            const context = activeRequest ? {
                method: activeRequest.method,
                url: activeRequest.url,
                hasResponse: !!response,
                responseStatus: response?.status,
            } : undefined;
            const result = await aiApi.chat(msg, context);
            addMessage('assistant', result);
        } catch (err: any) {
            addMessage('assistant', `Error: ${err?.response?.data?.error?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const copyMessage = (text: string, idx: number) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedIdx(idx);
            setTimeout(() => setCopiedIdx(null), 2000);
        });
    };

    return (
        <>
            {/* Floating trigger button */}
            <button
                onClick={() => setOpen(v => !v)}
                className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-lg transition-all ${open
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/30'
                    }`}
            >
                <Sparkles className="h-4 w-4" />
                {open ? 'Close AI' : 'AI Assistant'}
            </button>

            {/* Panel */}
            <div
                className={`fixed bottom-16 right-5 z-50 flex flex-col w-80 h-[520px] rounded-xl border border-gray-700 bg-gray-900 shadow-2xl overflow-hidden transition-all duration-300 ease-out origin-bottom-right ${open
                    ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3 shrink-0 bg-gray-950">
                    <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/20">
                            <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                        </div>
                        <span className="text-sm font-semibold text-gray-100">AI Assistant</span>
                        <span className="text-xs text-gray-600">Gemini</span>
                    </div>
                    <div className="flex items-center gap-1">
                        {messages.length > 0 && (
                            <button
                                onClick={() => setMessages([])}
                                className="text-xs text-gray-600 hover:text-gray-400 px-1.5 py-0.5 rounded hover:bg-gray-800 transition-colors"
                            >
                                Clear
                            </button>
                        )}
                        <button onClick={() => setOpen(false)} className="rounded p-1 text-gray-600 hover:bg-gray-800 hover:text-gray-300 transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Quick actions */}
                <div className="border-b border-gray-800 px-3 py-2 shrink-0">
                    <div className="grid grid-cols-2 gap-1.5">
                        {QUICK_ACTIONS.map(({ id, icon: Icon, label, color }) => (
                            <button
                                key={id}
                                onClick={() => handleQuickAction(id)}
                                disabled={loading || !activeRequest}
                                className="flex items-center gap-1.5 rounded-lg border border-gray-800 bg-gray-800/50 px-2.5 py-1.5 text-xs text-gray-400 hover:border-gray-700 hover:bg-gray-800 hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <Icon className={`h-3 w-3 shrink-0 ${color}`} />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-auto px-3 py-3 space-y-3">
                    {messages.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                            <Sparkles className="h-8 w-8 text-gray-700" />
                            <p className="text-xs text-gray-600">Use quick actions above or ask anything about your API</p>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div key={i} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            {msg.role === 'user' ? (
                                <div className="max-w-[85%] rounded-xl rounded-tr-sm bg-orange-500/20 border border-orange-500/20 px-3 py-2">
                                    <p className="text-xs text-orange-200">{msg.text}</p>
                                </div>
                            ) : (
                                <div className="w-full rounded-xl rounded-tl-sm bg-gray-800 border border-gray-700 px-3 py-2.5 group">
                                    <MarkdownText text={msg.text} />
                                    <button
                                        onClick={() => copyMessage(msg.text, i)}
                                        className="mt-2 flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        {copiedIdx === i ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                                        {copiedIdx === i ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className="flex items-start gap-2">
                            <div className="rounded-xl rounded-tl-sm bg-gray-800 border border-gray-700 px-3 py-2.5">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Loader2 className="h-3 w-3 animate-spin text-orange-400" />
                                    Thinking...
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="border-t border-gray-800 p-3 shrink-0">
                    <div className="flex items-end gap-2">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleChat();
                                }
                            }}
                            placeholder="Ask about your API..."
                            rows={1}
                            className="flex-1 resize-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-100 placeholder-gray-600 focus:border-orange-500 focus:outline-none max-h-20"
                        />
                        <button
                            onClick={handleChat}
                            disabled={!input.trim() || loading}
                            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <p className="mt-1.5 text-xs text-gray-700">Enter to send · Shift+Enter for new line</p>
                </div>
            </div>
        </>
    );
}

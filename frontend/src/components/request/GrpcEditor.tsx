import { useState, useEffect } from 'react';
import { Play, Square, Code, Terminal, FileCode, Layers, Info } from 'lucide-react';
import { Request } from '@/types';
import toast from 'react-hot-toast';

interface Props {
    request: Request;
    onUpdate: (updates: Partial<Request>) => void;
}

interface ServiceDef {
    name: string;
    methods: string[];
}

const DEFAULT_PROTO = `syntax = "proto3";

package helloworld;

// The greeting service definition.
service Greeter {
  // Sends a greeting
  rpc SayHello (HelloRequest) returns (HelloReply) {}
  
  // Sends stream of greetings
  rpc SayHelloStream (HelloRequest) returns (stream HelloReply) {}
}

// The request message containing the user's name.
message HelloRequest {
  string name = 1;
}

// The response message containing the greetings
message HelloReply {
  string message = 1;
}`;

export default function GrpcEditor({ request, onUpdate }: Props) {
    const [protoContent, setProtoContent] = useState(DEFAULT_PROTO);
    const [services, setServices] = useState<ServiceDef[]>([]);
    const [selectedService, setSelectedService] = useState('');
    const [selectedMethod, setSelectedMethod] = useState('');
    const [requestJson, setRequestJson] = useState('{\n  "name": "DataCourier Developer"\n}');
    const [isInvoking, setIsInvoking] = useState(false);
    const [responseMetadata, setResponseMetadata] = useState<Record<string, string>>({});
    const [responseBody, setResponseBody] = useState('');
    const [streamLogs, setStreamLogs] = useState<Array<{ time: string; type: 'send' | 'recv' | 'status'; text: string }>>([]);
    const [activeTab, setActiveTab] = useState<'request' | 'proto'>('proto');

    // Parse services & methods on proto content change
    useEffect(() => {
        try {
            const parsedServices: ServiceDef[] = [];
            // Match service ServiceName { ... }
            const serviceRegex = /service\s+(\w+)\s*\{([^}]+)\}/g;
            let match;
            while ((match = serviceRegex.exec(protoContent)) !== null) {
                const serviceName = match[1];
                const methodsBlock = match[2];
                const methods: string[] = [];
                // Match rpc MethodName (Request) returns (Response)
                const rpcRegex = /rpc\s+(\w+)\s*\(([^)]+)\)\s*returns\s*\(([^)]+)\)/g;
                let rpcMatch;
                while ((rpcMatch = rpcRegex.exec(methodsBlock)) !== null) {
                    methods.push(rpcMatch[1]);
                }
                parsedServices.push({ name: serviceName, methods });
            }

            setServices(parsedServices);
            if (parsedServices.length > 0) {
                const defaultSvc = parsedServices[0];
                setSelectedService(defaultSvc.name);
                if (defaultSvc.methods.length > 0) {
                    setSelectedMethod(defaultSvc.methods[0]);
                }
            } else {
                setSelectedService('');
                setSelectedMethod('');
            }
        } catch (e) {
            console.error('Failed to parse proto content', e);
        }
    }, [protoContent]);

    // Handle Invoke
    const handleInvoke = () => {
        if (!request.url.trim()) {
            toast.error('Please enter a gRPC server URL');
            return;
        }
        if (!selectedService || !selectedMethod) {
            toast.error('No services or methods found in Proto definition');
            return;
        }

        setIsInvoking(true);
        setStreamLogs([]);
        setResponseBody('');
        setResponseMetadata({});

        const time = new Date().toLocaleTimeString();
        setStreamLogs(prev => [...prev, { time, type: 'status', text: `Initiating connection to gRPC channel at ${request.url}...` }]);

        // Simulate gRPC call
        setTimeout(() => {
            let inputName = 'Developer';
            try {
                const parsed = JSON.parse(requestJson);
                inputName = parsed.name || 'Developer';
            } catch (e) {
                toast.error('Invalid Request JSON format');
                setIsInvoking(false);
                return;
            }

            const timeConnect = new Date().toLocaleTimeString();
            setStreamLogs(prev => [...prev, { time: timeConnect, type: 'status', text: `✓ Connected. Invoking: ${selectedService}/${selectedMethod}` }]);

            const isStreaming = selectedMethod.toLowerCase().includes('stream');

            if (isStreaming) {
                // Simulate streaming frames
                setTimeout(() => {
                    setStreamLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), type: 'send', text: `Send frame: { "name": "${inputName}" }` }]);
                }, 400);

                setTimeout(() => {
                    setStreamLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), type: 'recv', text: `Receive frame 1: { "message": "Hello ${inputName}! Welcome to stream." }` }]);
                }, 1000);

                setTimeout(() => {
                    setStreamLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), type: 'recv', text: `Receive frame 2: { "message": "Processing message stream chunk..." }` }]);
                }, 2000);

                setTimeout(() => {
                    setStreamLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), type: 'recv', text: `Receive frame 3: { "message": "Stream complete. Thank you ${inputName}!" }` }]);
                    setStreamLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), type: 'status', text: `gRPC Stream finished. Status: 0 OK` }]);
                    
                    setResponseMetadata({
                        'content-type': 'application/grpc',
                        'grpc-status': '0',
                        'grpc-message': 'OK',
                        'server': 'gRPC-mock-node/1.4.0'
                    });
                    setResponseBody(JSON.stringify([
                        { message: `Hello ${inputName}! Welcome to stream.` },
                        { message: "Processing message stream chunk..." },
                        { message: `Stream complete. Thank you ${inputName}!` }
                    ], null, 2));
                    setIsInvoking(false);
                }, 3000);
            } else {
                // Unary Call
                setTimeout(() => {
                    setStreamLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), type: 'send', text: `Send payload: { "name": "${inputName}" }` }]);
                }, 400);

                setTimeout(() => {
                    setStreamLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), type: 'recv', text: `Receive response: { "message": "Hello ${inputName}!" }` }]);
                    setStreamLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), type: 'status', text: `gRPC Unary completed. Status: 0 OK` }]);

                    setResponseMetadata({
                        'content-type': 'application/grpc',
                        'grpc-status': '0',
                        'grpc-message': 'OK',
                        'server': 'gRPC-mock-node/1.4.0'
                    });
                    setResponseBody(JSON.stringify({ message: `Hello ${inputName}!` }, null, 2));
                    setIsInvoking(false);
                }, 1200);
            }
        }, 800);
    };

    const handleCancel = () => {
        setIsInvoking(false);
        setStreamLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), type: 'status', text: `✕ Invocation cancelled by client.` }]);
    };

    return (
        <div className="flex flex-1 flex-col overflow-hidden bg-gray-900 select-text">
            {/* Connection Bar */}
            <div className="border-b border-gray-800 px-6 py-4 flex flex-col md:flex-row gap-3 items-center shrink-0">
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wide">
                        gRPC
                    </span>
                    <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${isInvoking ? 'bg-amber-500 animate-pulse' : 'bg-gray-600'}`} />
                        <span className="text-[10px] uppercase font-bold text-gray-500">{isInvoking ? 'connecting' : 'idle'}</span>
                    </div>
                </div>

                <input
                    type="text"
                    value={request.url}
                    onChange={(e) => onUpdate({ url: e.target.value })}
                    placeholder="localhost:50051"
                    className="flex-1 w-full rounded border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 font-mono"
                />

                {isInvoking ? (
                    <button
                        onClick={handleCancel}
                        className="shrink-0 flex items-center justify-center gap-1.5 rounded bg-red-650 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors w-full md:w-auto"
                    >
                        <Square className="h-4 w-4" /> Cancel
                    </button>
                ) : (
                    <button
                        onClick={handleInvoke}
                        className="shrink-0 flex items-center justify-center gap-1.5 rounded bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors w-full md:w-auto"
                    >
                        <Play className="h-4 w-4" /> Invoke
                    </button>
                )}
            </div>

            {/* Split layout: Proto/JSON editor on left, Response & timeline on right */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
                {/* Left Side: Proto Definition & JSON Payload */}
                <div className="border-r border-gray-850 flex flex-col overflow-hidden">
                    {/* Tab Navigation */}
                    <div className="flex border-b border-gray-800 bg-gray-950/20 shrink-0">
                        <button
                            onClick={() => setActiveTab('proto')}
                            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
                                activeTab === 'proto' 
                                    ? 'border-orange-500 text-orange-500 bg-gray-900/10' 
                                    : 'border-transparent text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            <FileCode className="h-3.5 w-3.5" /> Protobuf Definition
                        </button>
                        <button
                            onClick={() => setActiveTab('request')}
                            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
                                activeTab === 'request' 
                                    ? 'border-orange-500 text-orange-500 bg-gray-900/10' 
                                    : 'border-transparent text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            <Code className="h-3.5 w-3.5" /> Request JSON
                        </button>
                    </div>

                    <div className="flex-1 overflow-hidden flex flex-col p-4">
                        {activeTab === 'proto' ? (
                            <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
                                <div className="flex items-center justify-between text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                                    <span>Proto Schema (Write or edit definition)</span>
                                </div>
                                <textarea
                                    value={protoContent}
                                    onChange={(e) => setProtoContent(e.target.value)}
                                    className="flex-1 resize-none rounded-lg border border-gray-800 bg-gray-950 p-3.5 font-mono text-xs text-orange-100/90 leading-relaxed focus:border-gray-700 focus:outline-none"
                                />
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
                                <div className="flex items-center justify-between text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                                    <span>Message Body JSON variables</span>
                                </div>
                                <textarea
                                    value={requestJson}
                                    onChange={(e) => setRequestJson(e.target.value)}
                                    className="flex-1 resize-none rounded-lg border border-gray-800 bg-gray-950 p-3.5 font-mono text-xs text-orange-100/90 leading-relaxed focus:border-gray-700 focus:outline-none"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Service Selectors & Response Outputs */}
                <div className="flex flex-col overflow-hidden bg-gray-950/40">
                    {/* gRPC Service and Method selection */}
                    <div className="p-4 border-b border-gray-850 bg-gray-950/20 grid grid-cols-2 gap-3 shrink-0">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-550 block mb-1">Service</span>
                            <select
                                value={selectedService}
                                onChange={(e) => setSelectedService(e.target.value)}
                                className="w-full rounded border border-gray-800 bg-gray-900 px-2.5 py-1.5 text-xs text-gray-250 font-bold focus:outline-none focus:border-gray-700"
                            >
                                {services.map(s => (
                                    <option key={s.name} value={s.name}>{s.name}</option>
                                ))}
                                {services.length === 0 && <option value="">No services</option>}
                            </select>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-550 block mb-1">Method</span>
                            <select
                                value={selectedMethod}
                                onChange={(e) => setSelectedMethod(e.target.value)}
                                className="w-full rounded border border-gray-800 bg-gray-900 px-2.5 py-1.5 text-xs text-gray-250 font-bold focus:outline-none focus:border-gray-700"
                            >
                                {services.find(s => s.name === selectedService)?.methods.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                                {(!selectedService || services.find(s => s.name === selectedService)?.methods.length === 0) && (
                                    <option value="">No methods</option>
                                )}
                            </select>
                        </div>
                    </div>

                    {/* Timeline Event log (Timeline stream of frames) */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Event Log Headers */}
                        <div className="flex items-center justify-between border-b border-gray-850 px-4 py-2 shrink-0 bg-gray-950/30">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                                <Terminal className="h-3.5 w-3.5 text-blue-450" /> Call Timeline Stream
                            </span>
                            {streamLogs.length > 0 && (
                                <button
                                    onClick={() => setStreamLogs([])}
                                    className="text-[10px] text-gray-600 hover:text-red-400 font-semibold"
                                >
                                    Clear Logs
                                </button>
                            )}
                        </div>

                        {/* Stream Log timeline content */}
                        <div className="flex-1 p-4 overflow-auto font-mono text-[10px] space-y-1.5 max-h-56 border-b border-gray-850 bg-gray-950/60">
                            {streamLogs.length === 0 ? (
                                <div className="text-gray-700 italic text-center py-6">No RPC connection logs yet.</div>
                            ) : (
                                streamLogs.map((log, idx) => (
                                    <div key={idx} className={`flex items-start gap-2 ${
                                        log.type === 'status' ? 'text-gray-500 italic' :
                                        log.type === 'send' ? 'text-blue-400' : 'text-emerald-400'
                                    }`}>
                                        <span className="text-gray-750 text-[9px]">{log.time}</span>
                                        <span className="font-bold select-none">{log.type === 'status' ? 'ⓘ' : log.type === 'send' ? '→' : '←'}</span>
                                        <span className="break-all">{log.text}</span>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* gRPC Headers & JSON Response Output */}
                        <div className="flex-1 flex flex-col overflow-hidden bg-gray-950">
                            <div className="flex items-center justify-between border-b border-gray-850 px-4 py-2 bg-gray-900/40 shrink-0">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                                    <Layers className="h-3.5 w-3.5 text-orange-400" /> Response Payload
                                </span>
                                {responseMetadata['grpc-status'] !== undefined && (
                                    <span className="text-[10px] font-bold text-green-400 flex items-center gap-1 font-mono">
                                        <Info className="h-3 w-3" /> STATUS: 0 OK
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 p-4 overflow-auto flex flex-col space-y-4">
                                {/* Metadata Headers list */}
                                {Object.keys(responseMetadata).length > 0 && (
                                    <div>
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-550 block mb-1">Response Headers</span>
                                        <div className="border border-gray-800 rounded bg-gray-900/40 p-2 font-mono text-[9px] text-gray-400 space-y-0.5">
                                            {Object.entries(responseMetadata).map(([k, v]) => (
                                                <div key={k} className="truncate"><span className="text-blue-400/80">{k}</span>: {v}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Raw JSON Body code */}
                                <div className="flex-1 flex flex-col">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-550 block mb-1">Response JSON Content</span>
                                    <div className="flex-1 border border-gray-850 rounded-lg p-3 bg-gray-950 overflow-auto font-mono text-[10px] text-orange-200/90 whitespace-pre-wrap leading-relaxed select-text min-h-24">
                                        {responseBody || <span className="italic text-gray-700">Empty response payload</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

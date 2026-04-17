import { ChevronRight, ChevronDown } from 'lucide-react';
import type { ApiResponseData, Change } from '../../types/diff';

interface ResponsePanelProps {
    response: ApiResponseData;
    changes: Change[];
    side: 'left' | 'right';
    expandedPaths: Set<string>;
    onToggleExpand: (path: string) => void;
}

export function ResponsePanel({
    response,
    changes,
    side,
    expandedPaths,
    onToggleExpand,
}: ResponsePanelProps) {
    const body = typeof response.body === 'string'
        ? tryParseJSON(response.body)
        : response.body;

    return (
        <div className="flex-1 overflow-auto bg-gray-900 border border-gray-800 rounded-lg">
            <div className="p-4">
                <div className="mb-4 pb-4 border-b border-gray-800">
                    <div className="text-sm text-gray-400 mb-2">
                        {side === 'left' ? 'Left Response' : 'Right Response'}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className={`px-2 py-1 rounded ${getStatusColor(response.status)}`}>
                            {response.status} {response.statusText}
                        </span>
                        <span>{response.duration}ms</span>
                        <span>{new Date(response.timestamp).toLocaleString()}</span>
                    </div>
                </div>

                <div className="font-mono text-sm">
                    <ResponseNode
                        value={body}
                        path={[]}
                        changes={changes}
                        side={side}
                        expandedPaths={expandedPaths}
                        onToggleExpand={onToggleExpand}
                    />
                </div>
            </div>
        </div>
    );
}

interface ResponseNodeProps {
    value: any;
    path: string[];
    changes: Change[];
    side: 'left' | 'right';
    expandedPaths: Set<string>;
    onToggleExpand: (path: string) => void;
    isLast?: boolean;
}

function ResponseNode({
    value,
    path,
    changes,
    side,
    expandedPaths,
    onToggleExpand,
    isLast = true,
}: ResponseNodeProps) {
    const pathString = pathToString(path);
    const isExpanded = expandedPaths.has(pathString);
    const change = findChangeForPath(pathString, changes);
    const highlightClass = getHighlightClass(change, side);

    if (value === null) {
        return (
            <div className={`${highlightClass} py-0.5`}>
                <span className="text-gray-500">null</span>
                {!isLast && <span className="text-gray-600">,</span>}
            </div>
        );
    }

    if (value === undefined) {
        return (
            <div className={`${highlightClass} py-0.5`}>
                <span className="text-gray-500">undefined</span>
                {!isLast && <span className="text-gray-600">,</span>}
            </div>
        );
    }

    if (typeof value === 'string') {
        return (
            <div className={`${highlightClass} py-0.5`}>
                <span className="text-green-400">"{value}"</span>
                {!isLast && <span className="text-gray-600">,</span>}
            </div>
        );
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return (
            <div className={`${highlightClass} py-0.5`}>
                <span className="text-blue-400">{String(value)}</span>
                {!isLast && <span className="text-gray-600">,</span>}
            </div>
        );
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return (
                <div className={`${highlightClass} py-0.5`}>
                    <span className="text-gray-400">[]</span>
                    {!isLast && <span className="text-gray-600">,</span>}
                </div>
            );
        }

        return (
            <div className={highlightClass}>
                <button
                    onClick={() => onToggleExpand(pathString)}
                    className="inline-flex items-center gap-1 hover:bg-gray-800 rounded px-1 -ml-1"
                >
                    {isExpanded ? (
                        <ChevronDown className="h-3 w-3 text-gray-500" />
                    ) : (
                        <ChevronRight className="h-3 w-3 text-gray-500" />
                    )}
                    <span className="text-gray-400">[</span>
                    {!isExpanded && (
                        <span className="text-gray-500 text-xs">{value.length} items</span>
                    )}
                </button>

                {isExpanded && (
                    <div className="ml-4 border-l border-gray-800 pl-2">
                        {value.map((item, index) => (
                            <div key={index} className="py-0.5">
                                <span className="text-gray-600 mr-2">{index}:</span>
                                <ResponseNode
                                    value={item}
                                    path={[...path, index.toString()]}
                                    changes={changes}
                                    side={side}
                                    expandedPaths={expandedPaths}
                                    onToggleExpand={onToggleExpand}
                                    isLast={index === value.length - 1}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {isExpanded && <span className="text-gray-400">]</span>}
                {!isExpanded && <span className="text-gray-400">]</span>}
                {!isLast && <span className="text-gray-600">,</span>}
            </div>
        );
    }

    if (typeof value === 'object') {
        const keys = Object.keys(value);

        if (keys.length === 0) {
            return (
                <div className={`${highlightClass} py-0.5`}>
                    <span className="text-gray-400">{'{}'}</span>
                    {!isLast && <span className="text-gray-600">,</span>}
                </div>
            );
        }

        return (
            <div className={highlightClass}>
                <button
                    onClick={() => onToggleExpand(pathString)}
                    className="inline-flex items-center gap-1 hover:bg-gray-800 rounded px-1 -ml-1"
                >
                    {isExpanded ? (
                        <ChevronDown className="h-3 w-3 text-gray-500" />
                    ) : (
                        <ChevronRight className="h-3 w-3 text-gray-500" />
                    )}
                    <span className="text-gray-400">{'{'}</span>
                    {!isExpanded && (
                        <span className="text-gray-500 text-xs">{keys.length} keys</span>
                    )}
                </button>

                {isExpanded && (
                    <div className="ml-4 border-l border-gray-800 pl-2">
                        {keys.map((key, index) => (
                            <div key={key} className="py-0.5">
                                <span className="text-purple-400">"{key}"</span>
                                <span className="text-gray-600">: </span>
                                <ResponseNode
                                    value={value[key]}
                                    path={[...path, key]}
                                    changes={changes}
                                    side={side}
                                    expandedPaths={expandedPaths}
                                    onToggleExpand={onToggleExpand}
                                    isLast={index === keys.length - 1}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {isExpanded && <span className="text-gray-400">{'}'}</span>}
                {!isExpanded && <span className="text-gray-400">{'}'}</span>}
                {!isLast && <span className="text-gray-600">,</span>}
            </div>
        );
    }

    return null;
}

// Helper functions

function tryParseJSON(str: string): any {
    try {
        return JSON.parse(str);
    } catch {
        return str;
    }
}

function pathToString(path: string[]): string {
    if (path.length === 0) return 'root';

    return path.reduce((acc, segment, index) => {
        if (/^\d+$/.test(segment)) {
            return `${acc}[${segment}]`;
        }
        return index === 0 ? segment : `${acc}.${segment}`;
    }, '');
}

function findChangeForPath(pathString: string, changes: Change[]): Change | undefined {
    return changes.find(change => change.pathString === pathString);
}

function getHighlightClass(change: Change | undefined, side: 'left' | 'right'): string {
    if (!change) return '';

    if (change.type === 'added' && side === 'right') {
        return 'bg-green-500/10 border-l-2 border-green-500 pl-2 -ml-2';
    }

    if (change.type === 'removed' && side === 'left') {
        return 'bg-red-500/10 border-l-2 border-red-500 pl-2 -ml-2';
    }

    if (change.type === 'modified') {
        return 'bg-yellow-500/10 border-l-2 border-yellow-500 pl-2 -ml-2';
    }

    return '';
}

function getStatusColor(status: number): string {
    if (status >= 200 && status < 300) {
        return 'bg-green-500/20 text-green-400';
    }
    if (status >= 300 && status < 400) {
        return 'bg-blue-500/20 text-blue-400';
    }
    if (status >= 400 && status < 500) {
        return 'bg-yellow-500/20 text-yellow-400';
    }
    if (status >= 500) {
        return 'bg-red-500/20 text-red-400';
    }
    return 'bg-gray-500/20 text-gray-400';
}

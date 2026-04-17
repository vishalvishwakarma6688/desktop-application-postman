import { useState } from 'react';
import { X, GitCompare, AlertCircle } from 'lucide-react';
import { DiffViewerProvider, useDiffViewer } from '../../contexts/DiffViewerContext';
import { SideBySidePanel } from './SideBySidePanel';
import { SourceSelector } from './SourceSelector';
import type { ApiResponseData, ComparisonSource } from '../../types/diff';

interface DiffViewerProps {
    initialResponse: ApiResponseData;
    onClose: () => void;
}

export function DiffViewer({ initialResponse, onClose }: DiffViewerProps) {
    return (
        <DiffViewerProvider initialResponse={initialResponse}>
            <DiffViewerContent onClose={onClose} />
        </DiffViewerProvider>
    );
}

function DiffViewerContent({ onClose }: { onClose: () => void }) {
    const {
        leftResponse,
        rightResponse,
        diffResult,
        isComputing,
        error,
        expandedPaths,
        setRightResponse,
        togglePath,
    } = useDiffViewer();

    const [showSourceSelector, setShowSourceSelector] = useState(false);

    const handleSourceSelected = (source: ComparisonSource) => {
        setRightResponse(source.data);
        setShowSourceSelector(false);
    };

    return (
        <div className="fixed inset-0 bg-gray-950 z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-2 border-b border-gray-800 bg-gray-900">
                <div className="flex items-center gap-3">
                    <GitCompare className="h-5 w-5 text-orange-400" />
                    <h1 className="text-lg font-semibold text-white">API Response Diff Viewer</h1>
                </div>

                <div className="flex items-center gap-3">
                    {rightResponse && (
                        <button
                            onClick={() => setShowSourceSelector(true)}
                            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded transition-colors"
                        >
                            Change Comparison Source
                        </button>
                    )}

                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Summary Bar */}
            {diffResult && (
                <div className="px-6 py-3 bg-gray-900/50 border-b border-gray-800">
                    <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400">Total Changes:</span>
                            <span className="font-semibold text-white">{diffResult.summary.totalChanges}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-green-500 rounded"></span>
                            <span className="text-gray-400">Additions:</span>
                            <span className="font-semibold text-green-400">{diffResult.summary.additions}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-red-500 rounded"></span>
                            <span className="text-gray-400">Deletions:</span>
                            <span className="font-semibold text-red-400">{diffResult.summary.deletions}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-yellow-500 rounded"></span>
                            <span className="text-gray-400">Modifications:</span>
                            <span className="font-semibold text-yellow-400">{diffResult.summary.modifications}</span>
                        </div>
                        <div className="ml-auto text-gray-500 text-xs">
                            Computed in {diffResult.metadata.computationTimeMs.toFixed(2)}ms
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 overflow-hidden p-6">
                {error && (
                    <div className="mb-4 bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-red-400">Error</h3>
                            <p className="text-sm text-red-300 mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {isComputing && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                            <p className="text-gray-400">Computing differences...</p>
                        </div>
                    </div>
                )}

                {!isComputing && !rightResponse && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <GitCompare className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-white mb-2">Select a Response to Compare</h2>
                            <p className="text-gray-400 mb-6">Choose from history or paste manual input</p>
                            <button
                                onClick={() => setShowSourceSelector(true)}
                                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                            >
                                Select Comparison Source
                            </button>
                        </div>
                    </div>
                )}

                {!isComputing && leftResponse && rightResponse && diffResult && (
                    <SideBySidePanel
                        leftResponse={leftResponse}
                        rightResponse={rightResponse}
                        diffResult={diffResult}
                        expandedPaths={expandedPaths}
                        onToggleExpand={togglePath}
                    />
                )}
            </div>

            {/* Source Selector Modal */}
            {showSourceSelector && leftResponse && (
                <SourceSelector
                    currentResponse={leftResponse}
                    onSourceSelected={handleSourceSelected}
                    onClose={() => setShowSourceSelector(false)}
                />
            )}
        </div>
    );
}

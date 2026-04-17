import { useRef, useEffect } from 'react';
import { ResponsePanel } from './ResponsePanel';
import type { ApiResponseData, DiffResult } from '../../types/diff';

interface SideBySidePanelProps {
    leftResponse: ApiResponseData;
    rightResponse: ApiResponseData;
    diffResult: DiffResult;
    expandedPaths: Set<string>;
    onToggleExpand: (path: string) => void;
}

export function SideBySidePanel({
    leftResponse,
    rightResponse,
    diffResult,
    expandedPaths,
    onToggleExpand,
}: SideBySidePanelProps) {
    const leftPanelRef = useRef<HTMLDivElement>(null);
    const rightPanelRef = useRef<HTMLDivElement>(null);
    const isSyncing = useRef(false);

    // Synchronized scrolling
    useEffect(() => {
        const leftPanel = leftPanelRef.current;
        const rightPanel = rightPanelRef.current;

        if (!leftPanel || !rightPanel) return;

        const handleLeftScroll = () => {
            if (isSyncing.current) return;
            isSyncing.current = true;
            rightPanel.scrollTop = leftPanel.scrollTop;
            rightPanel.scrollLeft = leftPanel.scrollLeft;
            requestAnimationFrame(() => {
                isSyncing.current = false;
            });
        };

        const handleRightScroll = () => {
            if (isSyncing.current) return;
            isSyncing.current = true;
            leftPanel.scrollTop = rightPanel.scrollTop;
            leftPanel.scrollLeft = rightPanel.scrollLeft;
            requestAnimationFrame(() => {
                isSyncing.current = false;
            });
        };

        leftPanel.addEventListener('scroll', handleLeftScroll);
        rightPanel.addEventListener('scroll', handleRightScroll);

        return () => {
            leftPanel.removeEventListener('scroll', handleLeftScroll);
            rightPanel.removeEventListener('scroll', handleRightScroll);
        };
    }, []);

    // Get changes for each side
    const leftChanges = diffResult.changes.filter(
        change => change.type === 'removed' || change.type === 'modified'
    );
    const rightChanges = diffResult.changes.filter(
        change => change.type === 'added' || change.type === 'modified'
    );

    return (
        <div className="flex-1 flex gap-4 overflow-hidden">
            <div ref={leftPanelRef} className="flex-1 overflow-auto">
                <ResponsePanel
                    response={leftResponse}
                    changes={leftChanges}
                    side="left"
                    expandedPaths={expandedPaths}
                    onToggleExpand={onToggleExpand}
                />
            </div>

            <div ref={rightPanelRef} className="flex-1 overflow-auto">
                <ResponsePanel
                    response={rightResponse}
                    changes={rightChanges}
                    side="right"
                    expandedPaths={expandedPaths}
                    onToggleExpand={onToggleExpand}
                />
            </div>
        </div>
    );
}

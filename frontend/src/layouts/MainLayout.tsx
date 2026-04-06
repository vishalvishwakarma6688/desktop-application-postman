import Sidebar from '@/components/Sidebar';
import RequestEditor from '@/components/RequestEditor';
import NewRequestEditor from '@/components/NewRequestEditor';
import TabBar from '@/components/TabBar';
import AppHeader from '@/components/AppHeader';
import AiPanel from '@/components/AiPanel';
import { useTabStore } from '@/store/useTabStore';
import { useRef, useState, useCallback } from 'react';

export default function MainLayout() {
    const { tabs, activeTabId } = useTabStore();
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    const [sidebarWidth, setSidebarWidth] = useState(256);
    const isDragging = useRef(false);

    const handleDragStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        const onMove = (ev: MouseEvent) => {
            if (!isDragging.current) return;
            setSidebarWidth(Math.min(Math.max(ev.clientX, 180), 480));
        };
        const onUp = () => {
            isDragging.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }, []);

    return (
        <div className="flex h-full flex-col bg-gray-900">
            {/* Top app bar */}
            <AppHeader />

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div style={{ width: sidebarWidth }} className="flex-shrink-0 overflow-hidden">
                    <Sidebar />
                </div>

                {/* Resize handle — wider hit area with visual indicator */}
                <div
                    onMouseDown={handleDragStart}
                    className="group relative w-2 shrink-0 cursor-col-resize bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-gray-700 group-hover:bg-orange-500/60 transition-colors" />
                </div>

                {/* Main content */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    <TabBar />

                    {activeTab ? (
                        <div className="flex flex-1 flex-col overflow-hidden">
                            {activeTab.type === 'new-request' && activeTab.unsavedRequest ? (
                                <NewRequestEditor
                                    tabId={activeTab.id}
                                    initialData={activeTab.unsavedRequest}
                                />
                            ) : activeTab.type === 'request' && activeTab.request ? (
                                <RequestEditor />
                            ) : null}
                        </div>
                    ) : (
                        <div className="flex flex-1 items-center justify-center bg-gray-900">
                            <div className="text-center">
                                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-800">
                                    <svg className="h-10 w-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="mb-2 text-lg font-semibold text-gray-300">No Request Open</h3>
                                <p className="text-sm text-gray-500">Select a request from the sidebar to get started</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <AiPanel />
        </div>
    );
}

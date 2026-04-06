import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { workspaceApi } from '@/features/workspace/api';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import MainLayout from '@/layouts/MainLayout';

export default function DashboardPage() {
    const { setWorkspaces, setCurrentWorkspace, currentWorkspace } = useWorkspaceStore();

    const { data: workspacesData, isLoading } = useQuery({
        queryKey: ['workspaces'],
        queryFn: workspaceApi.getAll,
    });

    useEffect(() => {
        if (workspacesData?.data) {
            setWorkspaces(workspacesData.data);

            // Set first workspace as current if none selected
            if (!currentWorkspace && workspacesData.data.length > 0) {
                setCurrentWorkspace(workspacesData.data[0]);
            }
        }
    }, [workspacesData, setWorkspaces, setCurrentWorkspace, currentWorkspace]);

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-gray-400">Loading...</div>
            </div>
        );
    }

    return <MainLayout />;
}

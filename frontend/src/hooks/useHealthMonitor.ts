import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useRequestStore } from '@/store/useRequestStore';
import { workspaceApi } from '@/features/workspace/api';
import { requestApi } from '@/features/requests/api';
import { resolveVariableValue } from '@/utils/vaultUtils';
import { Request, EnvironmentVariable } from '@/types';

const isDesktop = typeof window !== 'undefined' && !!window.electronAPI;

export function useHealthMonitor() {
    const queryClient = useQueryClient();
    const { currentWorkspace } = useWorkspaceStore();
    const { activeEnvironment } = useRequestStore();
    const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Function to collect all monitored requests, resolve their environment variables,
    // and register them with Electron's background scheduler.
    const syncMonitors = async () => {
        if (!isDesktop || !currentWorkspace) return;

        try {
            // 1. Fetch workspace data (collections with nested requests)
            const res = await workspaceApi.getSyncData(currentWorkspace._id);
            if (!res.success || !res.data) return;

            const collections = res.data.collections || [];
            const monitoredReqs: any[] = [];

            // 2. Gather active environment variables for resolution
            const envVars: EnvironmentVariable[] = activeEnvironment?.variables || [];
            const varMap: Record<string, string> = {};
            
            // Resolve all environment variables (including Vault variables)
            await Promise.all(
                envVars.map(async (v) => {
                    if (v.enabled && v.key) {
                        varMap[v.key] = await resolveVariableValue(v);
                    }
                })
            );

            // Helper to substitute placeholders like {{BASE_URL}}
            const resolvePlaceholders = (text: string): string => {
                if (!text) return '';
                return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
                    return varMap[key] !== undefined ? varMap[key] : `{{${key}}}`;
                });
            };

            // 3. Extract and resolve variables in monitored requests
            for (const col of collections) {
                const reqs: Request[] = col.requests || [];
                for (const req of reqs) {
                    if (req.monitorSettings?.isMonitored) {
                        // Resolve dynamic variables in URL, headers, and query parameters
                        const resolvedUrl = resolvePlaceholders(req.url);
                        
                        const resolvedHeaders = (req.headers || []).map(h => ({
                            ...h,
                            key: resolvePlaceholders(h.key),
                            value: resolvePlaceholders(h.value)
                        }));

                        const resolvedQueryParams = (req.queryParams || []).map(q => ({
                            ...q,
                            key: resolvePlaceholders(q.key),
                            value: resolvePlaceholders(q.value)
                        }));

                        monitoredReqs.push({
                            id: req._id,
                            name: req.name,
                            method: req.method,
                            url: resolvedUrl,
                            headers: resolvedHeaders,
                            queryParams: resolvedQueryParams,
                            body: req.body,
                            auth: req.auth,
                            interval: req.monitorSettings.interval || 60,
                            lastStatus: req.monitorSettings.lastStatus || 'unknown'
                        });
                    }
                }
            }

            // 4. Register with Electron main process
            await window.electronAPI.invoke('health:register', { requests: monitoredReqs });
        } catch (err) {
            console.error('[HEALTH HOOK] Failed to sync monitors:', err);
        }
    };

    // Debounced trigger to sync monitors list
    const triggerSync = () => {
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(syncMonitors, 1000); // 1s debounce
    };

    // Trigger sync whenever workspace, active environment, or query status changes
    useEffect(() => {
        triggerSync();
        return () => {
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        };
    }, [currentWorkspace?._id, activeEnvironment?._id]);

    // Listen to background check status update events from Electron
    useEffect(() => {
        if (!isDesktop) return;

        const handleStatusChange = async (eventData: any) => {
            const { requestId, status, checkedAt, responseTime } = eventData;
            console.log(`[HEALTH HOOK] Received status change for ${requestId}: ${status} (${responseTime}ms)`);

            // 1. Update React Query Cache immediately for real-time sidebar/tab highlights
            queryClient.setQueriesData({ queryKey: ['requests'] }, (old: any) => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: old.data.map((r: Request) => {
                        if (r._id === requestId) {
                            return {
                                ...r,
                                monitorSettings: {
                                    ...r.monitorSettings,
                                    isMonitored: true,
                                    lastStatus: status,
                                    lastChecked: checkedAt,
                                    lastResponseTime: responseTime
                                }
                            };
                        }
                        return r;
                    })
                };
            });

            // Also update active tab cache if the active request is the one checked
            queryClient.invalidateQueries({ queryKey: ['requests'] });

            // 2. Persist status changes to MongoDB so state survives application restarts
            try {
                const reqRes = await requestApi.getById(requestId);
                if (reqRes.success && reqRes.data) {
                    const currentSettings = reqRes.data.monitorSettings || { isMonitored: true, interval: 60 };
                    
                    // Only update DB if the status actually changed to minimize redundant DB calls
                    if (currentSettings.lastStatus !== status || !currentSettings.lastChecked) {
                        await requestApi.update(requestId, {
                            monitorSettings: {
                                ...currentSettings,
                                lastStatus: status,
                                lastChecked: checkedAt,
                                lastResponseTime: responseTime
                            }
                        });
                    }
                }
            } catch (err) {
                console.error('[HEALTH HOOK] Failed to persist health state:', err);
            }
        };

        window.electronAPI.receive('health:status-change', handleStatusChange);

        return () => {
            // Remove the listener using custom cleanup since contextBridge handles it
            // ipcRenderer.on cleanup is handled by unmounting in the desktop layer
        };
    }, [queryClient]);

    return {
        refetchMonitors: syncMonitors
    };
}

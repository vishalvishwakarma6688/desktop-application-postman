import { create } from 'zustand';

export interface StressTick {
    completed: number;
    failed: number;
    latencies: number[];
}

export interface StressFinalReport {
    totalCompleted: number;
    totalFailed: number;
    errors: Record<string, number>;
    durationMs: number;
    error?: string;
}

interface StressState {
    isRunning: boolean;
    completedCount: number;
    failedCount: number;
    latenciesHistory: number[]; // Latency for each tick
    rpsHistory: number[]; // RPS for each tick
    errors: Record<string, number>;
    durationMs: number;
    testCompleted: boolean;
    error: string | null;

    setRunning: (running: boolean) => void;
    addTick: (tick: StressTick) => void;
    completeTest: (report: StressFinalReport) => void;
    reset: () => void;
}

export const useStressStore = create<StressState>((set) => ({
    isRunning: false,
    completedCount: 0,
    failedCount: 0,
    latenciesHistory: [],
    rpsHistory: [],
    errors: {},
    durationMs: 0,
    testCompleted: false,
    error: null,

    setRunning: (isRunning) => set((_state) => {
        if (isRunning) {
            // Reset statistics on fresh test start
            return {
                isRunning,
                completedCount: 0,
                failedCount: 0,
                latenciesHistory: [],
                rpsHistory: [],
                errors: {},
                durationMs: 0,
                testCompleted: false,
                error: null,
            };
        }
        return { isRunning };
    }),

    addTick: (tick) => set((state) => {
        const totalTickRequests = tick.completed + tick.failed;
        // RPS = completed requests in 200ms tick * 5
        const currentRps = totalTickRequests * 5;

        // Calculate average latency for this tick
        const avgLatency = tick.latencies.length > 0
            ? Math.round(tick.latencies.reduce((a, b) => a + b, 0) / tick.latencies.length)
            : 0;

        return {
            completedCount: state.completedCount + tick.completed,
            failedCount: state.failedCount + tick.failed,
            rpsHistory: [...state.rpsHistory, currentRps],
            latenciesHistory: [...state.latenciesHistory, avgLatency],
        };
    }),

    completeTest: (report) => set((state) => ({
        isRunning: false,
        testCompleted: true,
        completedCount: report.totalCompleted ?? state.completedCount,
        failedCount: report.totalFailed ?? state.failedCount,
        errors: report.errors ?? {},
        durationMs: report.durationMs ?? 0,
        error: report.error ?? null,
    })),

    reset: () => set({
        isRunning: false,
        completedCount: 0,
        failedCount: 0,
        latenciesHistory: [],
        rpsHistory: [],
        errors: {},
        durationMs: 0,
        testCompleted: false,
        error: null,
    }),
}));

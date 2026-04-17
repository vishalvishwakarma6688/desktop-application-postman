import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type {
    ApiResponseData,
    DiffResult,
    DiffViewerContextValue,
    IgnoreRule,
} from '../types/diff';
import { DiffEngine } from '../services/diffEngine';

const DiffViewerContext = createContext<DiffViewerContextValue | undefined>(undefined);

interface DiffViewerProviderProps {
    children: React.ReactNode;
    initialResponse?: ApiResponseData;
}

export function DiffViewerProvider({ children, initialResponse }: DiffViewerProviderProps) {
    const [leftResponse, setLeftResponse] = useState<ApiResponseData | null>(
        initialResponse || null
    );
    const [rightResponse, setRightResponse] = useState<ApiResponseData | null>(null);
    const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
    const [ignoreRules, setIgnoreRules] = useState<IgnoreRule[]>([]);
    const [isComputing, setIsComputing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

    // Load ignore rules from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem('diffViewer:ignoreRules');
            if (saved) {
                setIgnoreRules(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Failed to load ignore rules:', e);
        }
    }, []);

    // Save ignore rules to localStorage when they change
    useEffect(() => {
        try {
            localStorage.setItem('diffViewer:ignoreRules', JSON.stringify(ignoreRules));
        } catch (e) {
            console.error('Failed to save ignore rules:', e);
        }
    }, [ignoreRules]);

    const computeDiff = useCallback(() => {
        if (!leftResponse || !rightResponse) {
            setError('Both responses must be selected for comparison');
            return;
        }

        setIsComputing(true);
        setError(null);

        try {
            // Compute diff with default options
            const result = DiffEngine.compute(leftResponse, rightResponse, {
                ignoreWhitespace: false,
                ignoreFormatting: false,
                deepCompare: true,
            });

            // Apply ignore rules
            const filteredResult = DiffEngine.applyIgnoreRules(result, ignoreRules);

            setDiffResult(filteredResult);
        } catch (e) {
            console.error('Diff computation failed:', e);
            setError(e instanceof Error ? e.message : 'Failed to compute diff');
            setDiffResult(null);
        } finally {
            setIsComputing(false);
        }
    }, [leftResponse, rightResponse, ignoreRules]);

    // Auto-compute diff when responses or ignore rules change
    useEffect(() => {
        if (leftResponse && rightResponse) {
            computeDiff();
        }
    }, [leftResponse, rightResponse, ignoreRules, computeDiff]);

    const addIgnoreRule = useCallback((rule: IgnoreRule) => {
        setIgnoreRules(prev => [...prev, rule]);
    }, []);

    const removeIgnoreRule = useCallback((ruleId: string) => {
        setIgnoreRules(prev => prev.filter(rule => rule.id !== ruleId));
    }, []);

    const toggleIgnoreRule = useCallback((ruleId: string) => {
        setIgnoreRules(prev =>
            prev.map(rule =>
                rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
            )
        );
    }, []);

    const togglePath = useCallback((path: string) => {
        setExpandedPaths(prev => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    }, []);

    const reset = useCallback(() => {
        setLeftResponse(initialResponse || null);
        setRightResponse(null);
        setDiffResult(null);
        setError(null);
        setExpandedPaths(new Set());
    }, [initialResponse]);

    const value: DiffViewerContextValue = {
        leftResponse,
        rightResponse,
        diffResult,
        ignoreRules,
        isComputing,
        error,
        expandedPaths,
        setLeftResponse,
        setRightResponse,
        setIgnoreRules,
        addIgnoreRule,
        removeIgnoreRule,
        toggleIgnoreRule,
        computeDiff,
        togglePath,
        reset,
    };

    return (
        <DiffViewerContext.Provider value={value}>
            {children}
        </DiffViewerContext.Provider>
    );
}

export function useDiffViewer() {
    const context = useContext(DiffViewerContext);
    if (context === undefined) {
        throw new Error('useDiffViewer must be used within a DiffViewerProvider');
    }
    return context;
}

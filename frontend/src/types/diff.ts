// Types for the Live API Diff Viewer feature

export interface DiffResult {
    id: string;
    leftResponseId: string;
    rightResponseId: string;
    changes: Change[];
    summary: DiffSummary;
    metadata: DiffMetadata;
    computedAt: number;
}

export interface Change {
    id: string;
    path: string[];
    pathString: string; // e.g., "data.users[0].name"
    type: 'added' | 'removed' | 'modified';
    leftValue?: any;
    rightValue?: any;
    isStructural: boolean;
    lineNumber?: number;
}

export interface DiffSummary {
    totalChanges: number;
    additions: number;
    deletions: number;
    modifications: number;
}

export interface DiffMetadata {
    ignoreRulesApplied: IgnoreRule[];
    options: DiffOptions;
    computationTimeMs: number;
}

export interface DiffOptions {
    ignoreWhitespace: boolean;
    ignoreFormatting: boolean;
    deepCompare: boolean;
}

export interface IgnoreRule {
    id: string;
    pattern: string;
    enabled: boolean;
}

export interface ComparisonSource {
    type: 'history' | 'environment' | 'manual';
    data: ApiResponseData;
    label: string;
    id?: string;
}

export interface ApiResponseData {
    id: string;
    requestId?: string;
    timestamp: number;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: any;
    contentType: string;
    duration: number;
    environment?: string;
}

export interface DiffViewerState {
    leftResponse: ApiResponseData | null;
    rightResponse: ApiResponseData | null;
    diffResult: DiffResult | null;
    ignoreRules: IgnoreRule[];
    isComputing: boolean;
    error: string | null;
    expandedPaths: Set<string>;
}

export interface DiffViewerContextValue extends DiffViewerState {
    setLeftResponse: (response: ApiResponseData | null) => void;
    setRightResponse: (response: ApiResponseData | null) => void;
    setIgnoreRules: (rules: IgnoreRule[]) => void;
    addIgnoreRule: (rule: IgnoreRule) => void;
    removeIgnoreRule: (ruleId: string) => void;
    toggleIgnoreRule: (ruleId: string) => void;
    computeDiff: () => void;
    togglePath: (path: string) => void;
    reset: () => void;
}

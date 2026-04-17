import type {
    ApiResponseData,
    Change,
    DiffOptions,
    DiffResult,
    DiffSummary,
    IgnoreRule,
} from '../types/diff';

/**
 * DiffEngine - Core service for computing differences between API responses
 */
export class DiffEngine {
    /**
     * Compute differences between two API responses
     */
    static compute(
        left: ApiResponseData,
        right: ApiResponseData,
        options: DiffOptions = {
            ignoreWhitespace: false,
            ignoreFormatting: false,
            deepCompare: true,
        }
    ): DiffResult {
        const startTime = performance.now();

        // Parse response bodies
        const leftBody = this.parseBody(left.body, left.contentType);
        const rightBody = this.parseBody(right.body, right.contentType);

        // Compute changes
        const changes = this.computeDiff(leftBody, rightBody, [], options);

        // Generate summary
        const summary = this.generateSummary(changes);

        const computationTimeMs = performance.now() - startTime;

        return {
            id: `diff-${Date.now()}`,
            leftResponseId: left.id,
            rightResponseId: right.id,
            changes,
            summary,
            metadata: {
                ignoreRulesApplied: [],
                options,
                computationTimeMs,
            },
            computedAt: Date.now(),
        };
    }

    /**
     * Parse response body based on content type
     */
    private static parseBody(body: any, contentType: string): any {
        if (typeof body === 'string') {
            try {
                if (contentType.includes('json')) {
                    return JSON.parse(body);
                }
            } catch (e) {
                // Return as-is if parsing fails
                return body;
            }
        }
        return body;
    }

    /**
     * Recursive diff computation using tree-walking algorithm
     */
    private static computeDiff(
        left: any,
        right: any,
        path: string[] = [],
        options: DiffOptions
    ): Change[] {
        const changes: Change[] = [];

        // Type mismatch - structural change
        if (this.getType(left) !== this.getType(right)) {
            changes.push(this.createChange(path, 'modified', left, right, true));
            return changes;
        }

        // Both are objects
        if (this.isObject(left) && this.isObject(right)) {
            const allKeys = new Set([...Object.keys(left), ...Object.keys(right)]);

            for (const key of allKeys) {
                const newPath = [...path, key];

                if (!(key in left)) {
                    // Key added in right
                    changes.push(this.createChange(newPath, 'added', undefined, right[key], true));
                } else if (!(key in right)) {
                    // Key removed from left
                    changes.push(this.createChange(newPath, 'removed', left[key], undefined, true));
                } else {
                    // Key exists in both - recurse
                    changes.push(...this.computeDiff(left[key], right[key], newPath, options));
                }
            }
        }
        // Both are arrays
        else if (Array.isArray(left) && Array.isArray(right)) {
            changes.push(...this.compareArrays(left, right, path, options));
        }
        // Primitive values
        else {
            const leftNormalized = options.ignoreWhitespace && typeof left === 'string'
                ? this.normalizeWhitespace(left)
                : left;
            const rightNormalized = options.ignoreWhitespace && typeof right === 'string'
                ? this.normalizeWhitespace(right)
                : right;

            if (leftNormalized !== rightNormalized) {
                changes.push(this.createChange(path, 'modified', left, right, false));
            }
        }

        return changes;
    }

    /**
     * Compare two arrays and detect changes
     */
    private static compareArrays(
        left: any[],
        right: any[],
        path: string[],
        options: DiffOptions
    ): Change[] {
        const changes: Change[] = [];
        const maxLen = Math.max(left.length, right.length);

        for (let i = 0; i < maxLen; i++) {
            const newPath = [...path, i.toString()];

            if (i >= left.length) {
                // Element added in right
                changes.push(this.createChange(newPath, 'added', undefined, right[i], true));
            } else if (i >= right.length) {
                // Element removed from left
                changes.push(this.createChange(newPath, 'removed', left[i], undefined, true));
            } else {
                // Element exists in both - recurse
                changes.push(...this.computeDiff(left[i], right[i], newPath, options));
            }
        }

        return changes;
    }

    /**
     * Create a Change object
     */
    private static createChange(
        path: string[],
        type: 'added' | 'removed' | 'modified',
        leftValue: any,
        rightValue: any,
        isStructural: boolean
    ): Change {
        return {
            id: `change-${path.join('.')}-${Date.now()}-${Math.random()}`,
            path,
            pathString: this.pathToString(path),
            type,
            leftValue,
            rightValue,
            isStructural,
        };
    }

    /**
     * Convert path array to string representation
     */
    private static pathToString(path: string[]): string {
        if (path.length === 0) return 'root';

        return path.reduce((acc, segment, index) => {
            // Check if segment is array index
            if (/^\d+$/.test(segment)) {
                return `${acc}[${segment}]`;
            }
            // Regular property
            return index === 0 ? segment : `${acc}.${segment}`;
        }, '');
    }

    /**
     * Generate summary statistics from changes
     */
    private static generateSummary(changes: Change[]): DiffSummary {
        const summary: DiffSummary = {
            totalChanges: changes.length,
            additions: 0,
            deletions: 0,
            modifications: 0,
        };

        for (const change of changes) {
            switch (change.type) {
                case 'added':
                    summary.additions++;
                    break;
                case 'removed':
                    summary.deletions++;
                    break;
                case 'modified':
                    summary.modifications++;
                    break;
            }
        }

        return summary;
    }

    /**
     * Check if value is a plain object
     */
    private static isObject(value: any): boolean {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    /**
     * Get type of value for comparison
     */
    private static getType(value: any): string {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (Array.isArray(value)) return 'array';
        return typeof value;
    }

    /**
     * Normalize whitespace in strings
     */
    private static normalizeWhitespace(str: string): string {
        return str.replace(/\s+/g, ' ').trim();
    }

    /**
     * Apply ignore rules to filter out changes
     */
    static applyIgnoreRules(diffResult: DiffResult, rules: IgnoreRule[]): DiffResult {
        const enabledRules = rules.filter(rule => rule.enabled);

        if (enabledRules.length === 0) {
            return diffResult;
        }

        const filteredChanges = diffResult.changes.filter(change => {
            return !this.matchesAnyRule(change.pathString, enabledRules);
        });

        return {
            ...diffResult,
            changes: filteredChanges,
            summary: this.generateSummary(filteredChanges),
            metadata: {
                ...diffResult.metadata,
                ignoreRulesApplied: enabledRules,
            },
        };
    }

    /**
     * Check if path matches any ignore rule pattern
     */
    private static matchesAnyRule(path: string, rules: IgnoreRule[]): boolean {
        return rules.some(rule => this.matchesPattern(path, rule.pattern));
    }

    /**
     * Check if path matches a pattern (supports wildcards)
     */
    private static matchesPattern(path: string, pattern: string): boolean {
        // Convert pattern to regex
        // * matches any single segment
        // ** matches any number of segments
        const regexPattern = pattern
            .replace(/\./g, '\\.')
            .replace(/\[/g, '\\[')
            .replace(/\]/g, '\\]')
            .replace(/\*\*/g, '___DOUBLE_WILDCARD___')
            .replace(/\*/g, '[^.\\[\\]]+')
            .replace(/___DOUBLE_WILDCARD___/g, '.*');

        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(path);
    }
}

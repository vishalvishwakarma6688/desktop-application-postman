/**
 * Operational Transformation (OT) Client
 * Handles conflict-free concurrent editing
 */

export interface Operation {
    type: 'insert' | 'delete' | 'retain';
    position: number;
    text?: string;
    length?: number;
}

export interface CursorPosition {
    line: number;
    column: number;
}

export interface Selection {
    start: CursorPosition;
    end: CursorPosition;
}

/**
 * Transform two operations against each other
 */
export function transform(op1: Operation, op2: Operation): { op1Prime: Operation; op2Prime: Operation } {
    // Insert vs Insert
    if (op1.type === 'insert' && op2.type === 'insert') {
        if (op1.position < op2.position) {
            return {
                op1Prime: op1,
                op2Prime: { ...op2, position: op2.position + (op1.text?.length || 0) }
            };
        } else if (op1.position > op2.position) {
            return {
                op1Prime: { ...op1, position: op1.position + (op2.text?.length || 0) },
                op2Prime: op2
            };
        } else {
            // Same position - use tiebreaker
            return {
                op1Prime: op1,
                op2Prime: { ...op2, position: op2.position + (op1.text?.length || 0) }
            };
        }
    }

    // Insert vs Delete
    if (op1.type === 'insert' && op2.type === 'delete') {
        if (op1.position <= op2.position) {
            return {
                op1Prime: op1,
                op2Prime: { ...op2, position: op2.position + (op1.text?.length || 0) }
            };
        } else if (op1.position >= op2.position + (op2.length || 0)) {
            return {
                op1Prime: { ...op1, position: op1.position - (op2.length || 0) },
                op2Prime: op2
            };
        } else {
            // Insert position is within delete range
            return {
                op1Prime: { ...op1, position: op2.position },
                op2Prime: op2
            };
        }
    }

    // Delete vs Insert
    if (op1.type === 'delete' && op2.type === 'insert') {
        if (op2.position <= op1.position) {
            return {
                op1Prime: { ...op1, position: op1.position + (op2.text?.length || 0) },
                op2Prime: op2
            };
        } else if (op2.position >= op1.position + (op1.length || 0)) {
            return {
                op1Prime: op1,
                op2Prime: { ...op2, position: op2.position - (op1.length || 0) }
            };
        } else {
            return {
                op1Prime: op1,
                op2Prime: { ...op2, position: op1.position }
            };
        }
    }

    // Delete vs Delete
    if (op1.type === 'delete' && op2.type === 'delete') {
        const op1Length = op1.length || 0;
        const op2Length = op2.length || 0;

        if (op1.position + op1Length <= op2.position) {
            return {
                op1Prime: op1,
                op2Prime: { ...op2, position: op2.position - op1Length }
            };
        } else if (op2.position + op2Length <= op1.position) {
            return {
                op1Prime: { ...op1, position: op1.position - op2Length },
                op2Prime: op2
            };
        } else {
            // Overlapping deletes - simplified handling
            const start1 = op1.position;
            const end1 = op1.position + op1Length;
            const start2 = op2.position;
            const end2 = op2.position + op2Length;

            if (start1 <= start2 && end1 >= end2) {
                // op1 contains op2
                return {
                    op1Prime: { ...op1, length: op1Length - op2Length },
                    op2Prime: { type: 'retain', position: 0, length: 0 }
                };
            } else if (start2 <= start1 && end2 >= end1) {
                // op2 contains op1
                return {
                    op1Prime: { type: 'retain', position: 0, length: 0 },
                    op2Prime: { ...op2, length: op2Length - op1Length }
                };
            }
        }
    }

    // Default: no transformation needed
    return { op1Prime: op1, op2Prime: op2 };
}

/**
 * Apply an operation to a text string
 */
export function applyOperation(text: string, operation: Operation): string {
    switch (operation.type) {
        case 'insert':
            return text.slice(0, operation.position) +
                (operation.text || '') +
                text.slice(operation.position);

        case 'delete':
            return text.slice(0, operation.position) +
                text.slice(operation.position + (operation.length || 0));

        case 'retain':
            return text;

        default:
            return text;
    }
}

/**
 * Transform a cursor position based on an operation
 */
export function transformCursor(cursorPosition: number, operation: Operation): number {
    switch (operation.type) {
        case 'insert':
            if (cursorPosition > operation.position) {
                return cursorPosition + (operation.text?.length || 0);
            }
            return cursorPosition;

        case 'delete':
            const deleteLength = operation.length || 0;
            if (cursorPosition > operation.position + deleteLength) {
                return cursorPosition - deleteLength;
            } else if (cursorPosition > operation.position) {
                return operation.position;
            }
            return cursorPosition;

        case 'retain':
            return cursorPosition;

        default:
            return cursorPosition;
    }
}

/**
 * Transform a selection range based on an operation
 */
export function transformSelection(
    selection: Selection | null,
    operation: Operation
): Selection | null {
    if (!selection) return null;

    // For simplicity, transform both start and end as cursor positions
    // In a real implementation, you'd handle this more carefully
    const startOffset = selection.start.line * 1000 + selection.start.column;
    const endOffset = selection.end.line * 1000 + selection.end.column;

    const newStartOffset = transformCursor(startOffset, operation);
    const newEndOffset = transformCursor(endOffset, operation);

    return {
        start: {
            line: Math.floor(newStartOffset / 1000),
            column: newStartOffset % 1000
        },
        end: {
            line: Math.floor(newEndOffset / 1000),
            column: newEndOffset % 1000
        }
    };
}

/**
 * Validate an operation
 */
export function validateOperation(operation: Operation): boolean {
    if (!operation || typeof operation !== 'object') return false;

    switch (operation.type) {
        case 'insert':
            return typeof operation.position === 'number' &&
                operation.position >= 0 &&
                typeof operation.text === 'string' &&
                operation.text.length > 0;

        case 'delete':
            return typeof operation.position === 'number' &&
                operation.position >= 0 &&
                typeof operation.length === 'number' &&
                operation.length > 0;

        case 'retain':
            return typeof operation.length === 'number' &&
                operation.length >= 0;

        default:
            return false;
    }
}

/**
 * Generate an operation from a text change
 */
export function generateOperation(
    oldText: string,
    newText: string,
    cursorPosition: number
): Operation | null {
    if (oldText === newText) return null;

    // Simple diff: check if it's an insertion or deletion
    if (newText.length > oldText.length) {
        // Insertion
        const insertPos = cursorPosition - (newText.length - oldText.length);
        const insertedText = newText.slice(insertPos, cursorPosition);
        return {
            type: 'insert',
            position: insertPos,
            text: insertedText
        };
    } else if (newText.length < oldText.length) {
        // Deletion
        const deleteLength = oldText.length - newText.length;
        return {
            type: 'delete',
            position: cursorPosition,
            length: deleteLength
        };
    }

    // If lengths are same but content different, treat as delete + insert
    // For simplicity, we'll just return null for now
    return null;
}

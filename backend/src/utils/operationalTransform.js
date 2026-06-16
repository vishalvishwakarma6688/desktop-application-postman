/**
 * Operational Transformation utilities for collaborative editing
 * Based on OT algorithm for conflict-free concurrent editing
 */

/**
 * Operation types:
 * - insert: { type: 'insert', position: number, text: string }
 * - delete: { type: 'delete', position: number, length: number }
 * - retain: { type: 'retain', length: number }
 */

/**
 * Transform two operations against each other
 * Returns transformed versions of both operations
 * @param {Object} op1 - First operation (from client A)
 * @param {Object} op2 - Second operation (from client B)
 * @returns {Object} - { op1Prime, op2Prime } - Transformed operations
 */
export function transform(op1, op2) {
    // Insert vs Insert
    if (op1.type === 'insert' && op2.type === 'insert') {
        if (op1.position < op2.position) {
            return {
                op1Prime: op1,
                op2Prime: { ...op2, position: op2.position + op1.text.length }
            };
        } else if (op1.position > op2.position) {
            return {
                op1Prime: { ...op1, position: op1.position + op2.text.length },
                op2Prime: op2
            };
        } else {
            // Same position - use tiebreaker (could be user ID, timestamp, etc.)
            return {
                op1Prime: op1,
                op2Prime: { ...op2, position: op2.position + op1.text.length }
            };
        }
    }

    // Insert vs Delete
    if (op1.type === 'insert' && op2.type === 'delete') {
        if (op1.position <= op2.position) {
            return {
                op1Prime: op1,
                op2Prime: { ...op2, position: op2.position + op1.text.length }
            };
        } else if (op1.position >= op2.position + op2.length) {
            return {
                op1Prime: { ...op1, position: op1.position - op2.length },
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
                op1Prime: { ...op1, position: op1.position + op2.text.length },
                op2Prime: op2
            };
        } else if (op2.position >= op1.position + op1.length) {
            return {
                op1Prime: op1,
                op2Prime: { ...op2, position: op2.position - op1.length }
            };
        } else {
            // Insert position is within delete range
            return {
                op1Prime: op1,
                op2Prime: { ...op2, position: op1.position }
            };
        }
    }

    // Delete vs Delete
    if (op1.type === 'delete' && op2.type === 'delete') {
        if (op1.position + op1.length <= op2.position) {
            return {
                op1Prime: op1,
                op2Prime: { ...op2, position: op2.position - op1.length }
            };
        } else if (op2.position + op2.length <= op1.position) {
            return {
                op1Prime: { ...op1, position: op1.position - op2.length },
                op2Prime: op2
            };
        } else {
            // Overlapping deletes
            const start1 = op1.position;
            const end1 = op1.position + op1.length;
            const start2 = op2.position;
            const end2 = op2.position + op2.length;

            if (start1 <= start2 && end1 >= end2) {
                // op1 contains op2
                return {
                    op1Prime: {
                        ...op1,
                        length: op1.length - op2.length
                    },
                    op2Prime: { type: 'retain', length: 0 } // No-op
                };
            } else if (start2 <= start1 && end2 >= end1) {
                // op2 contains op1
                return {
                    op1Prime: { type: 'retain', length: 0 }, // No-op
                    op2Prime: {
                        ...op2,
                        length: op2.length - op1.length
                    }
                };
            } else if (start1 < start2) {
                // Partial overlap, op1 starts first
                const overlap = end1 - start2;
                return {
                    op1Prime: {
                        ...op1,
                        length: op1.length - overlap
                    },
                    op2Prime: {
                        ...op2,
                        position: start1 + (op1.length - overlap),
                        length: op2.length - overlap
                    }
                };
            } else {
                // Partial overlap, op2 starts first
                const overlap = end2 - start1;
                return {
                    op1Prime: {
                        ...op1,
                        position: start2 + (op2.length - overlap),
                        length: op1.length - overlap
                    },
                    op2Prime: {
                        ...op2,
                        length: op2.length - overlap
                    }
                };
            }
        }
    }

    // Default: no transformation needed
    return { op1Prime: op1, op2Prime: op2 };
}

/**
 * Apply an operation to a text string
 * @param {string} text - The original text
 * @param {Object} operation - The operation to apply
 * @returns {string} - The resulting text
 */
export function applyOperation(text, operation) {
    switch (operation.type) {
        case 'insert':
            return text.slice(0, operation.position) +
                operation.text +
                text.slice(operation.position);

        case 'delete':
            return text.slice(0, operation.position) +
                text.slice(operation.position + operation.length);

        case 'retain':
            return text;

        default:
            throw new Error(`Unknown operation type: ${operation.type}`);
    }
}

/**
 * Transform a cursor position based on an operation
 * @param {number} cursorPosition - The cursor position
 * @param {Object} operation - The operation that was applied
 * @returns {number} - The transformed cursor position
 */
export function transformCursor(cursorPosition, operation) {
    switch (operation.type) {
        case 'insert':
            if (cursorPosition > operation.position) {
                return cursorPosition + operation.text.length;
            }
            return cursorPosition;

        case 'delete':
            if (cursorPosition > operation.position + operation.length) {
                return cursorPosition - operation.length;
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
 * @param {Object} selection - { start: number, end: number }
 * @param {Object} operation - The operation that was applied
 * @returns {Object} - The transformed selection
 */
export function transformSelection(selection, operation) {
    if (!selection) return null;

    return {
        start: transformCursor(selection.start, operation),
        end: transformCursor(selection.end, operation)
    };
}

/**
 * Compose two operations into a single operation (optimization)
 * @param {Object} op1 - First operation
 * @param {Object} op2 - Second operation
 * @returns {Object|Array} - Composed operation or array of operations if can't compose
 */
export function compose(op1, op2) {
    // Two sequential inserts at same or adjacent positions
    if (op1.type === 'insert' && op2.type === 'insert' &&
        op2.position === op1.position + op1.text.length) {
        return {
            type: 'insert',
            position: op1.position,
            text: op1.text + op2.text
        };
    }

    // Two sequential deletes at same position
    if (op1.type === 'delete' && op2.type === 'delete' &&
        op2.position === op1.position) {
        return {
            type: 'delete',
            position: op1.position,
            length: op1.length + op2.length
        };
    }

    // Can't compose - return both operations
    return [op1, op2];
}

/**
 * Validate an operation
 * @param {Object} operation - The operation to validate
 * @returns {boolean} - True if valid
 */
export function validateOperation(operation) {
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

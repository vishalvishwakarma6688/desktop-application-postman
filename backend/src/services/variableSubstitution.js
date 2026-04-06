/**
 * Substitute environment variables in a string
 * Replaces {{variableName}} placeholders with actual values
 * 
 * @param {string} text - Text containing variable placeholders
 * @param {Array} variables - Array of {key, value, enabled} objects
 * @returns {string} Text with variables substituted
 */
export const substituteVariables = (text, variables = []) => {
    if (!text || typeof text !== 'string') {
        return text;
    }

    // Create a map of enabled variables
    const variableMap = {};
    variables.forEach(variable => {
        if (variable.enabled !== false) {
            variableMap[variable.key] = variable.value;
        }
    });

    // Replace {{variableName}} with actual values
    return text.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
        const trimmedName = variableName.trim();

        // Support nested object traversal (e.g., {{auth.token}})
        if (trimmedName.includes('.')) {
            const parts = trimmedName.split('.');
            let value = variableMap[parts[0]];

            for (let i = 1; i < parts.length && value !== undefined; i++) {
                try {
                    const parsed = JSON.parse(value);
                    value = parsed[parts[i]];
                } catch {
                    // If not JSON, can't traverse
                    return match;
                }
            }

            return value !== undefined ? value : match;
        }

        // Simple variable substitution
        return variableMap[trimmedName] !== undefined ? variableMap[trimmedName] : match;
    });
};

/**
 * Substitute variables in an object recursively
 * 
 * @param {any} obj - Object to process
 * @param {Array} variables - Array of {key, value, enabled} objects
 * @returns {any} Object with variables substituted
 */
export const substituteVariablesInObject = (obj, variables = []) => {
    if (typeof obj === 'string') {
        return substituteVariables(obj, variables);
    }

    if (Array.isArray(obj)) {
        return obj.map(item => substituteVariablesInObject(item, variables));
    }

    if (obj && typeof obj === 'object') {
        const result = {};
        for (const key in obj) {
            result[key] = substituteVariablesInObject(obj[key], variables);
        }
        return result;
    }

    return obj;
};

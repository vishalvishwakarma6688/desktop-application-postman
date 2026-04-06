import axios from 'axios';
import { substituteVariables, substituteVariablesInObject } from './variableSubstitution.js';

/**
 * Build authentication headers based on auth configuration
 * 
 * @param {Object} auth - Authentication configuration
 * @returns {Object} Headers object with authentication
 */
const buildAuthHeaders = (auth) => {
    const headers = {};

    if (!auth || auth.type === 'none') {
        return headers;
    }

    switch (auth.type) {
        case 'bearer':
            if (auth.bearer && auth.bearer.token) {
                headers['Authorization'] = `Bearer ${auth.bearer.token}`;
            }
            break;

        case 'basic':
            if (auth.basic && auth.basic.username && auth.basic.password) {
                const credentials = Buffer.from(
                    `${auth.basic.username}:${auth.basic.password}`
                ).toString('base64');
                headers['Authorization'] = `Basic ${credentials}`;
            }
            break;

        case 'apikey':
            if (auth.apikey && auth.apikey.key && auth.apikey.value) {
                if (auth.apikey.addTo === 'header') {
                    headers[auth.apikey.key] = auth.apikey.value;
                }
                // If addTo is 'query', it will be handled in query params
            }
            break;

        default:
            break;
    }

    return headers;
};

/**
 * Execute an HTTP request with full configuration
 * 
 * @param {Object} requestConfig - Request configuration
 * @param {Array} environmentVariables - Environment variables for substitution
 * @returns {Object} Response with status, data, headers, executionTime, and error
 */
export const executeRequest = async (requestConfig, environmentVariables = []) => {
    const startTime = Date.now();

    try {
        // Apply variable substitution to request configuration
        let url = substituteVariables(requestConfig.url, environmentVariables);

        // Build headers from request config
        const configHeaders = {};
        if (requestConfig.headers && Array.isArray(requestConfig.headers)) {
            requestConfig.headers.forEach(header => {
                if (header.enabled !== false && header.key) {
                    configHeaders[header.key] = substituteVariables(header.value, environmentVariables);
                }
            });
        }

        // Build auth headers
        const authConfig = substituteVariablesInObject(requestConfig.auth, environmentVariables);
        const authHeaders = buildAuthHeaders(authConfig);

        // Merge headers (auth headers take precedence)
        const headers = { ...configHeaders, ...authHeaders };

        // Build query parameters
        const params = {};
        if (requestConfig.queryParams && Array.isArray(requestConfig.queryParams)) {
            requestConfig.queryParams.forEach(param => {
                if (param.enabled !== false && param.key) {
                    params[param.key] = substituteVariables(param.value, environmentVariables);
                }
            });
        }

        // Add API key to query params if configured
        if (authConfig && authConfig.type === 'apikey' &&
            authConfig.apikey && authConfig.apikey.addTo === 'query') {
            params[authConfig.apikey.key] = authConfig.apikey.value;
        }

        // Build request body
        let data = null;
        let extraHeaders = {};
        if (requestConfig.body && requestConfig.body.type !== 'none') {
            if (requestConfig.body.type === 'json') {
                data = substituteVariablesInObject(requestConfig.body.content, environmentVariables);
            } else if (requestConfig.body.type === 'raw') {
                data = substituteVariables(
                    typeof requestConfig.body.content === 'string'
                        ? requestConfig.body.content
                        : JSON.stringify(requestConfig.body.content),
                    environmentVariables
                );
            } else if (requestConfig.body.type === 'form-data') {
                const { FormData, Blob } = await import('node:buffer').then(() => ({
                    FormData: globalThis.FormData,
                    Blob: globalThis.Blob,
                })).catch(() => ({ FormData: null, Blob: null }));

                // Use axios FormData (works in Node 18+)
                const fd = new (await import('form-data').then(m => m.default).catch(() => {
                    // fallback: build URLSearchParams for text-only
                    return null;
                }))();

                if (fd && Array.isArray(requestConfig.body.content)) {
                    for (const field of requestConfig.body.content) {
                        if (field.enabled === false || !field.key) continue;
                        if (field.type === 'file' && field.fileData) {
                            const buf = Buffer.from(field.fileData, 'base64');
                            fd.append(field.key, buf, { filename: field.fileName || 'file', contentType: field.fileType || 'application/octet-stream' });
                        } else {
                            fd.append(field.key, substituteVariables(field.value || '', environmentVariables));
                        }
                    }
                    data = fd;
                    extraHeaders = fd.getHeaders();
                } else if (Array.isArray(requestConfig.body.content)) {
                    // fallback: plain object
                    const obj = {};
                    requestConfig.body.content.forEach(f => {
                        if (f.enabled !== false && f.key) obj[f.key] = f.value;
                    });
                    data = obj;
                }
            }
        }

        // Execute request
        const response = await axios({
            method: requestConfig.method,
            url,
            headers: { ...headers, ...extraHeaders },
            params,
            data,
            validateStatus: () => true // Accept all status codes
        });

        const endTime = Date.now();

        return {
            status: response.status,
            statusText: response.statusText,
            data: response.data,
            headers: response.headers,
            executionTime: endTime - startTime,
            error: null
        };

    } catch (error) {
        const endTime = Date.now();

        return {
            status: error.response?.status || 0,
            statusText: error.response?.statusText || 'Error',
            data: error.response?.data || null,
            headers: error.response?.headers || {},
            executionTime: endTime - startTime,
            error: {
                message: error.message,
                code: error.code,
                response: error.response ? {
                    status: error.response.status,
                    data: error.response.data
                } : null
            }
        };
    }
};

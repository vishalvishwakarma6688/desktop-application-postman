import { KeyValue, RequestBody, RequestAuth } from '@/types';

interface ParsedCurl {
    method: string;
    url: string;
    headers: KeyValue[];
    body: RequestBody;
    auth: RequestAuth;
}

export function parseCurl(curlCommand: string): ParsedCurl | null {
    try {
        // Remove line breaks and extra spaces
        let curl = curlCommand
            .replace(/\\\n/g, ' ')
            .replace(/\\\r\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        // Remove 'curl' at the start
        curl = curl.replace(/^curl\s+/i, '');

        let method = 'GET';
        let url = '';
        const headers: KeyValue[] = [];
        let bodyContent: any = null;
        let bodyType: 'none' | 'json' | 'raw' | 'form-data' | 'x-www-form-urlencoded' = 'none';
        let auth: RequestAuth = { type: 'none' };

        // Extract method
        const methodMatch = curl.match(/(?:^|\s)(?:-X|--request)\s+['"]?(\w+)['"]?/i);
        if (methodMatch) {
            method = methodMatch[1].toUpperCase();
            curl = curl.replace(methodMatch[0], ' ');
        }

        // Extract URL (handle both quoted and unquoted)
        const urlMatch = curl.match(/(?:^|\s)(?:--location\s+)?['"]([^'"]+)['"]/) ||
            curl.match(/(?:^|\s)(?:--location\s+)?(\S+)/);
        if (urlMatch) {
            url = urlMatch[1];
            // Remove --location flag if present
            curl = curl.replace(/--location\s+/g, '');
        }

        // Extract headers
        const headerRegex = /(?:-H|--header)\s+['"]([^'"]+)['"]/g;
        let headerMatch;
        while ((headerMatch = headerRegex.exec(curl)) !== null) {
            const headerStr = headerMatch[1];
            const colonIndex = headerStr.indexOf(':');
            if (colonIndex > 0) {
                const key = headerStr.substring(0, colonIndex).trim();
                const value = headerStr.substring(colonIndex + 1).trim();

                // Check for Authorization header
                if (key.toLowerCase() === 'authorization') {
                    if (value.toLowerCase().startsWith('bearer ')) {
                        auth = {
                            type: 'bearer',
                            bearer: { token: value.substring(7).trim() }
                        };
                    } else if (value.toLowerCase().startsWith('basic ')) {
                        auth = {
                            type: 'basic',
                            basic: { username: '', password: '' }
                        };
                    }
                } else {
                    headers.push({ key, value, enabled: true });
                }
            }
        }

        // Extract body data
        const dataMatch = curl.match(/(?:-d|--data|--data-raw|--data-binary)\s+['"](.+?)['"]/s) ||
            curl.match(/(?:-d|--data|--data-raw|--data-binary)\s+'(.+?)'/s);

        if (dataMatch) {
            const data = dataMatch[1];

            // Try to parse as JSON
            try {
                const parsed = JSON.parse(data);
                bodyContent = parsed;
                bodyType = 'json';
            } catch {
                // If not JSON, treat as raw
                bodyContent = data;
                bodyType = 'raw';
            }
        }

        // Extract basic auth
        const authMatch = curl.match(/(?:-u|--user)\s+['"]?([^'":\s]+):([^'":\s]+)['"]?/);
        if (authMatch) {
            auth = {
                type: 'basic',
                basic: {
                    username: authMatch[1],
                    password: authMatch[2]
                }
            };
        }

        // Add default empty row if no headers
        if (headers.length === 0) {
            headers.push({ key: '', value: '', enabled: true });
        }

        return {
            method,
            url,
            headers,
            body: {
                type: bodyType,
                content: bodyContent
            },
            auth
        };
    } catch (error) {
        console.error('Failed to parse cURL:', error);
        return null;
    }
}

export function isCurlCommand(text: string): boolean {
    return /^\s*curl\s+/i.test(text.trim());
}

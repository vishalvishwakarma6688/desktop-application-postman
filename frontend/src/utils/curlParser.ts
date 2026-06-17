import { KeyValue, RequestBody, RequestAuth } from '@/types';

interface ParsedCurl {
    method: string;
    url: string;
    headers: KeyValue[];
    body: RequestBody;
    auth: RequestAuth;
    insecure?: boolean;
}

export function splitArguments(command: string): string[] {
    const args: string[] = [];
    let current = '';
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let escaped = false;

    // Replace backslash followed by newlines
    const sanitized = command.replace(/\\\r?\n/g, ' ').replace(/\\\n/g, ' ');

    for (let i = 0; i < sanitized.length; i++) {
        const char = sanitized[i];

        if (escaped) {
            current += char;
            escaped = false;
            continue;
        }

        if (char === '\\' && !inSingleQuote) {
            escaped = true;
            continue;
        }

        if (char === "'" && !inDoubleQuote) {
            inSingleQuote = !inSingleQuote;
            continue;
        }

        if (char === '"' && !inSingleQuote) {
            inDoubleQuote = !inDoubleQuote;
            continue;
        }

        if ((char === ' ' || char === '\t') && !inSingleQuote && !inDoubleQuote) {
            if (current) {
                args.push(current);
                current = '';
            }
            continue;
        }

        current += char;
    }

    if (current) {
        args.push(current);
    }

    return args;
}

export function parseCurl(curlCommand: string): ParsedCurl | null {
    try {
        const args = splitArguments(curlCommand);

        let method = '';
        let url = '';
        const headers: KeyValue[] = [];
        let bodyContent: any = null;
        let bodyType: 'none' | 'json' | 'raw' | 'form-data' = 'none';
        let auth: RequestAuth = { type: 'none' };
        let insecure = false;
        const formDataFields: KeyValue[] = [];

        // Skip the first element if it's 'curl'
        let startIndex = 0;
        if (args.length > 0 && args[0].toLowerCase() === 'curl') {
            startIndex = 1;
        }

        for (let i = startIndex; i < args.length; i++) {
            const arg = args[i];

            // 1. Headers
            if (arg === '-H' || arg === '--header' || arg.startsWith('-H') || arg.startsWith('--header=')) {
                let value = '';
                if (arg === '-H' || arg === '--header') {
                    value = args[++i] || '';
                } else if (arg.startsWith('-H')) {
                    value = arg.substring(2);
                } else if (arg.startsWith('--header=')) {
                    value = arg.substring(9);
                }

                if (value) {
                    const colonIndex = value.indexOf(':');
                    if (colonIndex > 0) {
                        const key = value.substring(0, colonIndex).trim();
                        const val = value.substring(colonIndex + 1).trim();

                        // Check for Authorization header
                        if (key.toLowerCase() === 'authorization') {
                            if (val.toLowerCase().startsWith('bearer ')) {
                                auth = {
                                    type: 'bearer',
                                    bearer: { token: val.substring(7).trim() }
                                };
                            } else if (val.toLowerCase().startsWith('basic ')) {
                                auth = {
                                    type: 'basic',
                                    basic: { username: '', password: '' }
                                };
                            }
                        } else {
                            headers.push({ key, value: val, enabled: true });
                        }
                    }
                }
            }
            // 2. Request Method
            else if (arg === '-X' || arg === '--request' || arg.startsWith('-X') || arg.startsWith('--request=')) {
                let value = '';
                if (arg === '-X' || arg === '--request') {
                    value = args[++i] || '';
                } else if (arg.startsWith('-X')) {
                    value = arg.substring(2);
                } else if (arg.startsWith('--request=')) {
                    value = arg.substring(10);
                }
                if (value) {
                    method = value.toUpperCase();
                }
            }
            // 3. Request Body Data
            else if (
                arg === '-d' || arg.startsWith('-d') ||
                arg === '--data' || arg.startsWith('--data=') ||
                arg === '--data-raw' || arg.startsWith('--data-raw=') ||
                arg === '--data-binary' || arg.startsWith('--data-binary=') ||
                arg === '--data-ascii' || arg.startsWith('--data-ascii=')
            ) {
                let val = '';
                if (arg === '-d' || arg === '--data' || arg === '--data-raw' || arg === '--data-binary' || arg === '--data-ascii') {
                    val = args[++i] || '';
                } else if (arg.startsWith('-d')) {
                    val = arg.substring(2);
                } else if (arg.startsWith('--data=')) {
                    val = arg.substring(7);
                } else if (arg.startsWith('--data-raw=')) {
                    val = arg.substring(11);
                } else if (arg.startsWith('--data-binary=')) {
                    val = arg.substring(14);
                } else if (arg.startsWith('--data-ascii=')) {
                    val = arg.substring(13);
                }

                if (val !== undefined) {
                    bodyContent = val;
                    // Try to parse as JSON
                    try {
                        const parsed = JSON.parse(val);
                        bodyContent = parsed;
                        bodyType = 'json';
                    } catch {
                        bodyType = 'raw';
                    }
                }
            }
            // 4. Form Data
            else if (arg === '-F' || arg === '--form' || arg.startsWith('-F') || arg.startsWith('--form=')) {
                let value = '';
                if (arg === '-F' || arg === '--form') {
                    value = args[++i] || '';
                } else if (arg.startsWith('-F')) {
                    value = arg.substring(2);
                } else if (arg.startsWith('--form=')) {
                    value = arg.substring(7);
                }

                if (value) {
                    const eqIndex = value.indexOf('=');
                    if (eqIndex > 0) {
                        const key = value.substring(0, eqIndex).trim();
                        let val = value.substring(eqIndex + 1).trim();
                        let type: 'text' | 'file' = 'text';

                        if (val.startsWith('@')) {
                            type = 'file';
                            val = val.substring(1);
                        }

                        formDataFields.push({
                            key,
                            value: val,
                            enabled: true,
                            type
                        });
                    }
                }
            }
            // 5. Basic Authentication User
            else if (arg === '-u' || arg === '--user' || arg.startsWith('-u') || arg.startsWith('--user=')) {
                let value = '';
                if (arg === '-u' || arg === '--user') {
                    value = args[++i] || '';
                } else if (arg.startsWith('-u')) {
                    value = arg.substring(2);
                } else if (arg.startsWith('--user=')) {
                    value = arg.substring(7);
                }

                if (value) {
                    const colonIndex = value.indexOf(':');
                    if (colonIndex > 0) {
                        auth = {
                            type: 'basic',
                            basic: {
                                username: value.substring(0, colonIndex),
                                password: value.substring(colonIndex + 1)
                            }
                        };
                    } else {
                        auth = {
                            type: 'basic',
                            basic: {
                                username: value,
                                password: ''
                            }
                        };
                    }
                }
            }
            // 6. Insecure (SSL verify bypass)
            else if (arg === '-k' || arg === '--insecure') {
                insecure = true;
            }
            // 7. Explicit URL option
            else if (arg === '--url' || arg.startsWith('--url=')) {
                let value = '';
                if (arg === '--url') {
                    value = args[++i] || '';
                } else if (arg.startsWith('--url=')) {
                    value = arg.substring(6);
                }
                if (value) {
                    url = value;
                }
            }
            // 8. Skip options that take a value
            else if (arg.startsWith('-')) {
                const optionsWithValues = [
                    '-o', '--output',
                    '-A', '--user-agent',
                    '-e', '--referer',
                    '-m', '--max-time',
                    '--connect-timeout',
                    '--retry',
                    '--interface'
                ];
                if (optionsWithValues.includes(arg)) {
                    i++;
                }
            }
            // 9. Position argument (URL)
            else {
                if (!url) {
                    url = arg;
                }
            }
        }

        // Apply form-data if fields exist
        if (formDataFields.length > 0) {
            bodyType = 'form-data';
            bodyContent = formDataFields;
        }

        // Default request method logic
        if (!method) {
            method = (bodyType !== 'none') ? 'POST' : 'GET';
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
            auth,
            insecure
        };
    } catch (error) {
        console.error('Failed to parse cURL:', error);
        return null;
    }
}

export function isCurlCommand(text: string): boolean {
    return /^\s*curl\s+/i.test(text.trim());
}

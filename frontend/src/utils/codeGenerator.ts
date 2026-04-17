import { Request } from '@/types';

export type CodeLanguage = 'curl' | 'javascript' | 'python' | 'nodejs' | 'php';

export function generateCodeSnippet(request: Request, language: CodeLanguage): string {
    switch (language) {
        case 'curl':
            return generateCurl(request);
        case 'javascript':
            return generateJavaScript(request);
        case 'python':
            return generatePython(request);
        case 'nodejs':
            return generateNodeJS(request);
        case 'php':
            return generatePHP(request);
        default:
            return generateCurl(request);
    }
}

function generateCurl(request: Request): string {
    const lines: string[] = [];

    // Start with curl command and method
    lines.push(`curl --request ${request.method} '${request.url}' \\`);

    // Add headers
    const headers = (request.headers || []).filter(h => h.enabled && h.key);
    headers.forEach((h, index) => {
        const isLast = index === headers.length - 1 && !request.body?.content;
        lines.push(`--header '${h.key}: ${h.value}'${isLast ? '' : ' \\'}`);
    });

    // Add body if present
    if (request.body?.type === 'json' && request.body.content) {
        const content = typeof request.body.content === 'string'
            ? request.body.content
            : JSON.stringify(request.body.content, null, 2);
        lines.push(`--data '${content.replace(/'/g, `'\\''`)}'`);
    } else if (request.body?.type === 'raw' && request.body.content) {
        lines.push(`--data '${String(request.body.content).replace(/'/g, `'\\''`)}'`);
    }

    return lines.join('\n');
}

function generateJavaScript(request: Request): string {
    const headers: Record<string, string> = {};
    (request.headers || []).filter(h => h.enabled && h.key).forEach(h => {
        headers[h.key] = h.value;
    });

    let body = '';
    if (request.body?.type === 'json' && request.body.content) {
        const content = typeof request.body.content === 'string'
            ? request.body.content
            : JSON.stringify(request.body.content, null, 2);
        body = `body: JSON.stringify(${content}),`;
    } else if (request.body?.type === 'raw' && request.body.content) {
        body = `body: '${String(request.body.content).replace(/'/g, "\\'")}',`;
    }

    return `fetch('${request.url}', {
  method: '${request.method}',
  headers: ${JSON.stringify(headers, null, 2)},
  ${body}
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`;
}

function generatePython(request: Request): string {
    const headers: Record<string, string> = {};
    (request.headers || []).filter(h => h.enabled && h.key).forEach(h => {
        headers[h.key] = h.value;
    });

    let body = '';
    if (request.body?.type === 'json' && request.body.content) {
        const content = typeof request.body.content === 'string'
            ? request.body.content
            : JSON.stringify(request.body.content, null, 2);
        body = `data = ${content}`;
    } else if (request.body?.type === 'raw' && request.body.content) {
        body = `data = '${String(request.body.content).replace(/'/g, "\\'")}'`;
    }

    return `import requests

url = '${request.url}'
headers = ${JSON.stringify(headers, null, 2).replace(/"/g, "'")}
${body}

response = requests.${request.method.toLowerCase()}(url, headers=headers${body ? ', json=data' : ''})
print(response.json())`;
}

function generateNodeJS(request: Request): string {
    const headers: Record<string, string> = {};
    (request.headers || []).filter(h => h.enabled && h.key).forEach(h => {
        headers[h.key] = h.value;
    });

    let body = '';
    if (request.body?.type === 'json' && request.body.content) {
        const content = typeof request.body.content === 'string'
            ? request.body.content
            : JSON.stringify(request.body.content, null, 2);
        body = `body: JSON.stringify(${content}),`;
    } else if (request.body?.type === 'raw' && request.body.content) {
        body = `body: '${String(request.body.content).replace(/'/g, "\\'")}',`;
    }

    return `const https = require('https');

const options = {
  method: '${request.method}',
  hostname: '${new URL(request.url).hostname}',
  path: '${new URL(request.url).pathname}${new URL(request.url).search}',
  headers: ${JSON.stringify(headers, null, 2)}
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => { console.log(JSON.parse(data)); });
});

${body ? `req.write(${body.replace('body: ', '')});` : ''}
req.end();`;
}

function generatePHP(request: Request): string {
    const headers: string[] = [];
    (request.headers || []).filter(h => h.enabled && h.key).forEach(h => {
        headers.push(`  '${h.key}: ${h.value}'`);
    });

    let body = '';
    if (request.body?.type === 'json' && request.body.content) {
        const content = typeof request.body.content === 'string'
            ? request.body.content
            : JSON.stringify(request.body.content);
        body = `CURLOPT_POSTFIELDS => '${content.replace(/'/g, "\\'")}',`;
    } else if (request.body?.type === 'raw' && request.body.content) {
        body = `CURLOPT_POSTFIELDS => '${String(request.body.content).replace(/'/g, "\\'")}',`;
    }

    return `<?php
$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => '${request.url}',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_CUSTOMREQUEST => '${request.method}',
  CURLOPT_HTTPHEADER => array(
${headers.join(',\n')}
  ),
  ${body}
));

$response = curl_exec($curl);
curl_close($curl);
echo $response;
?>`;
}

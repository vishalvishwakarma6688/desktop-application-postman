import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Request } from '@/types';

interface Props { request: Request; }

type Lang = 'curl' | 'fetch' | 'axios' | 'python' | 'go' | 'php';

const LANGS: { id: Lang; label: string }[] = [
    { id: 'curl', label: 'cURL' },
    { id: 'fetch', label: 'JS Fetch' },
    { id: 'axios', label: 'Axios' },
    { id: 'python', label: 'Python' },
    { id: 'go', label: 'Go' },
    { id: 'php', label: 'PHP' },
];

function buildSnippet(req: Request, lang: Lang): string {
    const headers = (req.headers || []).filter(h => h.enabled && h.key);
    const url = req.url || '';
    const method = req.method;
    const bodyContent = req.body?.type === 'json'
        ? (typeof req.body.content === 'string' ? req.body.content : JSON.stringify(req.body.content, null, 2))
        : req.body?.type === 'raw' ? String(req.body.content || '') : null;

    // Auth header
    const authHeader = (() => {
        const a = req.auth;
        if (!a || a.type === 'none') return null;
        if (a.type === 'bearer') return { key: 'Authorization', value: `Bearer ${a.bearer?.token || ''}` };
        if (a.type === 'basic') return { key: 'Authorization', value: `Basic ${btoa(`${a.basic?.username || ''}:${a.basic?.password || ''}`)}` };
        if (a.type === 'apikey' && a.apikey?.addTo === 'header') return { key: a.apikey.key, value: a.apikey.value };
        return null;
    })();

    const allHeaders = authHeader ? [...headers, authHeader] : headers;
    if (req.body?.type === 'json' && !allHeaders.find(h => h.key.toLowerCase() === 'content-type')) {
        allHeaders.push({ key: 'Content-Type', value: 'application/json' });
    }

    if (lang === 'curl') {
        const hFlags = allHeaders.map(h => `  -H '${h.key}: ${h.value}'`).join(' \\\n');
        const bodyFlag = bodyContent ? `  -d '${bodyContent.replace(/'/g, `'\\''`)}' \\` : '';
        return `curl -X ${method} '${url}' \\
${hFlags}${hFlags ? ' \\' : ''}
${bodyFlag}`.trim();
    }

    if (lang === 'fetch') {
        const headersObj = allHeaders.length
            ? `    headers: {\n${allHeaders.map(h => `      '${h.key}': '${h.value}'`).join(',\n')}\n    },`
            : '';
        const bodyStr = bodyContent ? `    body: ${JSON.stringify(bodyContent)},` : '';
        return `const response = await fetch('${url}', {
  method: '${method}',
${headersObj}
${bodyStr}
});
const data = await response.json();
console.log(data);`.replace(/\n{3,}/g, '\n\n');
    }

    if (lang === 'axios') {
        const headersObj = allHeaders.length
            ? `  headers: {\n${allHeaders.map(h => `    '${h.key}': '${h.value}'`).join(',\n')}\n  },`
            : '';
        const bodyStr = bodyContent ? `  data: ${bodyContent},` : '';
        return `import axios from 'axios';

const response = await axios({
  method: '${method.toLowerCase()}',
  url: '${url}',
${headersObj}
${bodyStr}
});
console.log(response.data);`.replace(/\n{3,}/g, '\n\n');
    }

    if (lang === 'python') {
        const headersDict = allHeaders.length
            ? `headers = {\n${allHeaders.map(h => `    '${h.key}': '${h.value}'`).join(',\n')}\n}\n`
            : 'headers = {}\n';
        const bodyStr = bodyContent ? `data = ${bodyContent}\n` : '';
        const bodyArg = bodyContent ? ', json=data' : '';
        return `import requests

${headersDict}${bodyStr}
response = requests.${method.toLowerCase()}(
    '${url}',
    headers=headers${bodyArg}
)
print(response.json())`;
    }

    if (lang === 'go') {
        const bodyStr = bodyContent
            ? `body := strings.NewReader(\`${bodyContent}\`)\n\treq, _ := http.NewRequest("${method}", "${url}", body)`
            : `req, _ := http.NewRequest("${method}", "${url}", nil)`;
        const headerLines = allHeaders.map(h => `\treq.Header.Set("${h.key}", "${h.value}")`).join('\n');
        return `package main

import (
\t"fmt"
\t"net/http"
\t"strings"
\t"io"
)

func main() {
\t${bodyStr}
${headerLines}

\tclient := &http.Client{}
\tresp, _ := client.Do(req)
\tdefer resp.Body.Close()
\tbody, _ := io.ReadAll(resp.Body)
\tfmt.Println(string(body))
}`;
    }

    if (lang === 'php') {
        const headersArr = allHeaders.map(h => `    '${h.key}: ${h.value}'`).join(",\n");
        const bodyStr = bodyContent ? `\ncurl_setopt($ch, CURLOPT_POSTFIELDS, '${bodyContent.replace(/'/g, "\\'")}');` : '';
        return `<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, '${url}');
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, '${method}');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
${headersArr}
]);${bodyStr}

$response = curl_exec($ch);
curl_close($ch);
echo $response;`;
    }

    return '';
}

export default function CodeSnippet({ request }: Props) {
    const [lang, setLang] = useState<Lang>('curl');
    const [copied, setCopied] = useState(false);

    const code = buildSnippet(request, lang);

    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="space-y-3 pt-2">
            {/* Language selector */}
            <div className="flex items-center gap-1 flex-wrap">
                {LANGS.map(l => (
                    <button
                        key={l.id}
                        onClick={() => setLang(l.id)}
                        className={`rounded px-3 py-1 text-xs font-medium transition-colors ${lang === l.id ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}
                    >
                        {l.label}
                    </button>
                ))}
                <button
                    onClick={handleCopy}
                    className="ml-auto flex items-center gap-1.5 rounded border border-gray-700 px-2.5 py-1 text-xs text-gray-400 hover:bg-gray-800 transition-colors"
                >
                    {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>

            {/* Code block */}
            <pre className="rounded border border-gray-700 bg-gray-800 p-4 text-xs text-gray-300 font-mono whitespace-pre overflow-auto max-h-72">
                {code}
            </pre>
        </div>
    );
}

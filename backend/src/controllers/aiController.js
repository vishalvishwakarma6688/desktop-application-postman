const NVIDIA_API_URL = process.env.NVIDIA_API_URL;
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const AI_MODEL = process.env.AI_MODEL || 'nvidia/llama-3.1-nemotron-nano-8b-v1';
const AI_FALLBACK_MODEL = process.env.AI_FALLBACK_MODEL || 'meta/llama-3.1-8b-instruct';

const callNvidiaAPI = async (prompt, useFallback = false) => {
    const model = useFallback ? AI_FALLBACK_MODEL : AI_MODEL;

    try {
        console.log(`[AI] Calling NVIDIA API with model: ${model}`);
        console.log(`[AI] API URL: ${NVIDIA_API_URL}`);
        console.log(`[AI] API Key present: ${!!NVIDIA_API_KEY}`);

        const response = await fetch(NVIDIA_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NVIDIA_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1024,
                stream: false
            })
        });

        console.log(`[AI] Response status: ${response.status}`);

        if (!response.ok) {
            const error = await response.text();
            console.error(`[AI] API error response: ${error}`);
            throw new Error(`NVIDIA API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        console.log(`[AI] Successfully received response`);
        return data.choices[0].message.content;
    } catch (error) {
        console.error(`[AI] Fetch error:`, error.message);
        console.error(`[AI] Error type:`, error.constructor.name);
        console.error(`[AI] Error cause:`, error.cause);
        throw error;
    }
};

const SYSTEM_CONTEXT = `
You are ApiPilot, a specialized API Development Assistant embedded inside a Postman-like HTTP client.

YOUR SOLE PURPOSE:
Help users understand, test, debug, design, and improve APIs.

ALLOWED TOPICS:
- HTTP requests and responses
- REST APIs
- GraphQL APIs
- Webhooks
- Authentication (JWT, OAuth, API Keys, Sessions)
- Request payloads and schemas
- Response structures
- Status codes
- API testing and assertions
- API debugging and troubleshooting
- OpenAPI / Swagger specifications
- Backend integration issues
- Headers, cookies, query parameters, and routing
- Performance, security, and API best practices

STRICT BOUNDARIES:
- Do NOT answer questions unrelated to APIs, backend development, HTTP communication, integrations, or software engineering.
- If a user asks about politics, health, finance, sports, entertainment, personal advice, general knowledge, or any unrelated topic, respond only with:

"I'm an API Development Assistant and can only help with API-related topics, HTTP requests/responses, backend integrations, testing, and debugging."

RESPONSE STYLE:
- Be concise and technically accurate.
- Prioritize practical developer-focused explanations.
- Use markdown formatting.
- When analyzing API responses, base conclusions only on the provided request, response, headers, and payload.
- Never hallucinate missing information.
- If data is insufficient, explicitly state what additional information is needed.
- Explain errors, root causes, and fixes whenever possible.
- Prefer actionable recommendations over theory.
`;

// POST /api/ai/explain-response
export const explainResponse = async (req, res, next) => {
    try {
        const { status, statusText, data, headers, method, url } = req.body;
        const prompt = `
${SYSTEM_CONTEXT}

TASK:
Analyze the following API response and explain it as an experienced backend engineer.

REQUEST DETAILS:
Method: ${method}
URL: ${url}

RESPONSE DETAILS:
Status: ${status} ${statusText}

Headers:
${JSON.stringify(headers || {}, null, 2)}

Body:
${JSON.stringify(data, null, 2).slice(0, 5000)}

ANALYSIS REQUIREMENTS:

## 1. Summary
Provide a brief explanation of what this response indicates.

## 2. Status Evaluation
- Is this response successful, partially successful, redirected, client error, or server error?
- Explain the meaning of the status code.

## 3. Important Response Fields
Identify and explain important fields found in the response body.
For each field include:
- Field name
- Purpose
- Expected usage

## 4. Potential Issues
Identify:
- Validation errors
- Missing data
- Authentication problems
- Authorization issues
- Rate limiting
- Server-side failures
- Unexpected response structure

If none are found, explicitly state that.

## 5. Recommended Next Steps
Provide practical actions the developer should take next.

## 6. Debugging Suggestions
If the response indicates a problem, provide:
- Likely root cause
- How to verify it
- How to fix it

IMPORTANT RULES:
- Do not invent fields or assumptions.
- Only analyze information present in the request and response.
- If the response body is empty, explain possible reasons.
- Keep explanations developer-focused and actionable.
- Format output using markdown.
`;

        let text;
        try {
            text = await callNvidiaAPI(prompt);
        } catch (err) {
            console.warn('Primary model failed, trying fallback:', err.message);
            text = await callNvidiaAPI(prompt, true);
        }

        res.json({ success: true, data: { text } });
    } catch (err) {
        next(err);
    }
};

// POST /api/ai/generate-body
export const generateBody = async (req, res, next) => {
    try {
        const { method, url, description } = req.body;
        const prompt = `${SYSTEM_CONTEXT}

Generate a realistic JSON request body for this API endpoint:
- Method: ${method}
- URL: ${url}
- Description: ${description || 'No description provided'}

Return ONLY a valid JSON object with realistic sample data. No explanation, just the JSON.`;

        let text;
        try {
            text = await callNvidiaAPI(prompt);
        } catch (err) {
            console.warn('Primary model failed, trying fallback:', err.message);
            text = await callNvidiaAPI(prompt, true);
        }

        // Clean up code blocks if present
        text = text.trim()
            .replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');

        res.json({ success: true, data: { text } });
    } catch (err) {
        next(err);
    }
};

// POST /api/ai/fix-request
export const fixRequest = async (req, res, next) => {
    try {
        const { method, url, headers, body, errorResponse, errorStatus } = req.body;
        const prompt = `${SYSTEM_CONTEXT}

A developer is getting an error from this API request. Help them fix it:

Request:
- Method: ${method}
- URL: ${url}
- Headers: ${JSON.stringify(headers || [], null, 2)}
- Body: ${JSON.stringify(body, null, 2)}

Error:
- Status: ${errorStatus}
- Response: ${JSON.stringify(errorResponse, null, 2).slice(0, 1000)}

Provide specific, actionable fixes. What's wrong and exactly how to fix it?`;

        let text;
        try {
            text = await callNvidiaAPI(prompt);
        } catch (err) {
            console.warn('Primary model failed, trying fallback:', err.message);
            text = await callNvidiaAPI(prompt, true);
        }

        res.json({ success: true, data: { text } });
    } catch (err) {
        next(err);
    }
};

// POST /api/ai/generate-tests
export const generateTests = async (req, res, next) => {
    try {
        const { method, url, responseStatus, responseData } = req.body;
        const prompt = `${SYSTEM_CONTEXT}

Generate JavaScript test assertions (using pm.test / pm.expect syntax like Postman) for this API response:
- Method: ${method}
- URL: ${url}
- Status: ${responseStatus}
- Response: ${JSON.stringify(responseData, null, 2).slice(0, 1500)}

Write 4-6 meaningful test assertions. Return only the JavaScript code.`;

        let text;
        try {
            text = await callNvidiaAPI(prompt);
        } catch (err) {
            console.warn('Primary model failed, trying fallback:', err.message);
            text = await callNvidiaAPI(prompt, true);
        }

        // Clean up code blocks if present
        text = text.trim()
            .replace(/^```javascript\n?/, '').replace(/^```js\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');

        res.json({ success: true, data: { text } });
    } catch (err) {
        next(err);
    }
};

// POST /api/ai/chat
export const chat = async (req, res, next) => {
    try {
        const { message, context } = req.body;
        const contextStr = context
            ? `\nCurrent request context:\n${JSON.stringify(context, null, 2).slice(0, 1000)}\n`
            : '';
        const prompt = `${SYSTEM_CONTEXT}${contextStr}\n\nDeveloper question: ${message}`;

        let text;
        try {
            text = await callNvidiaAPI(prompt);
        } catch (err) {
            console.warn('Primary model failed, trying fallback:', err.message);
            text = await callNvidiaAPI(prompt, true);
        }

        res.json({ success: true, data: { text } });
    } catch (err) {
        next(err);
    }
};

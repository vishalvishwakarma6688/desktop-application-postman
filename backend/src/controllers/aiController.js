import { GoogleGenerativeAI } from '@google/generative-ai';

const getModel = () => {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    return genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
};

const SYSTEM_CONTEXT = `You are an expert API development assistant embedded in a Postman-like HTTP client tool.
You help developers with:
- Understanding API responses and status codes
- Generating request bodies and payloads
- Debugging API errors
- Writing test assertions
- Explaining HTTP concepts
- Suggesting API improvements
Keep responses concise, practical, and developer-focused. Use markdown formatting.`;

// POST /api/ai/explain-response
export const explainResponse = async (req, res, next) => {
    try {
        const { status, statusText, data, headers, method, url } = req.body;
        const model = getModel();
        const prompt = `${SYSTEM_CONTEXT}

Explain this API response in a clear, concise way:
- Request: ${method} ${url}
- Status: ${status} ${statusText}
- Response headers: ${JSON.stringify(headers || {}, null, 2)}
- Response body: ${JSON.stringify(data, null, 2).slice(0, 2000)}

Provide:
1. What this response means
2. Whether it indicates success or an issue
3. Key fields in the response and what they represent
4. Any actionable next steps if there's an error`;

        const result = await model.generateContent(prompt);
        res.json({ success: true, data: { text: result.response.text() } });
    } catch (err) {
        next(err);
    }
};

// POST /api/ai/generate-body
export const generateBody = async (req, res, next) => {
    try {
        const { method, url, description } = req.body;
        const model = getModel();
        const prompt = `${SYSTEM_CONTEXT}

Generate a realistic JSON request body for this API endpoint:
- Method: ${method}
- URL: ${url}
- Description: ${description || 'No description provided'}

Return ONLY a valid JSON object with realistic sample data. No explanation, just the JSON.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim()
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
        const model = getModel();
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

        const result = await model.generateContent(prompt);
        res.json({ success: true, data: { text: result.response.text() } });
    } catch (err) {
        next(err);
    }
};

// POST /api/ai/generate-tests
export const generateTests = async (req, res, next) => {
    try {
        const { method, url, responseStatus, responseData } = req.body;
        const model = getModel();
        const prompt = `${SYSTEM_CONTEXT}

Generate JavaScript test assertions (using pm.test / pm.expect syntax like Postman) for this API response:
- Method: ${method}
- URL: ${url}
- Status: ${responseStatus}
- Response: ${JSON.stringify(responseData, null, 2).slice(0, 1500)}

Write 4-6 meaningful test assertions. Return only the JavaScript code.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim()
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
        const model = getModel();
        const contextStr = context
            ? `\nCurrent request context:\n${JSON.stringify(context, null, 2).slice(0, 1000)}\n`
            : '';
        const prompt = `${SYSTEM_CONTEXT}${contextStr}\n\nDeveloper question: ${message}`;
        const result = await model.generateContent(prompt);
        res.json({ success: true, data: { text: result.response.text() } });
    } catch (err) {
        next(err);
    }
};

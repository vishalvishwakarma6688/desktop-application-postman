import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load local backend .env file
dotenv.config();

const NVIDIA_API_URL = process.env.NVIDIA_API_URL || 'https://integrate.api.nvidia.com/v1/chat/completions';
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const AI_MODEL = process.env.AI_MODEL || 'nvidia/llama-3.1-nemotron-nano-8b-v1';
const AI_FALLBACK_MODEL = process.env.AI_FALLBACK_MODEL || 'meta/llama-3.1-8b-instruct';

console.log('--- AI Connection Test ---');
console.log(`API URL: ${NVIDIA_API_URL}`);
console.log(`API Key Present: ${!!NVIDIA_API_KEY}`);
console.log(`Primary Model: ${AI_MODEL}`);
console.log(`Fallback Model: ${AI_FALLBACK_MODEL}`);
console.log('--------------------------\n');

const testModel = async (modelName) => {
    console.log(`Testing model: ${modelName}...`);
    const startTime = Date.now();
    try {
        const response = await fetch(NVIDIA_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NVIDIA_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: modelName,
                messages: [
                    {
                        role: 'user',
                        content: 'Hello, respond with exactly 5 words.'
                    }
                ],
                temperature: 0.7,
                max_tokens: 50,
                stream: false
            })
        });

        const latency = Date.now() - startTime;
        console.log(`Status: ${response.status} (${response.statusText})`);
        console.log(`Latency: ${latency}ms`);

        if (!response.ok) {
            const errText = await response.text();
            console.error(`Error response: ${errText}`);
            return { success: false, status: response.status, latency };
        }

        const data = await response.json();
        console.log(`Response: "${data.choices[0].message.content.trim()}"`);
        return { success: true, latency };
    } catch (err) {
        const latency = Date.now() - startTime;
        console.error(`Error: ${err.message} (took ${latency}ms)`);
        return { success: false, error: err.message, latency };
    }
};

async function run() {
    if (!NVIDIA_API_KEY) {
        console.error('ERROR: NVIDIA_API_KEY is not defined in backend/.env!');
        process.exit(1);
    }

    console.log('1. Testing Primary Model...');
    const primaryResult = await testModel(AI_MODEL);
    console.log('\n--------------------------\n');

    console.log('2. Testing Fallback Model...');
    const fallbackResult = await testModel(AI_FALLBACK_MODEL);
    console.log('\n--------------------------\n');

    console.log('=== TEST SUMMARY ===');
    console.log(`Primary model (${AI_MODEL}): ${primaryResult.success ? '✅ SUCCESS' : '❌ FAILED'} (${primaryResult.latency}ms)`);
    console.log(`Fallback model (${AI_FALLBACK_MODEL}): ${fallbackResult.success ? '✅ SUCCESS' : '❌ FAILED'} (${fallbackResult.latency}ms)`);
}

run();

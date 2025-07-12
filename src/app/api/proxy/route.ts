import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { serverApiKeyService } from '@/lib/services/server-api-key-service';
import { determineCachePrompt } from '@/ai/flows/determine-cache-prompt';
import { cacheService } from '@/lib/services/cache-service';
import { apiKeyService } from '@/lib/services/api-key-service';


const requestSchema = z.object({
  model: z.enum(['ollama', 'google']),
  prompt: z.string().min(1, 'Prompt cannot be empty.'),
});

// Mock AI service responses for the API route
const mockGoogleAiImage = () => `https://placehold.co/512x512.png`;

async function callOllamaApi(prompt: string, apiKey: string): Promise<{ content: string }> {
    const endpoint = 'http://modelapi.nexix.ai/api/v1/proxy/generate';

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
        model: 'llama3.1:8b',
        prompt: prompt,
        stream: false,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('Ollama API Error:', errorBody);
        throw new Error(`Ollama API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    return { content: data.response };
}


export async function POST(req: NextRequest) {
  // 1. Authenticate the request
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: Missing or invalid API key.' }, { status: 401 });
  }
  const apiKey = authHeader.split(' ')[1];
  const isValid = await serverApiKeyService.validateKey(apiKey);
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized: Invalid API key.' }, { status: 401 });
  }

  // 2. Validate the request body
  let body;
  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const validatedFields = requestSchema.safeParse(body);
  if (!validatedFields.success) {
    return NextResponse.json({ error: validatedFields.error.flatten().fieldErrors }, { status: 400 });
  }

  const { model, prompt } = validatedFields.data;

  try {
    // 3. Handle Ollama (Text) Model
    if (model === 'ollama') {
      const allKeys = await apiKeyService.getKeys();
      const ollamaKey = allKeys.find(k => k.service === 'Ollama');

      if (!ollamaKey) {
          throw new Error('Ollama API key not found. Please add it in the AI Keys page.');
      }

      const { shouldCache } = await determineCachePrompt({ promptContent: prompt });

      if (!shouldCache) {
        cacheService.addUncachedRequest('Ollama', prompt);
        const { content } = await callOllamaApi(prompt, ollamaKey.key);
        return NextResponse.json({ content, isCached: false });
      }

      const cacheKey = `ollama::${prompt}`;
      let cached = await cacheService.get(cacheKey);

      if (cached) {
        return NextResponse.json({ content: cached, isCached: true });
      }

      const { content } = await callOllamaApi(prompt, ollamaKey.key);
      await cacheService.set(cacheKey, content);
      return NextResponse.json({ content, isCached: false });
    }

    // 4. Handle Google (Image) Model
    if (model === 'google') {
      const cacheKey = `googleai::${prompt}`;
      let cached = await cacheService.get(cacheKey);

      if (cached) {
        return NextResponse.json({ content: cached, isCached: true });
      }
      
      const content = mockGoogleAiImage();
      await cacheService.set(cacheKey, content);
      return NextResponse.json({ content, isCached: false });
    }

    // This part should not be reachable due to the schema validation
    return NextResponse.json({ error: 'Invalid model specified.' }, { status: 400 });

  } catch (e: any) {
    console.error('API Proxy Error:', e);
    return NextResponse.json({ error: e.message || 'An internal server error occurred.' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { serverApiKeyService } from '@/lib/services/server-api-key-service';
import { determineCachePrompt } from '@/ai/flows/determine-cache-prompt';
import { cacheService } from '@/lib/services/cache-service';

const requestSchema = z.object({
  model: z.enum(['ollama', 'google']),
  prompt: z.string().min(1, 'Prompt cannot be empty.'),
});

// Mock AI service responses for the API route
const mockOllamaResponse = (prompt: string) => `This is a mock Ollama response for the prompt: "${prompt}". The time is ${new Date().toLocaleTimeString()}.`;
const mockGoogleAiImage = () => `https://placehold.co/512x512.png`;

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
      const { shouldCache } = await determineCachePrompt({ promptContent: prompt });

      if (!shouldCache) {
        cacheService.addUncachedRequest('Ollama', prompt);
        const content = mockOllamaResponse(prompt);
        return NextResponse.json({ content, isCached: false });
      }

      const cacheKey = `ollama::${prompt}`;
      let cached = await cacheService.get(cacheKey);

      if (cached) {
        return NextResponse.json({ content: cached, isCached: true });
      }

      const content = mockOllamaResponse(prompt);
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

  } catch (e) {
    console.error('API Proxy Error:', e);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}

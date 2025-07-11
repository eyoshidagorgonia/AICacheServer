'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { determineCachePrompt } from '@/ai/flows/determine-cache-prompt';
import { cacheService } from '@/lib/services/cache-service';
import { apiKeyService } from '@/lib/services/api-key-service';
import { ProxyResponse } from '@/lib/types';

const ollamaSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty.'),
});

const googleAiSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty.'),
});

// Mock AI service responses
const mockOllamaResponse = (prompt: string) => `This is a mock Ollama response for the prompt: "${prompt}". The time is ${new Date().toLocaleTimeString()}.`;
const mockGoogleAiImage = () => `https://placehold.co/512x512.png`;


export async function submitOllamaPrompt(prevState: any, formData: FormData): Promise<ProxyResponse> {
  const validatedFields = ollamaSchema.safeParse({
    prompt: formData.get('prompt'),
  });

  if (!validatedFields.success) {
    return { content: '', isCached: false, error: 'Invalid prompt.' };
  }
  
  const { prompt } = validatedFields.data;

  try {
    const { shouldCache, reason } = await determineCachePrompt({ promptContent: prompt });

    if (!shouldCache) {
      cacheService.addUncachedRequest('Ollama', prompt);
      const content = mockOllamaResponse(prompt);
      return { content, isCached: false, shouldCache, decisionReason: reason };
    }

    const cacheKey = `ollama::${prompt}`;
    let cached = await cacheService.get(cacheKey);

    if (cached) {
      return { content: cached, isCached: true, shouldCache, decisionReason: reason };
    }

    const content = mockOllamaResponse(prompt);
    await cacheService.set(cacheKey, content);

    revalidatePath('/');
    return { content, isCached: false, shouldCache, decisionReason: reason };
  } catch (e) {
    console.error(e);
    return { content: '', isCached: false, error: 'Failed to process prompt.' };
  }
}

export async function submitGoogleAiPrompt(prevState: any, formData: FormData): Promise<ProxyResponse> {
  const validatedFields = googleAiSchema.safeParse({
    prompt: formData.get('prompt'),
  });

  if (!validatedFields.success) {
    return { content: '', isCached: false, error: 'Invalid prompt.' };
  }

  const { prompt } = validatedFields.data;
  const cacheKey = `googleai::${prompt}`;
  let cached = await cacheService.get(cacheKey);

  if (cached) {
    return { content: cached, isCached: true };
  }
  
  const content = mockGoogleAiImage();
  await cacheService.set(cacheKey, content);
  
  revalidatePath('/');
  return { content, isCached: false };
}

export async function getCacheStats() {
  return cacheService.getStats();
}

export async function getRecentActivity() {
  return cacheService.getRecentActivity();
}

export async function getApiKeys() {
  return apiKeyService.getKeys();
}

const addKeySchema = z.object({
  service: z.enum(['Ollama', 'Google AI']),
  key: z.string().min(10, 'API Key seems too short.'),
});

export async function addApiKey(formData: FormData) {
  const validatedFields = addKeySchema.safeParse({
    service: formData.get('service'),
    key: formData.get('key'),
  });

  if (!validatedFields.success) {
    return { error: 'Invalid data provided.' };
  }
  
  await apiKeyService.addKey(validatedFields.data.service, validatedFields.data.key);
  revalidatePath('/keys');
  return { success: true };
}

export async function deleteApiKey(id: string) {
  await apiKeyService.deleteKey(id);
  revalidatePath('/keys');
}

const updateKeySchema = z.object({
  id: z.string(),
  key: z.string().min(10, 'API Key seems too short.'),
});

export async function updateApiKey(formData: FormData) {
  const validatedFields = updateKeySchema.safeParse({
    id: formData.get('id'),
    key: formData.get('key'),
  });

  if (!validatedFields.success) {
    return { error: 'Invalid data provided for update.' };
  }

  const { id, key } = validatedFields.data;
  await apiKeyService.updateKey(id, key);
  revalidatePath('/keys');
  return { success: true };
}

'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { determineCachePrompt } from '@/ai/flows/determine-cache-prompt';
import { cacheService } from '@/lib/services/cache-service';
import { apiKeyService } from '@/lib/services/api-key-service';
import { serverApiKeyService } from '@/lib/services/server-api-key-service';
import { modelService } from '@/lib/services/model-service';
import { ProxyResponse, KeyHealth, TestApiResponse, ApiKey, ModelHealth, AllData, ImportResult, Model } from '@/lib/types';

const OLLAMA_DEFAULT_MODEL = 'llama3.1:8b';

const ollamaSchema = z.object({
  keyId: z.string().min(1, 'An AI Key must be selected.'),
  prompt: z.string().min(1, 'Prompt cannot be empty.'),
  model: z.string().optional(),
});

const googleGeminiSchema = z.object({
  keyId: z.string().min(1, 'An AI Key must be selected.'),
  prompt: z.string().min(1, 'Prompt cannot be empty.'),
});

// Helper to call our own app's proxy API
async function callProxyApi(service: 'ollama' | 'google-gemini', prompt: string, keyId: string, model?: string): Promise<ProxyResponse> {
  // In a real app, we'd get the base URL dynamically
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
  const proxyUrl = `${baseUrl}/api/proxy`;

  // We need a server API key to talk to our own proxy
  const serverKeys = await serverApiKeyService.getKeys();
  if (serverKeys.length === 0) {
    throw new Error('No server API key found. Please generate one in the API Keys page.');
  }
  const serverApiKey = serverKeys[0].key;

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serverApiKey}`,
    },
    body: JSON.stringify({ service, prompt, model, keyId }),
  });

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(errorBody.error || `API request failed with status: ${response.status}`);
  }

  return response.json();
}

export async function submitOllamaPrompt(prevState: any, formData: FormData): Promise<ProxyResponse> {
  const validatedFields = ollamaSchema.safeParse({
    keyId: formData.get('keyId'),
    prompt: formData.get('prompt'),
    model: formData.get('model') || undefined,
  });

  if (!validatedFields.success) {
    return { content: '', isCached: false, error: 'Invalid prompt or model.' };
  }
  
  const { keyId, prompt, model } = validatedFields.data;

  try {
    const result = await callProxyApi('ollama', prompt, keyId, model || OLLAMA_DEFAULT_MODEL);
    
    // The proxy API now handles caching logic, but we still need to get the AI's reason for the UI.
    const allKeys = await apiKeyService.getKeys();
    const googleKey = allKeys.find(k => k.service === 'Google Gemini');
    if (!googleKey) {
        // If no google key, we can't determine caching, so just return the proxy result.
        // Caching will be skipped on the backend anyway.
        return { ...result, shouldCache: false, decisionReason: "No Google Gemini key available to determine caching strategy." };
    }

    const { shouldCache, reason } = await determineCachePrompt({ promptContent: prompt, apiKey: googleKey.key });

    revalidatePath('/');
    return { ...result, shouldCache, decisionReason: reason };
  } catch (e: any) {
    console.error(e);
    return { content: '', isCached: false, error: e.message || 'Failed to process prompt.' };
  }
}

export async function submitGoogleGeminiPrompt(prevState: any, formData: FormData): Promise<ProxyResponse> {
  const validatedFields = googleGeminiSchema.safeParse({
    keyId: formData.get('keyId'),
    prompt: formData.get('prompt'),
  });

  if (!validatedFields.success) {
    return { content: '', isCached: false, error: 'Invalid prompt.' };
  }

  const { keyId, prompt } = validatedFields.data;

  try {
    const result = await callProxyApi('google-gemini', prompt, keyId);
    revalidatePath('/');
    return result;
  } catch (e: any) {
    console.error(e);
    return { content: '', isCached: false, error: e.message || 'Failed to process prompt.' };
  }
}

export async function getCacheStats() {
  return cacheService.getStats();
}

export async function getRecentActivity() {
  return cacheService.getRecentActivity();
}

// In a real app, this would make a lightweight call to the respective AI service.
// For this mock, we'll just check if the key contains "bad".
async function performHealthCheck(key: string): Promise<{ status: 'healthy' | 'unhealthy', statusCode: number }> {
  return new Promise(resolve => {
    setTimeout(() => {
      if (key.includes('bad')) {
        resolve({ status: 'unhealthy', statusCode: 503 }); // Service Unavailable
      } else {
        resolve({ status: 'healthy', statusCode: 200 }); // OK
      }
    }, Math.random() * 500); // Simulate network latency
  });
}

export async function getKeyHealthStatus(): Promise<KeyHealth[]> {
  const keys = await apiKeyService.getKeys();
  if (keys.length === 0) return [];
  
  const healthChecks = keys.map(async (key) => {
    const { status, statusCode } = await performHealthCheck(key.key);
    let summary = `Status: ${statusCode}. `;
    if (statusCode === 200) {
      summary += "API is responsive.";
    } else if (statusCode >= 500) {
      summary += "Service may be down or experiencing issues.";
    } else if (statusCode >= 400) {
      summary += "Authentication or request issue.";
    }
    
    return {
      id: key.id,
      service: key.service,
      keySnippet: `...${key.key.slice(-4)}`,
      status,
      statusSummary: summary,
    };
  });

  return Promise.all(healthChecks);
}

export async function getModelHealthStatus(): Promise<ModelHealth[]> {
  const keys = await apiKeyService.getKeys();
  const services = ['Ollama', 'Google Gemini'];
  
  return services.map(service => {
    const hasKey = keys.some(key => key.service === service);
    return {
      service: service,
      status: hasKey ? 'active' : 'inactive',
    };
  });
}

export async function getApiKeys() {
  return apiKeyService.getKeys();
}

const addKeySchema = z.object({
  service: z.enum(['Ollama', 'Google Gemini']),
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
  revalidatePath('/'); // Revalidate dashboard to update health status
  return { success: true };
}

export async function deleteApiKey(id: string) {
  await apiKeyService.deleteKey(id);
  revalidatePath('/keys');
  revalidatePath('/'); // Revalidate dashboard to update health status
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
  revalidatePath('/'); // Revalidate dashboard to update health status
  return { success: true };
}

// Server API Key Actions
export async function getServerApiKeys() {
  return serverApiKeyService.getKeys();
}

const generateKeySchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters.'),
});

export async function generateServerApiKey(formData: FormData) {
  const validatedFields = generateKeySchema.safeParse({
    name: formData.get('name'),
  });

  if (!validatedFields.success) {
      return { error: 'Invalid name provided.' };
  }
  
  const newKey = await serverApiKeyService.generateKey(validatedFields.data.name);
  revalidatePath('/api-keys');
  return { success: true, newKey: newKey.key };
}

export async function revokeServerApiKey(id: string) {
  await serverApiKeyService.revokeKey(id);
  revalidatePath('/api-keys');
}

const updateServerApiKeySchema = z.object({
  id: z.string(),
  name: z.string().min(3, 'Name must be at least 3 characters.'),
});

export async function updateServerApiKey(formData: FormData) {
  const validatedFields = updateServerApiKeySchema.safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
  });

  if (!validatedFields.success) {
    return { error: 'Invalid data provided for update.' };
  }

  const { id, name } = validatedFields.data;
  await serverApiKeyService.updateKeyName(id, name);
  revalidatePath('/api-keys');
  return { success: true };
}


const testAiServiceSchema = z.object({
  keyId: z.string().min(1, 'An AI Key must be selected.'),
  prompt: z.string().min(1, 'Prompt cannot be empty.'),
  model: z.string().optional(),
});

export async function testAiService(values: z.infer<typeof testAiServiceSchema>): Promise<TestApiResponse> {
  const validatedFields = testAiServiceSchema.safeParse(values);
  if (!validatedFields.success) {
    return { data: { error: 'Invalid input' }, status: 400 };
  }

  const { keyId, prompt } = validatedFields.data;
  const model = validatedFields.data.model || OLLAMA_DEFAULT_MODEL;

  try {
    const key = await apiKeyService.getKeyById(keyId);
    if (!key) {
      return { data: { error: 'API Key not found.' }, status: 404 };
    }
    
    // All tests now go through the actual proxy
    const result = await callProxyApi(key.service.toLowerCase().replace(' ', '-') as 'ollama' | 'google-gemini', prompt, keyId, model);

    if (result.error) {
       return { data: { error: result.error }, status: 500 };
    }

    return { data: { content: result.content }, status: 200 };
  } catch (error: any) {
    console.error("AI Service Test Error:", error);
    return { data: { error: error.message || 'An unknown error occurred.' }, status: 500 };
  }
}

// Model Actions
export async function getModels(): Promise<Model[]> {
  return modelService.getModels();
}

const addModelSchema = z.object({
  name: z.string().min(3, 'Model name must be at least 3 characters.'),
  service: z.enum(['Ollama', 'Google Gemini']),
});

export async function addModel(formData: FormData) {
  const validatedFields = addModelSchema.safeParse({
    name: formData.get('name'),
    service: formData.get('service'),
  });

  if (!validatedFields.success) {
    return { error: 'Invalid data provided.' };
  }

  await modelService.addModel(validatedFields.data.name, validatedFields.data.service);
  revalidatePath('/models');
  return { success: true };
}

export async function deleteModel(id: string) {
  await modelService.deleteModel(id);
  revalidatePath('/models');
}


// Settings Actions
export async function exportAllData(): Promise<AllData> {
  const [aiKeys, serverApiKeys, models] = await Promise.all([
    apiKeyService.getKeys(),
    serverApiKeyService.getKeys(),
    modelService.getModels(),
  ]);
  return { aiKeys, serverApiKeys, models };
}

const importDataSchema = z.object({
  fileContent: z.string().min(1, 'File content cannot be empty.'),
  conflictResolution: z.enum(['keep', 'overwrite']),
});

export async function importAllData(formData: FormData): Promise<ImportResult> {
  const validated = importDataSchema.safeParse({
    fileContent: formData.get('fileContent'),
    conflictResolution: formData.get('conflictResolution'),
  });

  if (!validated.success) {
    return { type: 'error', message: 'Invalid form data.' };
  }

  const { fileContent, conflictResolution } = validated.data;

  try {
    const dataToImport: AllData = JSON.parse(fileContent);
    const result = await apiKeyService.importKeys(dataToImport.aiKeys || [], conflictResolution);
    const serverResult = await serverApiKeyService.importKeys(dataToImport.serverApiKeys || [], conflictResolution);
    const modelResult = await modelService.importModels(dataToImport.models || [], conflictResolution);

    revalidatePath('/', 'layout');

    return {
      type: 'success',
      aiKeys: result,
      serverApiKeys: serverResult,
      models: modelResult,
    };
  } catch (error: any) {
    console.error('Import error:', error);
    return { type: 'error', message: 'Failed to parse JSON or import data. Please check the file format.' };
  }
}

export async function clearAllData(): Promise<{ success: boolean, message: string }> {
    try {
        await apiKeyService.clear();
        await serverApiKeyService.clear();
        await modelService.clear();
        revalidatePath('/', 'layout');
        return { success: true, message: 'All data has been cleared.' };
    } catch (error: any) {
        console.error('Clear data error:', error);
        return { success: false, message: 'Failed to clear all data.' };
    }
}

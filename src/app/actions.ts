'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { determineCachePrompt } from '@/ai/flows/determine-cache-prompt';
import { cacheService } from '@/lib/services/cache-service';
import { apiKeyService } from '@/lib/services/api-key-service';
import { serverApiKeyService } from '@/lib/services/server-api-key-service';
import { modelService } from '@/lib/services/model-service';
import { ProxyResponse, KeyHealth, TestApiResponse, ApiKey, ModelHealth, AllData, ImportResult, Model } from '@/lib/types';

const ollamaSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty.'),
  model: z.string().min(1, 'A model must be selected.')
});

const googleAiSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty.'),
});

// Mock AI service responses
const mockGoogleAiImage = () => `https://placehold.co/512x512.png`;


async function callOllamaApi(prompt: string, model: string, apiKey: string): Promise<string> {
  const endpoint = 'http://modelapi.nexix.ai/api/v1/proxy/generate';
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
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
  return data.response;
}


export async function submitOllamaPrompt(prevState: any, formData: FormData): Promise<ProxyResponse> {
  const validatedFields = ollamaSchema.safeParse({
    prompt: formData.get('prompt'),
    model: formData.get('model'),
  });

  if (!validatedFields.success) {
    return { content: '', isCached: false, error: 'Invalid prompt or model.' };
  }
  
  const { prompt, model } = validatedFields.data;

  try {
    const allKeys = await apiKeyService.getKeys();
    const ollamaKey = allKeys.find(k => k.service === 'Ollama');

    if (!ollamaKey) {
      throw new Error('Ollama API key not found. Please add it in the AI Keys page.');
    }

    const { shouldCache, reason } = await determineCachePrompt({ promptContent: prompt });

    if (!shouldCache) {
      cacheService.addUncachedRequest('Ollama', prompt);
      const content = await callOllamaApi(prompt, model, ollamaKey.key);
      revalidatePath('/');
      return { content, isCached: false, shouldCache, decisionReason: reason };
    }

    const cacheKey = `ollama:${model}:${prompt}`;
    let cached = await cacheService.get(cacheKey);

    if (cached) {
      revalidatePath('/');
      return { content: cached, isCached: true, shouldCache, decisionReason: reason };
    }

    const content = await callOllamaApi(prompt, model, ollamaKey.key);
    await cacheService.set(cacheKey, content);

    revalidatePath('/');
    return { content, isCached: false, shouldCache, decisionReason: reason };
  } catch (e: any) {
    console.error(e);
    return { content: '', isCached: false, error: e.message || 'Failed to process prompt.' };
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
    revalidatePath('/');
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
  const services = ['Ollama', 'Google AI'];
  
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
}).refine(data => {
    const key = apiKeyService.getKeyById(data.keyId);
    if (key && key.service === 'Ollama') {
        return !!data.model;
    }
    return true;
}, {
    message: "A model must be selected for Ollama.",
    path: ["model"],
});


export async function testAiService(values: z.infer<typeof testAiServiceSchema>): Promise<TestApiResponse> {
  const validatedFields = testAiServiceSchema.safeParse(values);
  if (!validatedFields.success) {
    return { data: { error: 'Invalid input' }, status: 400 };
  }

  const { keyId, prompt, model } = validatedFields.data;

  try {
    const key = await apiKeyService.getKeyById(keyId);
    if (!key) {
      return { data: { error: 'API Key not found.' }, status: 404 };
    }
    
    let content;
    if (key.service === 'Ollama') {
      if (!model) {
        return { data: { error: 'No Ollama model selected.' }, status: 400 };
      }
      content = await callOllamaApi(prompt, model, key.key);
    } else if (key.service === 'Google AI') {
      content = mockGoogleAiImage();
    } else {
      return { data: { error: 'Unsupported service.' }, status: 400 };
    }

    return { data: { content }, status: 200 };
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
  service: z.enum(['Ollama', 'Google AI']),
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

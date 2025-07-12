import { ApiKey } from "@/lib/types";
import { createStorage } from "./storage-service";

const storage = createStorage<ApiKey>('ai-keys.json');

export const apiKeyService = {
  async getKeys(): Promise<ApiKey[]> {
    const keys = await storage.values();
    return keys.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getKeyById(id: string): Promise<ApiKey | null> {
    const key = await storage.get(id);
    return key || null;
  },

  async addKey(service: 'Ollama' | 'Google AI', key: string): Promise<ApiKey> {
    const newKey: ApiKey = {
      id: crypto.randomUUID(),
      service,
      key,
      createdAt: new Date().toISOString(),
    };
    await storage.set(newKey.id, newKey);
    return newKey;
  },

  async updateKey(id: string, newKeyValue: string): Promise<ApiKey | null> {
    const keyToUpdate = await storage.get(id);
    if (keyToUpdate) {
      const updatedKey = { ...keyToUpdate, key: newKeyValue };
      await storage.set(id, updatedKey);
      return updatedKey;
    }
    return null;
  },

  async deleteKey(id: string): Promise<{ success: boolean }> {
    const success = await storage.delete(id);
    return { success };
  },
};

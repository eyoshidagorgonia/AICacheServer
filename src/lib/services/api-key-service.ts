
import { ApiKey, ImportStats } from "@/lib/types";
import { createStorage } from "./storage-service";

const storage = createStorage<ApiKey>('ai-keys.json');

type ConflictResolution = 'keep' | 'overwrite';

export const apiKeyService = {
  async getKeys(): Promise<ApiKey[]> {
    const keys = await storage.values();
    return keys.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getKeyById(id: string): Promise<ApiKey | null> {
    const key = await storage.get(id);
    return key || null;
  },

  async addKey(service: 'Ollama' | 'Google Gemini', key: string): Promise<ApiKey> {
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

  async clear(): Promise<void> {
    await storage.clear();
  },

  async importKeys(keysToImport: ApiKey[], conflictResolution: ConflictResolution): Promise<ImportStats> {
    const stats: ImportStats = { added: 0, updated: 0, conflicts: 0 };
    for (const key of keysToImport) {
        const existing = await storage.get(key.id);
        if (existing) {
            if (conflictResolution === 'overwrite') {
                await storage.set(key.id, key);
                stats.updated++;
            } else {
                stats.conflicts++;
            }
        } else {
            await storage.set(key.id, key);
            stats.added++;
        }
    }
    return stats;
  }
};

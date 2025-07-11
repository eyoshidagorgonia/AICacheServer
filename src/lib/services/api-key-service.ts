import fs from 'fs/promises';
import path from 'path';
import { ApiKey } from "@/lib/types";

const dataDir = path.join(process.cwd(), 'data');
const AI_KEYS_FILE_PATH = path.join(dataDir, 'ai-keys.json');

// In-memory representation of API key storage.
let apiKeys = new Map<string, ApiKey>();

async function readKeysFromFile(): Promise<Map<string, ApiKey>> {
    try {
        await fs.mkdir(dataDir, { recursive: true });
        const data = await fs.readFile(AI_KEYS_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(data);
        // The file stores an array, but we use a Map in memory.
        const keysArray: ApiKey[] = parsed.map((key: any) => ({
            ...key,
            createdAt: key.createdAt, // Dates are stored as ISO strings
        }));
        return new Map(keysArray.map(key => [key.id, key]));
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            // File doesn't exist, which is fine on first run. Return an empty map.
            return new Map<string, ApiKey>();
        }
        console.error("Error reading AI keys file:", error);
        // In case of other errors (like parsing), return an empty map to prevent crashing.
        return new Map<string, ApiKey>();
    }
}

async function writeKeysToFile(keys: Map<string, ApiKey>): Promise<void> {
    try {
        await fs.mkdir(dataDir, { recursive: true });
        // Convert Map values to an array for JSON serialization.
        const keysArray = Array.from(keys.values());
        await fs.writeFile(AI_KEYS_FILE_PATH, JSON.stringify(keysArray, null, 2), 'utf-8');
    } catch (error) {
        console.error("Error writing AI keys file:", error);
    }
}

// Initialize keys from file
(async () => {
    apiKeys = await readKeysFromFile();
    if (apiKeys.size === 0) {
        // Pre-seed with dummy data if the store is empty
        const initialKeys: ApiKey[] = [
            { id: "1", service: "Ollama", key: "ollama_sk_1a2b3c4d5e6f7g8h9i0j1a2b3c4d5e6f7g8h", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
            { id: "2", service: "Google AI", key: "gai_sk_a1b2c3d4e5f6g7h8i9j0a1b2c3d4e5f6g7h8", createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
        ];
        initialKeys.forEach(key => apiKeys.set(key.id, key));
        await writeKeysToFile(apiKeys);
    }
})();


export const apiKeyService = {
  async getKeys(): Promise<ApiKey[]> {
    apiKeys = await readKeysFromFile(); // Ensure we have the latest data
    return Array.from(apiKeys.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async addKey(service: 'Ollama' | 'Google AI', key: string): Promise<ApiKey> {
    const newKey: ApiKey = {
      id: crypto.randomUUID(),
      service,
      key,
      createdAt: new Date().toISOString(),
    };
    apiKeys.set(newKey.id, newKey);
    await writeKeysToFile(apiKeys);
    return newKey;
  },

  async updateKey(id: string, newKeyValue: string): Promise<ApiKey | null> {
    const keyToUpdate = apiKeys.get(id);
    if (keyToUpdate) {
      const updatedKey = { ...keyToUpdate, key: newKeyValue };
      apiKeys.set(id, updatedKey);
      await writeKeysToFile(apiKeys);
      return updatedKey;
    }
    return null;
  },

  async deleteKey(id: string): Promise<{ success: boolean }> {
    const success = apiKeys.delete(id);
    if (success) {
      await writeKeysToFile(apiKeys);
    }
    return { success };
  },
};

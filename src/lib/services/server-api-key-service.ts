import { ServerApiKey } from "@/lib/types";
import { createStorage } from "./storage-service";

const storage = createStorage<ServerApiKey>('server-api-keys.json');

function generateApiKey(): string {
  const prefix = 'aicsk_'; // AI Cache Server Key
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 40; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return prefix + result;
}

export const serverApiKeyService = {
  async getKeys(): Promise<ServerApiKey[]> {
    const keys = await storage.values();
    return keys
        .map(key => ({
            ...key,
            keySnippet: `...${key.key.slice(-4)}`
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async generateKey(name: string): Promise<ServerApiKey> {
    const newKey: ServerApiKey = {
      id: crypto.randomUUID(),
      name,
      key: generateApiKey(),
      keySnippet: '', // will be generated on get
      createdAt: new Date().toISOString(),
    };
    await storage.set(newKey.id, newKey);
    // Return the full key only upon creation
    return newKey;
  },

  async revokeKey(id: string): Promise<{ success: boolean }> {
    const success = await storage.delete(id);
    return { success };
  },

  async updateKeyName(id: string, newName: string): Promise<ServerApiKey | null> {
    const keyToUpdate = await storage.get(id);
    if (keyToUpdate) {
      const updatedKey = { ...keyToUpdate, name: newName };
      await storage.set(id, updatedKey);
      return updatedKey;
    }
    return null;
  },

  async validateKey(key: string): Promise<boolean> {
    const allKeys = await storage.values();
    for (const storedKey of allKeys) {
        if (storedKey.key === key) {
            return true;
        }
    }
    return false;
  }
};

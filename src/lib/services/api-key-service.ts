import { ApiKey } from "@/lib/types";

// In-memory representation of API key storage.
const apiKeys = new Map<string, ApiKey>();

// Pre-seed with some dummy data for demonstration
apiKeys.set("1", { id: "1", service: "Ollama", key: "ollama_sk_1a2b3c4d5e6f7g8h9i0j1a2b3c4d5e6f7g8h", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() });
apiKeys.set("2", { id: "2", service: "Google AI", key: "gai_sk_a1b2c3d4e5f6g7h8i9j0a1b2c3d4e5f6g7h8", createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() });


export const apiKeyService = {
  async getKeys(): Promise<ApiKey[]> {
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
    return newKey;
  },

  async updateKey(id: string, newKeyValue: string): Promise<ApiKey | null> {
    const keyToUpdate = apiKeys.get(id);
    if (keyToUpdate) {
      const updatedKey = { ...keyToUpdate, key: newKeyValue };
      apiKeys.set(id, updatedKey);
      return updatedKey;
    }
    return null;
  },

  async deleteKey(id: string): Promise<{ success: boolean }> {
    return { success: apiKeys.delete(id) };
  },
};
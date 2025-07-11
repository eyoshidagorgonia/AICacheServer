import { ApiKey } from "@/lib/types";

// In-memory representation of API key storage.
const apiKeys = new Map<string, ApiKey>();

// Pre-seed with some dummy data for demonstration
apiKeys.set("1", { id: "1", service: "Ollama", key: "ollama_sk_...", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() });
apiKeys.set("2", { id: "2", service: "Google AI", key: "gai_sk_...", createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() });


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

  async deleteKey(id: string): Promise<{ success: boolean }> {
    return { success: apiKeys.delete(id) };
  },
};

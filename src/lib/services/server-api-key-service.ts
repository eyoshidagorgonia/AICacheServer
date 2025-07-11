import { ServerApiKey } from "@/lib/types";

// In-memory representation of server API key storage.
const serverApiKeys = new Map<string, ServerApiKey>();

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
    return Array.from(serverApiKeys.values())
        .map(({ key, ...rest }) => ({
            ...rest,
            key: '****************', // Never expose the full key
            keySnippet: `aicsk...${key.slice(-4)}`
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
    serverApiKeys.set(newKey.id, newKey);
    // Return the full key only upon creation
    return newKey;
  },

  async revokeKey(id: string): Promise<{ success: boolean }> {
    return { success: serverApiKeys.delete(id) };
  },

  async validateKey(key: string): Promise<boolean> {
    for (const storedKey of serverApiKeys.values()) {
        if (storedKey.key === key) {
            return true;
        }
    }
    return false;
  }
};

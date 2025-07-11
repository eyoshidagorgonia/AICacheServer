import fs from 'fs/promises';
import path from 'path';
import { ServerApiKey } from "@/lib/types";

const dataDir = path.join(process.cwd(), 'data');
const SERVER_KEYS_FILE_PATH = path.join(dataDir, 'server-api-keys.json');

// In-memory representation of server API key storage.
let serverApiKeys = new Map<string, ServerApiKey>();

async function readKeysFromFile(): Promise<Map<string, ServerApiKey>> {
    try {
        await fs.mkdir(dataDir, { recursive: true });
        const data = await fs.readFile(SERVER_KEYS_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(data);
        const keysArray: ServerApiKey[] = parsed.map((key: any) => ({
            ...key,
            createdAt: key.createdAt,
        }));
        return new Map(keysArray.map(key => [key.id, key]));
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return new Map<string, ServerApiKey>();
        }
        console.error("Error reading server API keys file:", error);
        return new Map<string, ServerApiKey>();
    }
}

async function writeKeysToFile(keys: Map<string, ServerApiKey>): Promise<void> {
    try {
        await fs.mkdir(dataDir, { recursive: true });
        const keysArray = Array.from(keys.values());
        await fs.writeFile(SERVER_KEYS_FILE_PATH, JSON.stringify(keysArray, null, 2), 'utf-8');
    } catch (error) {
        console.error("Error writing server API keys file:", error);
    }
}

// Initialize keys from file
(async () => {
    serverApiKeys = await readKeysFromFile();
})();

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
    serverApiKeys = await readKeysFromFile(); // Ensure we have the latest data
    return Array.from(serverApiKeys.values())
        .map(key => ({
            ...key,
            keySnippet: `aicsk...${key.key.slice(-4)}`
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
    await writeKeysToFile(serverApiKeys);
    // Return the full key only upon creation
    return newKey;
  },

  async revokeKey(id: string): Promise<{ success: boolean }> {
    const success = serverApiKeys.delete(id);
    if (success) {
      await writeKeysToFile(serverApiKeys);
    }
    return { success };
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

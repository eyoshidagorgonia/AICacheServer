import { CacheStats, ActivityLog } from "@/lib/types";

// In-memory representation of our data stores.
// In a real application, this would be a database, Redis, etc.
const memoryCache = new Map<string, { value: any; expiry: number }>();
const persistentCache = new Map<string, any>();
const stats: CacheStats = {
  hits: 0,
  misses: 0,
  requests: 0,
  size: 0,
};
const activity: ActivityLog[] = [];

const MEMORY_TTL = 10 * 60 * 1000; // 10 minutes

function logActivity(type: ActivityLog['type'], model: ActivityLog['model'], prompt: string) {
  activity.unshift({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    type,
    model,
    prompt: prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt,
  });
  if (activity.length > 20) {
    activity.pop();
  }
}

export const cacheService = {
  async get(key: string): Promise<any | null> {
    stats.requests++;
    
    // Check in-memory cache first
    const memoryEntry = memoryCache.get(key);
    if (memoryEntry && memoryEntry.expiry > Date.now()) {
      stats.hits++;
      logActivity('hit', key.startsWith('ollama') ? 'Ollama' : 'Google AI', key.split('::')[1]);
      return memoryEntry.value;
    }

    // Check persistent cache
    const persistentEntry = persistentCache.get(key);
    if (persistentEntry) {
      stats.hits++;
      // Refresh in-memory cache
      memoryCache.set(key, { value: persistentEntry, expiry: Date.now() + MEMORY_TTL });
      logActivity('hit', key.startsWith('ollama') ? 'Ollama' : 'Google AI', key.split('::')[1]);
      return persistentEntry;
    }

    stats.misses++;
    logActivity('miss', key.startsWith('ollama') ? 'Ollama' : 'Google AI', key.split('::')[1]);
    return null;
  },

  async set(key: string, value: any) {
    const isNew = !persistentCache.has(key);
    
    // Set in both caches
    memoryCache.set(key, { value, expiry: Date.now() + MEMORY_TTL });
    persistentCache.set(key, value);

    if (isNew) {
      stats.size = persistentCache.size;
    }
  },

  async getStats(): Promise<CacheStats> {
    return { ...stats, size: persistentCache.size };
  },

  async getRecentActivity(): Promise<ActivityLog[]> {
    return [...activity];
  },

  addUncachedRequest(model: ActivityLog['model'], prompt: string) {
    stats.requests++;
    logActivity('no-cache', model, prompt);
  }
};

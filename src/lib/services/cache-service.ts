
import { CacheStats, ActivityLog, CacheItem, LogItem } from "@/lib/types";
import { createStorage } from "./storage-service";

const memoryCache = new Map<string, { value: any; expiry: number }>();
const persistentCache = createStorage<CacheItem>('persistent-cache.json');
const activityLogStorage = createStorage<LogItem>('activity-log.json');

const stats: CacheStats = {
  hits: 0,
  misses: 0,
  size: 0,
  requests: 0,
};

const MEMORY_TTL = 6 * 60 * 60 * 1000; // 6 hours

async function logActivity(type: ActivityLog['type'], model: ActivityLog['model'], prompt: string) {
  const allLogs = await activityLogStorage.values();
  
  const newLog: LogItem = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    type,
    model,
    prompt: prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt,
  };
  
  await activityLogStorage.set(newLog.id, newLog);

  // Keep only the most recent 20 logs
  if (allLogs.length >= 20) {
    const sortedLogs = allLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const oldestLog = sortedLogs[0];
    if (oldestLog) {
      await activityLogStorage.delete(oldestLog.id);
    }
  }
}

export const cacheService = {
  async get(key: string): Promise<any | null> {
    stats.requests++;
    
    // 1. Check memory cache first
    const memoryEntry = memoryCache.get(key);
    if (memoryEntry && memoryEntry.expiry > Date.now()) {
      stats.hits++;
      await logActivity('hit', key.split(':')[0] as any, key.split(':')[2] || key.split('::')[1]);
      return memoryEntry.value;
    }

    // 2. Check persistent cache
    const persistentEntry = await persistentCache.get(key);
    if (persistentEntry) {
      stats.hits++;
      // On persistent hit, load into memory cache
      memoryCache.set(key, { value: persistentEntry.value, expiry: Date.now() + MEMORY_TTL });
      await logActivity('hit', key.split(':')[0] as any, key.split(':')[2] || key.split('::')[1]);
      return persistentEntry.value;
    }

    // 3. If miss on both, log and return null
    stats.misses++;
    await logActivity('miss', key.split(':')[0] as any, key.split(':')[2] || key.split('::')[1]);
    return null;
  },

  async set(key: string, value: any) {
    // On a new response (cache miss), set in both memory and persistent storage
    memoryCache.set(key, { value, expiry: Date.now() + MEMORY_TTL });
    await persistentCache.set(key, { id: key, value });
    const allItems = await persistentCache.values();
    stats.size = allItems.length;
  },

  async getStats(): Promise<CacheStats> {
    const allItems = await persistentCache.values();
    return { ...stats, size: allItems.length };
  },

  async getRecentActivity(): Promise<ActivityLog[]> {
    const logs = await activityLogStorage.values();
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async addUncachedRequest(model: ActivityLog['model'], prompt: string) {
    stats.requests++;
    await logActivity('no-cache', model, prompt);
  }
};

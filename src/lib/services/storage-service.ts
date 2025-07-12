import fs from 'fs/promises';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');

type StorageItem = { id: string; [key: string]: any };

interface Storage<T extends StorageItem> {
  get(id: string): Promise<T | undefined>;
  set(id: string, item: T): Promise<void>;
  delete(id: string): Promise<boolean>;
  values(): Promise<T[]>;
  clear(): Promise<void>;
}

async function readFile<T extends StorageItem>(filePath: string): Promise<Map<string, T>> {
    try {
        await fs.mkdir(dataDir, { recursive: true });
        const data = await fs.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(data) as T[];
        return new Map(parsed.map(item => [item.id, item]));
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return new Map<string, T>();
        }
        console.error(`Error reading file ${path.basename(filePath)}:`, error);
        return new Map<string, T>();
    }
}

async function writeFile<T extends StorageItem>(filePath: string, data: Map<string, T>): Promise<void> {
    try {
        await fs.mkdir(dataDir, { recursive: true });
        const arrayData = Array.from(data.values());
        await fs.writeFile(filePath, JSON.stringify(arrayData, null, 2), 'utf-8');
    } catch (error) {
        console.error(`Error writing file ${path.basename(filePath)}:`, error);
    }
}


export function createStorage<T extends StorageItem>(fileName: string): Storage<T> {
  const filePath = path.join(dataDir, fileName);
  let memoryStorePromise: Promise<Map<string, T>> | null = null;

  async function getStore(): Promise<Map<string, T>> {
      if (!memoryStorePromise) {
          memoryStorePromise = readFile<T>(filePath);
      }
      return memoryStorePromise;
  }
  
  const get = async (id: string): Promise<T | undefined> => {
    const store = await getStore();
    return store.get(id);
  };

  const set = async (id: string, item: T): Promise<void> => {
    const store = await getStore();
    store.set(id, item);
    await writeFile(filePath, store);
  };
  
  const del = async (id: string): Promise<boolean> => {
    const store = await getStore();
    const result = store.delete(id);
    if (result) {
        await writeFile(filePath, store);
    }
    return result;
  };

  const values = async (): Promise<T[]> => {
    const store = await getStore();
    return Array.from(store.values());
  };

  const clear = async(): Promise<void> => {
    const store = await getStore();
    store.clear();
    await writeFile(filePath, store);
  };

  return { get, set, delete: del, values, clear };
}

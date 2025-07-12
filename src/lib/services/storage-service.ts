import fs from 'fs/promises';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const storageType = process.env.STORAGE_TYPE || 'file';

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
  let memoryStore = new Map<string, T>();
  let isInitialized = false;

  async function initializeStore() {
      if (!isInitialized) {
        if (storageType === 'file') {
          memoryStore = await readFile<T>(filePath);
        }
        isInitialized = true;
      }
  }
  
  const get = async (id: string): Promise<T | undefined> => {
    await initializeStore();
    return memoryStore.get(id);
  };

  const set = async (id: string, item: T): Promise<void> => {
    await initializeStore();
    memoryStore.set(id, item);
    if (storageType === 'file') {
      await writeFile(filePath, memoryStore);
    }
  };
  
  const del = async (id: string): Promise<boolean> => {
    await initializeStore();
    const result = memoryStore.delete(id);
    if (result && storageType === 'file') {
        await writeFile(filePath, memoryStore);
    }
    return result;
  };

  const values = async (): Promise<T[]> => {
    await initializeStore();
    return Array.from(memoryStore.values());
  };

  const clear = async(): Promise<void> => {
    await initializeStore();
    memoryStore.clear();
    if (storageType === 'file') {
      await writeFile(filePath, memoryStore);
    }
  };

  return { get, set, delete: del, values, clear };
}

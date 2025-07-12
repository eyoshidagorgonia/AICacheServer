
import { Model, ImportStats } from "@/lib/types";
import { createStorage } from "./storage-service";

const storage = createStorage<Model>('models.json');

type ConflictResolution = 'keep' | 'overwrite';

export const modelService = {
  async getModels(): Promise<Model[]> {
    const models = await storage.values();
    return models.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async addModel(name: string, service: 'Ollama' | 'Google Gemini'): Promise<Model> {
    const newModel: Model = {
      id: crypto.randomUUID(),
      name,
      service,
      createdAt: new Date().toISOString(),
    };
    await storage.set(newModel.id, newModel);
    return newModel;
  },

  async deleteModel(id: string): Promise<{ success: boolean }> {
    const success = await storage.delete(id);
    return { success };
  },

  async clear(): Promise<void> {
    await storage.clear();
  },

  async importModels(modelsToImport: Model[], conflictResolution: ConflictResolution): Promise<ImportStats> {
    const stats: ImportStats = { added: 0, updated: 0, conflicts: 0 };
    for (const model of modelsToImport) {
        const existing = await storage.get(model.id);
        if (existing) {
            if (conflictResolution === 'overwrite') {
                await storage.set(model.id, model);
                stats.updated++;
            } else {
                stats.conflicts++;
            }
        } else {
            await storage.set(model.id, model);
            stats.added++;
        }
    }
    return stats;
    }
};

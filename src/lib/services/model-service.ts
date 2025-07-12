import { Model } from "@/lib/types";
import { createStorage } from "./storage-service";

const storage = createStorage<Model>('models.json');

export const modelService = {
  async getModels(): Promise<Model[]> {
    const models = await storage.values();
    return models.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async addModel(name: string, service: 'Ollama' | 'Google AI'): Promise<Model> {
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
};

import fs from 'fs/promises';
import path from 'path';
import { Model } from "@/lib/types";

const dataDir = path.join(process.cwd(), 'data');
const MODELS_FILE_PATH = path.join(dataDir, 'models.json');

// In-memory representation of model storage.
let models = new Map<string, Model>();

async function readModelsFromFile(): Promise<Map<string, Model>> {
    try {
        await fs.mkdir(dataDir, { recursive: true });
        const data = await fs.readFile(MODELS_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(data);
        const modelsArray: Model[] = parsed.map((model: any) => ({
            ...model,
            createdAt: model.createdAt,
        }));
        return new Map(modelsArray.map(model => [model.id, model]));
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            // File doesn't exist, which is fine on first run. Return an empty map.
            return new Map<string, Model>();
        }
        console.error("Error reading models file:", error);
        return new Map<string, Model>();
    }
}

async function writeModelsToFile(modelsMap: Map<string, Model>): Promise<void> {
    try {
        await fs.mkdir(dataDir, { recursive: true });
        const modelsArray = Array.from(modelsMap.values());
        await fs.writeFile(MODELS_FILE_PATH, JSON.stringify(modelsArray, null, 2), 'utf-8');
    } catch (error) {
        console.error("Error writing models file:", error);
    }
}

// Initialize models from file
(async () => {
    models = await readModelsFromFile();
})();

export const modelService = {
  async getModels(): Promise<Model[]> {
    models = await readModelsFromFile(); // Ensure we have the latest data
    return Array.from(models.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async addModel(name: string, service: 'Ollama' | 'Google AI'): Promise<Model> {
    const newModel: Model = {
      id: crypto.randomUUID(),
      name,
      service,
      createdAt: new Date().toISOString(),
    };
    models.set(newModel.id, newModel);
    await writeModelsToFile(models);
    return newModel;
  },

  async deleteModel(id: string): Promise<{ success: boolean }> {
    const success = models.delete(id);
    if (success) {
      await writeModelsToFile(models);
    }
    return { success };
  },
};

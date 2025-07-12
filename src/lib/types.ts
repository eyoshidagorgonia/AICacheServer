
export type CacheStats = {
  hits: number;
  misses: number;
  size: number;
  requests: number;
};

export type ApiKey = {
  id: string;
  service: 'Ollama' | 'Google Gemini';
  key: string;
  createdAt: string;
};

export type ServerApiKey = {
  id: string;
  name: string;
  key: string;
  keySnippet: string;
  createdAt: string;
}

export type ProxyResponse = {
  content: string;
  isCached: boolean;
  error?: string | null;
  decisionReason?: string;
  shouldCache?: boolean;
};

export type ActivityLog = {
  id: string;
  timestamp: string;
  type: 'hit' | 'miss' | 'no-cache';
  model: 'Ollama' | 'Google Gemini';
  prompt: string;
};

export type KeyHealth = {
  id: string;
  service: string;
  keySnippet: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  statusSummary: string;
};

export type TestApiResponse = {
  data: any;
  status: number;
};

export type Model = {
  id: string;
  name: string;
  service: 'Ollama' | 'Google Gemini';
  createdAt: string;
};


// Settings Page Types
export type AllData = {
  aiKeys: ApiKey[];
  serverApiKeys: ServerApiKey[];
  models: Model[];
};

export type ImportStats = {
  added: number;
  updated: number;
  conflicts: number;
};

export type ImportResult = {
  type: 'success';
  aiKeys: ImportStats;
  serverApiKeys: ImportStats;
  models: ImportStats;
} | {
  type: 'error';
  message: string;
};

export type ModelHealth = {
    service: string;
    status: 'active' | 'inactive';
};

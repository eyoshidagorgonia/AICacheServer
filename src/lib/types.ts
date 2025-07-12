export type CacheStats = {
  hits: number;
  misses: number;
  size: number;
  requests: number;
};

export type ApiKey = {
  id: string;
  service: 'Ollama' | 'Google AI';
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
  model: 'Ollama' | 'Google AI';
  prompt: string;
};

export type KeyHealth = {
  id: string;
  service: string;
  keySnippet: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
};

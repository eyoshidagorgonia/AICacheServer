# **App Name**: AICache

## Core Features:

- Configurable Cache: Configurable cache settings for TTL and max size using persistent volume `aicachestorage` in a Windows Docker Desktop environment. Cache misses are stored in persistent storage and in memory and have a 10min memory ttl, cache hits update memory and persistent storage
- Real-time Monitoring: Real-time dashboard displaying cache hit rate and handled requests.
- AI Model Proxy: Proxy service that intercepts AI model requests and serves them from the cache when available. Admin UI and API service are separate services
- AI Model Support: Supports Google AI for image requests and Ollama for text requests.
- Intelligent Caching: LLM tool intelligently determines which prompts sent to Ollama should be cached based on prompt content to optimize storage.
- API Key Manager: API key manager that stores keys in persistent docker volume

## Style Guidelines:

- Dark, gritty color palette with prominent use of browns, reds, and blacks, reminiscent of a dark fantasy setting.
- Use of metallic textures and highlights to simulate the look of aged metal and worn surfaces.
- Limited use of vibrant colors, mainly for highlighting interactive elements or important information.
- Cluttered, asymmetrical layout with elements overlapping and intersecting to create a sense of depth and realism.
- Gothic or medieval-style fonts with a weathered, distressed look to enhance the dark fantasy theme.
- Use of ornate borders and embellishments around text elements to add visual interest.
- Detailed, realistic icons with a hand-drawn or engraved appearance, depicting weapons, armor, and other thematic elements.
- Subtle, flickering animations for elements like torches, embers, and magical effects to create a dynamic atmosphere.
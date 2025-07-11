import { getServerApiKeys } from "@/app/actions";
import { ApiKeyManager } from "@/components/api-key-manager";

export default async function ServerApiKeysPage() {
  const apiKeys = await getServerApiKeys();

  return (
    <div className="container relative flex flex-col py-8">
       <div className="text-left mb-8">
            <h1 className="text-4xl font-headline font-bold text-foreground tracking-wider">API Key Manager</h1>
            <p className="text-muted-foreground mt-2">
                Generate and manage API keys for accessing this proxy server.
            </p>
        </div>
      <ApiKeyManager initialKeys={apiKeys} />
    </div>
  );
}

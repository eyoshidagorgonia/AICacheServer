import { getApiKeys } from "@/app/actions";
import { AiKeyManager } from "@/components/ai-key-manager";

export default async function ApiKeysPage() {
  const apiKeys = await getApiKeys();

  return (
    <div className="container relative flex flex-col py-8">
       <div className="text-left mb-8">
            <h1 className="text-4xl font-headline font-bold text-foreground tracking-wider">AI Key Manager</h1>
            <p className="text-muted-foreground mt-2">
                Manage your AI service keys.
            </p>
        </div>
      <AiKeyManager initialKeys={apiKeys} />
    </div>
  );
}

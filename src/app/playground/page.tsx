import { PlaygroundClient } from "@/components/playground-client";
import { getApiKeys, getModels } from "@/app/actions";

export default async function PlaygroundPage() {
  const aiKeys = await getApiKeys();
  const models = await getModels();

  return (
    <div className="container relative flex flex-col items-center py-8">
      <div className="w-full max-w-4xl">
         <div className="text-center mb-8">
            <h1 className="text-4xl font-headline font-bold text-foreground tracking-wider">AI Service Playground</h1>
            <p className="text-muted-foreground mt-2">
                Directly test your configured AI service keys.
            </p>
        </div>
        <PlaygroundClient aiKeys={aiKeys} models={models} />
      </div>
    </div>
  );
}

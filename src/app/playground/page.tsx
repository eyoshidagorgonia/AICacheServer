import { PlaygroundClient } from "@/components/playground-client";
import { getServerApiKeys } from "@/app/actions";

export default async function PlaygroundPage() {
  const serverKeys = await getServerApiKeys();

  return (
    <div className="container relative flex flex-col items-center py-8">
      <div className="w-full max-w-4xl">
         <div className="text-center mb-8">
            <h1 className="text-4xl font-headline font-bold text-foreground tracking-wider">API Playground</h1>
            <p className="text-muted-foreground mt-2">
                Construct and test requests to your <code className="font-code text-sm bg-black/30 p-1 rounded-md">/api/proxy</code> endpoint.
            </p>
        </div>
        <PlaygroundClient serverKeys={serverKeys} />
      </div>
    </div>
  );
}

import { getModels } from "@/app/actions";
import { ProxyForm } from "@/components/proxy-form";

export default async function ProxyPage() {
  const models = await getModels();
  
  return (
    <div className="container relative flex flex-col items-center py-8">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-headline font-bold text-foreground tracking-wider">AI Proxy Interface</h1>
            <p className="text-muted-foreground mt-2">
                Send requests to AI models. Responses may be served from cache.
            </p>
        </div>
        <ProxyForm models={models} />
      </div>
    </div>
  );
}

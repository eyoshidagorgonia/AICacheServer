import { getModels } from "@/app/actions";
import { ModelManager } from "@/components/model-manager";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default async function ModelsPage() {
  const models = await getModels();

  return (
    <div className="container relative flex flex-col py-8">
       <div className="text-left mb-8">
            <h1 className="text-4xl font-headline font-bold text-foreground tracking-wider">Model Manager</h1>
            <p className="text-muted-foreground mt-2">
                Manage your AI models. These records are stored in the persistent volume.
            </p>
        </div>
        <Alert className="mb-6 bg-accent/30 border-accent">
          <Info className="h-4 w-4 text-accent-foreground" />
          <AlertTitle className="font-headline text-accent-foreground">Default Model Information</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            If no model is specified in a request to the Ollama service, the proxy will automatically use the <code className="font-code text-sm bg-black/30 p-1 rounded-md">llama3.1:8b</code> model as a default.
          </AlertDescription>
        </Alert>
      <ModelManager initialModels={models} />
    </div>
  );
}

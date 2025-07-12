import { getModels } from "@/app/actions";
import { ModelManager } from "@/components/model-manager";

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
      <ModelManager initialModels={models} />
    </div>
  );
}

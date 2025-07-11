import { IntegrationClient } from "@/components/integration-client";

export default function IntegrationPage() {
  return (
    <div className="container relative flex flex-col py-8">
      <div className="text-left mb-8">
        <h1 className="text-4xl font-headline font-bold text-foreground tracking-wider">API Integration</h1>
        <p className="text-muted-foreground mt-2">
          How to integrate with the AICache proxy server.
        </p>
      </div>
      <IntegrationClient />
    </div>
  );
}

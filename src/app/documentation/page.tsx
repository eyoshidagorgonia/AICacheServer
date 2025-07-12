import { DocumentationClient } from "@/components/documentation-client";

export default function DocumentationPage() {
  return (
    <div className="container relative flex flex-col py-8">
      <div className="text-left mb-8">
        <h1 className="text-4xl font-headline font-bold text-foreground tracking-wider">Developer Documentation</h1>
        <p className="text-muted-foreground mt-2">
          How to integrate with and use the AICache proxy server.
        </p>
      </div>
      <DocumentationClient />
    </div>
  );
}


'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

function CodeBlock({ code, language }: { code: string, language: string }) {
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();
  
    const handleCopy = () => {
      navigator.clipboard.writeText(code);
      setCopied(true);
      toast({ title: 'Copied to clipboard!' });
      setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group">
            <pre className="bg-black/40 text-sm rounded-md p-4 overflow-x-auto font-code border border-border/60">
                <code className={`language-${language}`}>
                    {code}
                </code>
            </pre>
            <Button 
                size="icon" 
                variant="ghost" 
                className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleCopy}
            >
                {copied ? <Check className="text-green-500" /> : <Copy />}
            </Button>
        </div>
    );
}

const curlExample = `
curl -X POST http://localhost:9002/api/proxy \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_SERVER_API_KEY" \\
  -d '{
    "model": "ollama",
    "prompt": "Tell me a short story about a robot."
  }'
`.trim();

const jsExample = `
async function callProxy() {
  const response = await fetch('http://localhost:9002/api/proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_SERVER_API_KEY'
    },
    body: JSON.stringify({
      model: 'ollama', // or 'google'
      prompt: 'Tell me a short story about a robot.'
    })
  });

  const data = await response.json();
  console.log(data);
}

callProxy();
`.trim();

const tsExample = `
interface ProxyResponse {
  content: string;
  isCached: boolean;
  error?: string;
}

async function callProxy(): Promise<ProxyResponse> {
  const response = await fetch('http://localhost:9002/api/proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_SERVER_API_KEY'
    },
    body: JSON.stringify({
      model: 'ollama', // or 'google'
      prompt: 'Tell me a short story about a robot.'
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'An unknown error occurred');
  }

  const data: ProxyResponse = await response.json();
  console.log(data);
  return data;
}

callProxy();
`.trim();

const requestSchema = `
{
  "model": "ollama" | "google", // Required. The target AI model.
  "prompt": "string"            // Required. The prompt to send to the model.
}
`.trim();

const responseSchema = `
// Successful Response (200 OK)
{
  "content": "string",  // The AI-generated response or image URL.
  "isCached": "boolean" // True if the response was served from cache.
}

// Error Response (e.g., 400, 401, 500)
{
  "error": "string" // A description of the error.
}
`.trim();

const devPrompt = `
You are an expert AI programmer helping me update my Next.js AICache application.

Here is the existing context for the API integration page:
The page explains how to use the proxy API endpoint at \`/api/proxy\`.

**Authentication:**
- It's a POST request requiring an \`Authorization: Bearer YOUR_SERVER_API_KEY\` header.

**Schemas:**
- **Request:** JSON with a required \`model\` ('ollama' or 'google') and a required \`prompt\` (string).
- **Response:** JSON with \`content\` (string) and \`isCached\` (boolean), or an \`error\` (string).

**Code Examples:**
- The page already has examples for cURL, JavaScript, and TypeScript.

My goal is to: [DESCRIBE YOUR GOAL HERE, e.g., "add a Python code example"]

Please provide the necessary code changes.
`.trim();

export function IntegrationClient() {
    return (
        <div className="space-y-8">
            <Card className="bg-card/80 backdrop-blur-sm border-border/60 shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline">Endpoint</CardTitle>
                    <CardDescription>
                        The single endpoint for all proxy requests.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">POST</span>
                        <pre className="text-sm font-code">/api/proxy</pre>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-border/60 shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline">Authentication</CardTitle>
                    <CardDescription>
                        Requests must be authenticated using a Server API Key. Generate one from the "API Keys" page.
                        The key should be included in the <code className="font-code text-sm bg-black/30 p-1 rounded-md">Authorization</code> header.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CodeBlock code={'Authorization: Bearer YOUR_SERVER_API_KEY'} language="text" />
                </CardContent>
            </Card>
            
            <Card className="bg-card/80 backdrop-blur-sm border-border/60 shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline">Code Examples</CardTitle>
                     <CardDescription>
                        Here’s how you can call the API from different environments.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="curl">
                        <TabsList className="bg-accent/30 grid w-full grid-cols-3">
                            <TabsTrigger value="curl">cURL</TabsTrigger>
                            <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                            <TabsTrigger value="typescript">TypeScript</TabsTrigger>
                        </TabsList>
                        <TabsContent value="curl" className="mt-4">
                            <CodeBlock code={curlExample} language="bash" />
                        </TabsContent>
                        <TabsContent value="javascript" className="mt-4">
                            <CodeBlock code={jsExample} language="javascript" />
                        </TabsContent>
                         <TabsContent value="typescript" className="mt-4">
                            <CodeBlock code={tsExample} language="typescript" />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-border/60 shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline">Schemas</CardTitle>
                    <CardDescription>
                        The request and response formats.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="font-bold mb-2">Request Body</h3>
                        <CodeBlock code={requestSchema} language="json" />
                    </div>
                    <div>
                        <h3 className="font-bold mb-2">Response Body</h3>
                        <CodeBlock code={responseSchema} language="json" />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-border/60 shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline">Development Prompt</CardTitle>
                    <CardDescription>
                        Use this prompt in Firebase Studio to get help with API integration tasks.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CodeBlock code={devPrompt} language="text" />
                </CardContent>
            </Card>
        </div>
    );
}


'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Terminal, Database, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
        <div className="relative group my-4">
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

const dockerComposeExample = `docker-compose up --build`;

const curlExample = `
curl http://localhost:9002/api/proxy \\
  -X POST \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "service": "ollama",
    "model": "llama3.1:8b",
    "prompt": "Why is the sky blue?"
  }'
`.trim();

const pythonExample = `
import requests
import json

api_key = "YOUR_API_KEY"
proxy_url = "http://localhost:9002/api/proxy"

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {api_key}"
}

data = {
    "service": "ollama",
    "model": "llama3.1:8b",
    "prompt": "Why is the sky blue?"
}

response = requests.post(proxy_url, headers=headers, data=json.dumps(data))

if response.status_code == 200:
    print(response.json())
else:
    print(f"Error: {response.status_code}")
    print(response.text)
`.trim();

const nodeExample = `
const axios = require('axios');

const apiKey = 'YOUR_API_KEY';
const proxyUrl = 'http://localhost:9002/api/proxy';

const headers = {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${apiKey}\`
};

const data = {
    service: 'ollama',
    model: 'llama3.1:8b',
    prompt: 'Why is the sky blue?'
};

axios.post(proxyUrl, data, { headers })
    .then(response => {
        console.log(response.data);
    })
    .catch(error => {
        console.error('Error:', error.response ? error.response.data : error.message);
    });
`.trim();

const tsExample = `
async function callProxy() {
  const apiKey = 'YOUR_API_KEY';
  const proxyUrl = 'http://localhost:9002/api/proxy';

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${apiKey}\`,
  };

  const body = {
    service: 'ollama', // or "google"
    model: 'llama3.1:8b',
    prompt: 'Why is the sky blue?',
  };

  try {
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

callProxy();
`.trim();

const requestSchema = `
interface ProxyRequest {
  // The service to proxy the request to.
  service: "ollama" | "google";

  // The specific model to use for the request.
  // Required for the "ollama" service.
  model: string;
  
  // The prompt for the AI model.
  prompt: string;
}
`.trim();

const responseSchema = `
interface ProxyResponse {
  // The content returned from the AI model.
  content: string;

  // Whether the response was served from the cache.
  isCached: boolean;
}
`.trim();

export function DocumentationClient() {
    return (
        <div className="space-y-8">
            <Card className="bg-card/80 backdrop-blur-sm border-border/60 shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Terminal/> Getting Started</CardTitle>
                    <CardDescription>How to run the services using Docker.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="mb-4 text-sm text-muted-foreground">The simplest way to run the Admin UI and the API Proxy is by using Docker Compose. From the root of the project directory, run the following command:</p>
                    <CodeBlock code={dockerComposeExample} language="bash" />
                     <p className="mt-4 text-sm text-muted-foreground">This will start the Admin UI on port <code className="font-code text-sm bg-black/30 p-1 rounded-md">9002</code>, which includes the API proxy route.</p>
                </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-border/60 shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline">Authentication</CardTitle>
                    <CardDescription>
                        All API requests require an API key for authentication. You must include your API key in the <code className="font-code text-sm bg-black/30 p-1 rounded-md">Authorization</code> header of your request, using the <code className="font-code text-sm bg-black/30 p-1 rounded-md">Bearer</code> scheme. You can generate keys from the "API Keys" tab in the dashboard.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CodeBlock code={'Authorization: Bearer YOUR_API_KEY'} language="text" />
                </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-border/60 shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline">Making Requests</CardTitle>
                     <CardDescription>
                        Send requests to the proxy endpoint to interact with the configured AI models.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="mb-2 text-sm text-muted-foreground">Your API proxy endpoint is:</p>
                    <pre className="text-sm font-code bg-black/40 p-2 rounded-md border border-border/60">POST http://localhost:9002/api/proxy</pre>
                     <Alert variant="destructive" className="mt-4">
                        <Info className="h-4 w-4" />
                        <AlertTitle>Important</AlertTitle>
                        <AlertDescription>
                            The proxy uses its own configured AI keys for services like Ollama and Google AI. The API key you provide is for authenticating with this proxy server only.
                        </AlertDescription>
                    </Alert>
                    <p className="mt-4 mb-2 text-sm text-muted-foreground">Below are examples of how to call the proxy endpoint from different languages.</p>
                    
                    <h3 className="font-headline text-lg mt-6">cURL</h3>
                    <CodeBlock code={curlExample} language="bash" />
                    
                    <h3 className="font-headline text-lg mt-6">Python</h3>
                    <CodeBlock code={pythonExample} language="python" />

                    <h3 className="font-headline text-lg mt-6">Node.js</h3>
                    <CodeBlock code={nodeExample} language="javascript" />

                    <h3 className="font-headline text-lg mt-6">TypeScript</h3>
                    <CodeBlock code={tsExample} language="typescript" />
                </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-border/60 shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Database /> Schemas</CardTitle>
                    <CardDescription>
                        Type definitions for API requests and responses.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <h3 className="font-headline text-lg mt-4">Request Body</h3>
                    <CodeBlock code={requestSchema} language="typescript" />

                    <h3 className="font-headline text-lg mt-6">Response Body</h3>
                    <CodeBlock code={responseSchema} language="typescript" />
                </CardContent>
            </Card>
        </div>
    );
}

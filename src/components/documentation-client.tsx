
'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Terminal, FileCode, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const dockerComposeExample = `docker-compose up --build`;

const curlExample = `
curl http://localhost:9003/api/v1/proxy/generate \\
  -X POST \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "llama3",
    "prompt": "Why is the sky blue?",
    "stream": false
  }'
`.trim();

const pythonExample = `
import requests
import json

api_key = "YOUR_API_KEY"
proxy_url = "http://localhost:9003/api/v1/proxy/generate"

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {api_key}"
}

data = {
    "model": "llama3",
    "prompt": "Why is the sky blue?",
    "stream": False
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
const proxyUrl = 'http://localhost:9003/api/v1/proxy/generate';

const headers = {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${apiKey}\`
};

const data = {
    model: 'llama3',
    prompt: 'Why is the sky blue?',
    stream: false
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
async function generateText() {
  const apiKey = 'YOUR_API_KEY';
  const proxyUrl = 'http://localhost:9003/api/v1/proxy/generate';

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${apiKey}\`,
  };

  const body = {
    model: 'llama3',
    prompt: 'Why is the sky blue?',
    stream: false,
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

generateText();
`.trim();

const requestSchema = `
interface GenerateRequest {
  model: string; // Note: This parameter is overridden by the proxy.
  prompt: string;
  stream?: boolean;
  // ...other standard Ollama API parameters like 'options', 'system', etc.
}
`.trim();

const responseSchema = `
interface GenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
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
                    <p className="mt-4 text-sm text-muted-foreground">This will start the Admin UI on port <code className="font-code text-sm bg-black/30 p-1 rounded-md">9002</code> and the API Proxy service on port <code className="font-code text-sm bg-black/30 p-1 rounded-md">9003</code>.</p>
                </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-border/60 shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline">Authentication</CardTitle>
                    <CardDescription>
                        All API requests require an API key for authentication. Include your key in the <code className="font-code text-sm bg-black/30 p-1 rounded-md">Authorization</code> header. You can generate keys from the "API Keys" tab in the dashboard.
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
                        The proxy forwards requests to the Ollama API using the standard Ollama API routes.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="mb-2 text-sm text-muted-foreground">Your API proxy endpoint is:</p>
                    <pre className="text-sm font-code bg-black/40 p-2 rounded-md border border-border/60">http://localhost:9003/api/v1/proxy</pre>
                     <Alert variant="destructive" className="mt-4">
                        <AlertTitle>Model Override</AlertTitle>
                        <AlertDescription>
                            Please note that the proxy is configured to override the <code className="font-code text-sm bg-black/30 p-1 rounded-md">model</code> parameter. All requests will be processed using the <code className="font-code text-sm bg-black/30 p-1 rounded-md">llama3.1:8b</code> model, regardless of the value you send.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

             <Card className="bg-card/80 backdrop-blur-sm border-border/60 shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><FileCode /> Code Examples</CardTitle>
                    <CardDescription>
                        Here’s how you can call the API from different environments.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="curl" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 bg-accent/30">
                            <TabsTrigger value="curl">cURL</TabsTrigger>
                            <TabsTrigger value="python">Python</TabsTrigger>
                            <TabsTrigger value="node">Node.js</TabsTrigger>
                            <TabsTrigger value="typescript">TypeScript</TabsTrigger>
                        </TabsList>
                        <TabsContent value="curl" className="mt-4">
                            <CodeBlock code={curlExample} language="bash" />
                        </TabsContent>
                        <TabsContent value="python" className="mt-4">
                            <CodeBlock code={pythonExample} language="python" />
                        </TabsContent>
                        <TabsContent value="node" className="mt-4">
                            <CodeBlock code={nodeExample} language="javascript" />
                        </TabsContent>
                        <TabsContent value="typescript" className="mt-4">
                            <CodeBlock code={tsExample} language="typescript" />
                        </TabsContent>
                    </Tabs>
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
                    <Tabs defaultValue="request" className="w-full">
                         <TabsList className="grid w-full grid-cols-2 bg-accent/30">
                            <TabsTrigger value="request">Request Body</TabsTrigger>
                            <TabsTrigger value="response">Response Body</TabsTrigger>
                        </TabsList>
                        <TabsContent value="request" className="mt-4">
                             <CodeBlock code={requestSchema} language="typescript" />
                        </TabsContent>
                         <TabsContent value="response" className="mt-4">
                            <CodeBlock code={responseSchema} language="typescript" />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

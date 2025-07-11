'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send, HelpCircle } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const playgroundSchema = z.object({
  apiUrl: z.string().url({ message: 'Please enter a valid URL.' }),
  apiKey: z.string().min(1, { message: 'API Key is required.' }),
  model: z.enum(['ollama', 'google']),
  prompt: z.string().min(1, { message: 'Prompt cannot be empty.' }),
});

type PlaygroundFormValues = z.infer<typeof playgroundSchema>;

type ApiResponse = {
  data: any;
  status: number;
  time: number;
  error?: boolean;
};

function ApiResponseDisplay({ response }: { response: ApiResponse | null }) {
    if (!response) return null;

    const { data, status, time, error } = response;

    return (
        <Card className="mt-6 bg-card/80 backdrop-blur-sm border-border/60 shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline">Response</CardTitle>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <div>
                        Status: <span className={error ? "text-destructive" : "text-green-400"}>{status}</span>
                    </div>
                    <div>
                        Time: <span className="text-primary">{time.toFixed(2)}ms</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <pre className="text-sm whitespace-pre-wrap font-code p-4 bg-black/40 rounded-md overflow-x-auto">
                    {JSON.stringify(data, null, 2)}
                </pre>
            </CardContent>
        </Card>
    );
}

function LabelWithTooltip({ htmlFor, label, tooltipText }: { htmlFor: string; label: string; tooltipText: string }) {
    return (
        <div className="flex items-center gap-1.5">
            <FormLabel htmlFor={htmlFor}>{label}</FormLabel>
            <Tooltip>
                <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                    <p className="max-w-xs">{tooltipText}</p>
                </TooltipContent>
            </Tooltip>
        </div>
    )
}

export function PlaygroundClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);

  const form = useForm<PlaygroundFormValues>({
    resolver: zodResolver(playgroundSchema),
    defaultValues: {
      apiUrl: typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/api/proxy` : '/api/proxy',
      apiKey: '',
      model: 'ollama',
      prompt: 'Tell me a short story about a brave squirrel.',
    },
  });

  const onSubmit: SubmitHandler<PlaygroundFormValues> = async (values) => {
    setIsLoading(true);
    setApiResponse(null);
    const startTime = performance.now();

    try {
      const response = await fetch(values.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${values.apiKey}`,
        },
        body: JSON.stringify({
          model: values.model,
          prompt: values.prompt,
        }),
      });

      const endTime = performance.now();
      const data = await response.json();
      
      setApiResponse({
        data,
        status: response.status,
        time: endTime - startTime,
        error: !response.ok,
      });

    } catch (error: any) {
        const endTime = performance.now();
        setApiResponse({
            data: { error: "Failed to fetch. Check the console and ensure the API URL is correct and reachable." },
            status: 500,
            time: endTime - startTime,
            error: true,
        });
        console.error("API Playground Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Card className="bg-card/80 backdrop-blur-sm border-border/60 shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline">Request Builder</CardTitle>
            <CardDescription>Fill out the form below to send a request to your API.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="apiUrl"
                    render={({ field }) => (
                        <FormItem>
                            <LabelWithTooltip htmlFor='apiUrl' label="Endpoint URL" tooltipText="The full URL of your proxy API endpoint. For local development, this is typically http://localhost:9002. When running in Docker, it's http://localhost:3000." />
                            <FormControl>
                                <Input id="apiUrl" placeholder="https://your-app-url/api/proxy" {...field} className="bg-input/70" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="apiKey"
                    render={({ field }) => (
                        <FormItem>
                            <LabelWithTooltip htmlFor='apiKey' label="Server API Key" tooltipText="Your secret server API key. Generate one from the 'API Keys' page." />
                            <FormControl>
                                <Input id="apiKey" type="password" placeholder="aicsk_..." {...field} className="bg-input/70" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                    />
              </div>

               <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                    <FormItem>
                        <LabelWithTooltip htmlFor={field.name} label="Model" tooltipText="The AI model to use for the request. 'ollama' is for text generation and 'google' is for image generation." />
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger className="bg-input/70">
                            <SelectValue placeholder="Select a model" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="ollama">ollama (Text)</SelectItem>
                            <SelectItem value="google">google (Image)</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              
              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <LabelWithTooltip htmlFor='prompt' label="Prompt" tooltipText="The input prompt to send to the selected AI model." />
                    <FormControl>
                      <Textarea id="prompt" placeholder="Enter your prompt here..." className="min-h-[120px] bg-input/70" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading} className="font-bold tracking-wider">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Send Request
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <ApiResponseDisplay response={apiResponse} />
    </TooltipProvider>
  );
}

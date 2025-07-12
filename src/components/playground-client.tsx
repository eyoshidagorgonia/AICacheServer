'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send, HelpCircle, AlertTriangle } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ApiKey, TestApiResponse } from '@/lib/types';
import { testAiService } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const playgroundSchema = z.object({
  keyId: z.string().min(1, { message: 'An AI Key must be selected.' }),
  model: z.enum(['Ollama', 'Google AI'], { errorMap: () => ({ message: "Please select a key first."}) }),
  prompt: z.string().min(1, { message: 'Prompt cannot be empty.' }),
});

type PlaygroundFormValues = z.infer<typeof playgroundSchema>;

function ApiResponseDisplay({ response }: { response: TestApiResponse | null }) {
    if (!response) return null;

    const { data, status } = response;
    const error = status >= 400;

    return (
        <Card className="mt-6 bg-card/80 backdrop-blur-sm border-border/60 shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline">Response</CardTitle>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <div>
                        Status: <span className={error ? "text-destructive" : "text-green-400"}>{status}</span>
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
        <TooltipProvider>
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
        </TooltipProvider>
    )
}

export function PlaygroundClient({ aiKeys }: { aiKeys: ApiKey[] }) {
  const [isPending, startTransition] = useTransition();
  const [apiResponse, setApiResponse] = useState<TestApiResponse | null>(null);

  const form = useForm<PlaygroundFormValues>({
    resolver: zodResolver(playgroundSchema),
    defaultValues: {
      keyId: '',
      prompt: 'Tell me a short story about a brave squirrel.',
    },
  });

  const selectedKeyId = form.watch('keyId');
  const selectedKey = aiKeys.find(k => k.id === selectedKeyId);
  
  useEffect(() => {
    if (selectedKey) {
        form.setValue('model', selectedKey.service);
    }
  }, [selectedKey, form]);


  const onSubmit: SubmitHandler<PlaygroundFormValues> = async (values) => {
    setApiResponse(null);
    startTransition(async () => {
        const response = await testAiService(values);
        setApiResponse(response);
    });
  };

  return (
    <div>
      {aiKeys.length === 0 && (
         <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No AI Keys Found</AlertTitle>
          <AlertDescription>
            You must add an AI service key on the "AI Keys" page before you can use the playground.
          </AlertDescription>
        </Alert>
      )}
      <Card className="bg-card/80 backdrop-blur-sm border-border/60 shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline">Request Builder</CardTitle>
            <CardDescription>Select a key and write a prompt to test an AI service directly.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="keyId"
                    render={({ field }) => (
                        <FormItem>
                        <LabelWithTooltip htmlFor='keyId' label="AI Service Key" tooltipText="The AI key to use for the request. Add more on the 'AI Keys' page." />
                        <Select onValueChange={(value) => {
                            field.onChange(value);
                            const key = aiKeys.find(k => k.id === value);
                            if (key) {
                                form.setValue('model', key.service);
                            }
                        }} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger id="keyId" className="bg-input/70">
                                <SelectValue placeholder="Select an AI Key" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {aiKeys.map(key => (
                                <SelectItem key={key.id} value={key.id}>
                                    {key.service} (...{key.key.slice(-4)})
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                        control={form.control}
                        name="model"
                        render={({ field }) => (
                        <FormItem>
                            <LabelWithTooltip htmlFor='model' label="Model" tooltipText="This is automatically selected based on your chosen key." />
                            <FormControl>
                                <Input id="model" {...field} className="bg-input/70" readOnly placeholder="Select a key to see the model"/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
              
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
                <Button type="submit" disabled={isPending || aiKeys.length === 0} className="font-bold tracking-wider">
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Send Request
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <ApiResponseDisplay response={apiResponse} />
    </div>
  );
}

'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { submitOllamaPrompt, submitGoogleAiPrompt } from '@/app/actions';
import type { ProxyResponse, Model, ApiKey } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, AlertTriangle, Sparkles, HelpCircle } from 'lucide-react';
import { Label } from './ui/label';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="font-bold tracking-wider">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : children}
    </Button>
  );
}

function ResponseCard({ response }: { response: ProxyResponse | null }) {
  if (!response) return null;

  return (
    <Card className="mt-6 bg-card/80 backdrop-blur-sm border-border/60 shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="font-headline">Response</CardTitle>
                {response.error && <CardDescription className="text-destructive">{response.error}</CardDescription>}
            </div>
            <div className='flex flex-col items-end gap-2'>
              <Badge variant={response.isCached ? 'default' : 'secondary'} className={response.isCached ? 'bg-green-800/50 text-green-300 border-green-600/50' : 'bg-amber-800/50 text-amber-300 border-amber-600/50'}>
                {response.isCached ? <><Check className="mr-1 h-3 w-3" /> Cached</> : <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Live</>}
              </Badge>
              {typeof response.shouldCache === 'boolean' && (
                <Badge variant={response.shouldCache ? 'outline' : 'destructive'}>
                  {response.shouldCache ? <><Sparkles className="mr-1 h-3 w-3" /> Will Cache</> : <><AlertTriangle className="mr-1 h-3 w-3" /> Won't Cache</>}
                </Badge>
              )}
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {response.content.startsWith('https://') ? (
            <Image src={response.content} alt="Generated image" width={512} height={512} className="rounded-md border border-border" data-ai-hint="abstract texture" />
        ) : (
            <pre className="text-sm whitespace-pre-wrap font-body p-4 bg-black/20 rounded-md">{response.content}</pre>
        )}
      </CardContent>
      {response.decisionReason && (
        <CardFooter className="text-xs text-muted-foreground flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            <span>AI Caching Decision: <i>{response.decisionReason}</i></span>
        </CardFooter>
      )}
    </Card>
  );
}

type ProxyFormProps = {
  models: Model[];
  apiKeys: ApiKey[];
};

export function ProxyForm({ models, apiKeys }: ProxyFormProps) {
  const [ollamaState, ollamaAction] = useActionState<ProxyResponse | null, FormData>(submitOllamaPrompt, null);
  const [googleState, googleAction] = useActionState<ProxyResponse | null, FormData>(submitGoogleAiPrompt, null);

  const ollamaModels = models.filter(m => m.service === 'Ollama');
  const ollamaKeys = apiKeys.filter(k => k.service === 'Ollama');
  const googleKeys = apiKeys.filter(k => k.service === 'Google AI');

  return (
    <Tabs defaultValue="ollama" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-accent/30">
        <TabsTrigger value="ollama" className="font-headline">Ollama (Text)</TabsTrigger>
        <TabsTrigger value="google" className="font-headline">Google AI (Image)</TabsTrigger>
      </TabsList>
      <TabsContent value="ollama">
        <Card className="bg-transparent border-0 shadow-none">
          <form action={ollamaAction}>
            <CardContent className="space-y-4 p-0 pt-6">
                {ollamaKeys.length === 0 && (
                     <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>No Ollama Key Found</AlertTitle>
                      <AlertDescription>
                        You must add an Ollama AI service key on the "AI Keys" page to use this feature.
                      </AlertDescription>
                    </Alert>
                )}
               <div className="space-y-2">
                 <Label htmlFor="ollama-key" className='font-bold'>AI Key</Label>
                 <Select name="keyId" required>
                    <SelectTrigger id="ollama-key" className="bg-input/70" disabled={ollamaKeys.length === 0}>
                      <SelectValue placeholder="Select an Ollama AI Key" />
                    </SelectTrigger>
                    <SelectContent>
                      {ollamaKeys.map(key => (
                        <SelectItem key={key.id} value={key.id}>
                          {key.service} (...{key.key.slice(-4)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
               </div>
               <div className="space-y-2">
                 <Label htmlFor="ollama-model" className='font-bold'>Model (Optional)</Label>
                 <p className='text-xs text-muted-foreground'>If no model is selected, the default <code className='font-code text-xs bg-black/30 p-1 rounded-md'>llama3.1:8b</code> model will be used.</p>
                 <Select name="model">
                    <SelectTrigger id="ollama-model" className="bg-input/70">
                      <SelectValue placeholder="Select an Ollama model (Optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {ollamaModels.map(model => (
                        <SelectItem key={model.id} value={model.name}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
               </div>
               <div className="space-y-2">
                <Label htmlFor="ollama-prompt" className='font-bold'>Prompt</Label>
                <Textarea id="ollama-prompt" name="prompt" placeholder="Enter your text prompt for Ollama..." className="min-h-[120px] bg-input/70" required/>
               </div>
            </CardContent>
            <CardFooter className="p-0 pt-6">
              <SubmitButton>Submit</SubmitButton>
            </CardFooter>
          </form>
          <ResponseCard response={ollamaState} />
        </Card>
      </TabsContent>
      <TabsContent value="google">
        <Card className="bg-transparent border-0 shadow-none">
          <form action={googleAction}>
            <CardContent className="space-y-4 p-0 pt-6">
               {googleKeys.length === 0 && (
                     <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>No Google AI Key Found</AlertTitle>
                      <AlertDescription>
                        You must add a Google AI service key on the "AI Keys" page to use this feature.
                      </AlertDescription>
                    </Alert>
                )}
                <div className="space-y-2">
                 <Label htmlFor="google-key" className='font-bold'>AI Key</Label>
                 <Select name="keyId" required>
                    <SelectTrigger id="google-key" className="bg-input/70" disabled={googleKeys.length === 0}>
                      <SelectValue placeholder="Select a Google AI Key" />
                    </SelectTrigger>
                    <SelectContent>
                      {googleKeys.map(key => (
                        <SelectItem key={key.id} value={key.id}>
                          {key.service} (...{key.key.slice(-4)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
               </div>
              <Label htmlFor="google-prompt" className='font-bold'>Prompt</Label>
              <Input id="google-prompt" name="prompt" placeholder="Enter your image prompt for Google AI..." className="bg-input/70" required/>
            </CardContent>
            <CardFooter className="p-0 pt-6">
              <SubmitButton>Submit</SubmitButton>
            </CardFooter>
          </form>
          <ResponseCard response={googleState} />
        </Card>
      </TabsContent>
    </Tabs>
  );
}

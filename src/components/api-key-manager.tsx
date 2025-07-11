'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { addApiKey, deleteApiKey } from '@/app/actions';
import type { ApiKey } from '@/lib/types';
import { PlusCircle, Trash2, Loader2, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={isPending}
      onClick={() => startTransition(() => deleteApiKey(id))}
      className="text-muted-foreground hover:text-destructive"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  );
}

export function ApiKeyManager({ initialKeys }: { initialKeys: ApiKey[] }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const handleAddKey = async (formData: FormData) => {
    const result = await addApiKey(formData);
    if (result?.success) {
      toast({
        title: "API Key Added",
        description: "Your new key has been successfully stored.",
      });
      setOpen(false);
      formRef.current?.reset();
    } else if (result?.error) {
       toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/60 shadow-lg">
      <CardContent className="p-6">
        <div className="flex justify-end mb-4">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="font-bold tracking-wider">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Key
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-popover border-border">
              <DialogHeader>
                <DialogTitle className="font-headline">Add New API Key</DialogTitle>
                <DialogDescription>
                  Select the service and paste your API key. It will be stored securely.
                </DialogDescription>
              </DialogHeader>
              <form action={handleAddKey} ref={formRef} className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="service" className="text-right">
                    Service
                  </Label>
                  <Select name="service" required>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ollama">Ollama</SelectItem>
                      <SelectItem value="Google AI">Google AI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="key" className="text-right">
                    API Key
                  </Label>
                  <Input id="key" name="key" type="password" className="col-span-3" required />
                </div>
                 <DialogFooter>
                    <Button type="submit" className="font-bold tracking-wider">Save Key</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="rounded-md border border-border/60">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b-border/60">
              <TableHead className='w-[50px]'></TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Key Snippet</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialKeys.length > 0 ? initialKeys.map((apiKey) => (
              <TableRow key={apiKey.id} className="hover:bg-accent/60 border-b-border/40 last:border-b-0">
                <TableCell><KeyRound className="h-5 w-5 text-primary" /></TableCell>
                <TableCell className="font-medium">{apiKey.service}</TableCell>
                <TableCell className="font-code">{apiKey.key.substring(0, 3)}...{apiKey.key.slice(-4)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDistanceToNow(new Date(apiKey.createdAt), { addSuffix: true })}</TableCell>
                <TableCell className="text-right">
                  <DeleteButton id={apiKey.id} />
                </TableCell>
              </TableRow>
            )) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No API keys found. Add one to get started.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );
}

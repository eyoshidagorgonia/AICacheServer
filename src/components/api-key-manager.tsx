'use client';

import { useState, useTransition, useRef } from 'react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { generateServerApiKey, revokeServerApiKey, getServerApiKeys, updateServerApiKey } from '@/app/actions';
import type { ServerApiKey } from '@/lib/types';
import { PlusCircle, Trash2, Loader2, KeyRound, Copy, Check, RefreshCw, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

function RevokeButton({ id, onRevoked }: { id: string, onRevoked: () => void }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleRevoke = () => {
    startTransition(async () => {
      await revokeServerApiKey(id);
      toast({
        title: "API Key Revoked",
        description: "The key has been successfully revoked.",
      });
      onRevoked();
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the API key and revoke its access.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRevoke} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Revoke Key
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function CopyButton({ value }: { value: string }) {
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();
  
    const handleCopy = () => {
      navigator.clipboard.writeText(value);
      setCopied(true);
      toast({ title: 'Copied to clipboard!' });
      setTimeout(() => setCopied(false), 2000);
    };
  
    return (
      <Button variant="ghost" size="icon" onClick={handleCopy} className="text-muted-foreground hover:text-primary">
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
    );
  }

export function ApiKeyManager({ initialKeys }: { initialKeys: ServerApiKey[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<ServerApiKey | null>(null);
  const addFormRef = useRef<HTMLFormElement>(null);
  const editFormRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const refreshKeys = () => {
    startRefreshTransition(async () => {
      const newKeys = await getServerApiKeys();
      setKeys(newKeys);
      toast({ title: 'Keys refreshed' });
    });
  };

  const handleGenerateKey = async (formData: FormData) => {
    const result = await generateServerApiKey(formData);
    if (result?.success && result.newKey) {
      setNewlyGeneratedKey(result.newKey);
      addFormRef.current?.reset();
      refreshKeys();
    } else if (result?.error) {
       toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleUpdateKey = async (formData: FormData) => {
    const result = await updateServerApiKey(formData);
    if (result?.success) {
        toast({
            title: "API Key Updated",
            description: "The key's name has been successfully updated.",
        });
        setEditingKey(null);
        refreshKeys();
    } else if (result?.error) {
        toast({
            title: "Error updating key",
            description: result.error,
            variant: "destructive",
        });
    }
  };

  const closeAndResetDialog = (open: boolean) => {
    if (!open) {
        setNewlyGeneratedKey(null);
    }
    setAddDialogOpen(open);
  }

  return (
    <>
    <Card className="bg-card/80 backdrop-blur-sm border-border/60 shadow-lg">
      <CardContent className="p-6">
        <div className="flex justify-end gap-2 mb-4">
           <Button variant="outline" onClick={refreshKeys} disabled={isRefreshing}>
             <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={closeAndResetDialog}>
            <DialogTrigger asChild>
              <Button className="font-bold tracking-wider">
                <PlusCircle className="mr-2 h-4 w-4" />
                Generate New Key
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-popover border-border">
              <DialogHeader>
                <DialogTitle className="font-headline">Generate New API Key</DialogTitle>
                <DialogDescription>
                  {newlyGeneratedKey ? "Copy this key now. You won't be able to see it again." : "Give this key a descriptive name to remember its purpose."}
                </DialogDescription>
              </DialogHeader>
              {newlyGeneratedKey ? (
                 <Card className="my-4">
                    <CardContent className="p-4 flex items-center justify-between">
                        <pre className="text-sm font-code break-all mr-2">{newlyGeneratedKey}</pre>
                        <CopyButton value={newlyGeneratedKey} />
                    </CardContent>
                 </Card>
              ) : (
                <form action={handleGenerateKey} ref={addFormRef} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                        Name
                    </Label>
                    <Input id="name" name="name" placeholder="e.g. 'My Test App'" className="col-span-3" required />
                    </div>
                    <DialogFooter>
                        <Button type="submit" className="font-bold tracking-wider">Generate Key</Button>
                    </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
        <div className="rounded-md border border-border/60">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b-border/60">
              <TableHead className='w-[50px]'></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>API Key</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.length > 0 ? keys.map((apiKey) => (
              <TableRow key={apiKey.id} className="hover:bg-accent/60 border-b-border/40 last:border-b-0">
                <TableCell><KeyRound className="h-5 w-5 text-primary" /></TableCell>
                <TableCell className="font-medium">{apiKey.name}</TableCell>
                <TableCell className="font-code">
                    <div className="flex items-center gap-2">
                        <span className="truncate max-w-sm">{apiKey.key}</span>
                        <CopyButton value={apiKey.key} />
                    </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDistanceToNow(new Date(apiKey.createdAt), { addSuffix: true })}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => setEditingKey(apiKey)} className="text-muted-foreground hover:text-primary">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <RevokeButton id={apiKey.id} onRevoked={refreshKeys} />
                </TableCell>
              </TableRow>
            )) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No API keys found. Generate one to get started.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
    
    <Dialog open={!!editingKey} onOpenChange={(open) => !open && setEditingKey(null)}>
        <DialogContent className="sm:max-w-[425px] bg-popover border-border">
          <DialogHeader>
            <DialogTitle className="font-headline">Edit API Key Name</DialogTitle>
            <DialogDescription>
              Update the descriptive name for this API key.
            </DialogDescription>
          </DialogHeader>
          <form action={handleUpdateKey} ref={editFormRef} className="grid gap-4 py-4">
            <input type="hidden" name="id" value={editingKey?.id} />
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name-edit" className="text-right">
                Name
              </Label>
              <Input id="name-edit" name="name" defaultValue={editingKey?.name} className="col-span-3" required />
            </div>
             <DialogFooter>
                <Button type="submit" className="font-bold tracking-wider">Update Name</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

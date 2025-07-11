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
import { addApiKey, deleteApiKey, updateApiKey, getApiKeys } from '@/app/actions';
import type { ApiKey } from '@/lib/types';
import { PlusCircle, Trash2, Loader2, KeyRound, Pencil, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function DeleteButton({ id, onDeleted }: { id: string, onDeleted: () => void }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
      startTransition(async () => {
          await deleteApiKey(id);
          onDeleted();
      });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={isPending}
      onClick={handleDelete}
      className="text-muted-foreground hover:text-destructive"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  );
}

export function AiKeyManager({ initialKeys }: { initialKeys: ApiKey[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const addFormRef = useRef<HTMLFormElement>(null);
  const editFormRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const refreshKeys = () => {
    startRefreshTransition(async () => {
      const newKeys = await getApiKeys();
      setKeys(newKeys);
      toast({ title: 'Keys refreshed' });
    });
  };

  const handleAddKey = async (formData: FormData) => {
    const result = await addApiKey(formData);
    if (result?.success) {
      toast({
        title: "AI Key Added",
        description: "Your new key has been successfully stored.",
      });
      setAddDialogOpen(false);
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
    const result = await updateApiKey(formData);
    if (result?.success) {
        toast({
            title: "AI Key Updated",
            description: "Your key has been successfully updated.",
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

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/60 shadow-lg">
      <CardContent className="p-6">
        <div className="flex justify-end gap-2 mb-4">
          <Button variant="outline" onClick={refreshKeys} disabled={isRefreshing}>
             <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="font-bold tracking-wider">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Key
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-popover border-border">
              <DialogHeader>
                <DialogTitle className="font-headline">Add New AI Key</DialogTitle>
                <DialogDescription>
                  Select the service and paste your AI key. It will be stored securely.
                </DialogDescription>
              </DialogHeader>
              <form action={handleAddKey} ref={addFormRef} className="grid gap-4 py-4">
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
                    AI Key
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
              <TableHead>Key</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.length > 0 ? keys.map((apiKey) => (
              <TableRow key={apiKey.id} className="hover:bg-accent/60 border-b-border/40 last:border-b-0">
                <TableCell><KeyRound className="h-5 w-5 text-primary" /></TableCell>
                <TableCell className="font-medium">{apiKey.service}</TableCell>
                <TableCell className="font-code">{apiKey.key}</TableCell>
                <TableCell className="text-muted-foreground">{formatDistanceToNow(new Date(apiKey.createdAt), { addSuffix: true })}</TableCell>
                <TableCell className="text-right">
                   <Button variant="ghost" size="icon" onClick={() => setEditingKey(apiKey)} className="text-muted-foreground hover:text-primary">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <DeleteButton id={apiKey.id} onDeleted={refreshKeys} />
                </TableCell>
              </TableRow>
            )) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No AI keys found. Add one to get started.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </CardContent>

      <Dialog open={!!editingKey} onOpenChange={(open) => !open && setEditingKey(null)}>
        <DialogContent className="sm:max-w-[425px] bg-popover border-border">
          <DialogHeader>
            <DialogTitle className="font-headline">Edit AI Key</DialogTitle>
            <DialogDescription>
              Update the value for your {editingKey?.service} AI key.
            </DialogDescription>
          </DialogHeader>
          <form action={handleUpdateKey} ref={editFormRef} className="grid gap-4 py-4">
            <input type="hidden" name="id" value={editingKey?.id} />
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="service-edit" className="text-right">
                Service
              </Label>
              <Input id="service-edit" name="service" value={editingKey?.service} readOnly className="col-span-3 bg-input/50" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="key-edit" className="text-right">
                AI Key
              </Label>
              <Input id="key-edit" name="key" type="password" defaultValue={editingKey?.key} className="col-span-3" required />
            </div>
             <DialogFooter>
                <Button type="submit" className="font-bold tracking-wider">Update Key</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

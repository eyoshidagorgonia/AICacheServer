
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
import { addModel, deleteModel, getModels } from '@/app/actions';
import type { Model } from '@/lib/types';
import { PlusCircle, Trash2, Loader2, Bot, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

function DeleteButton({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteModel(id);
      onDeleted();
    });
  };

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

export function ModelManager({ initialModels }: { initialModels: Model[] }) {
  const [models, setModels] = useState(initialModels);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const addFormRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const refreshModels = () => {
    startRefreshTransition(async () => {
      const newModels = await getModels();
      setModels(newModels);
      toast({ title: 'Models refreshed' });
    });
  };

  const handleAddModel = async (formData: FormData) => {
    const result = await addModel(formData);
    if (result?.success) {
      toast({
        title: 'Model Added',
        description: 'Your new model has been successfully stored.',
      });
      setAddDialogOpen(false);
      addFormRef.current?.reset();
      refreshModels();
    } else if (result?.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/60 shadow-lg">
      <CardContent className="p-6">
        <div className="flex justify-end gap-2 mb-4">
          <Button variant="outline" onClick={refreshModels} disabled={isRefreshing}>
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="font-bold tracking-wider">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Model
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-popover border-border">
              <DialogHeader>
                <DialogTitle className="font-headline">Add New Model</DialogTitle>
                <DialogDescription>
                  Provide a name for the model and select the associated service.
                </DialogDescription>
              </DialogHeader>
              <form action={handleAddModel} ref={addFormRef} className="grid gap-4 py-4">
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Model Name
                  </Label>
                  <Input id="name" name="name" placeholder="e.g. llama3.1:8b" className="col-span-3" required />
                </div>
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
                      <SelectItem value="Google Gemini">Google Gemini</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="submit" className="font-bold tracking-wider">
                    Save Model
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="rounded-md border border-border/60">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b-border/60">
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Model Name</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.length > 0 ? (
                models.map((model) => (
                  <TableRow key={model.id} className="hover:bg-accent/60 border-b-border/40 last:border-b-0">
                    <TableCell>
                      <Bot className="h-5 w-5 text-primary" />
                    </TableCell>
                    <TableCell className="font-medium font-code">{model.name}</TableCell>
                    <TableCell>{model.service}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(model.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DeleteButton id={model.id} onDeleted={refreshModels} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No models found. Add one to get started.
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

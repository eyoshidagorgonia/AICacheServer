'use client';

import { useState, useTransition, useRef } from 'react';
import { exportAllData, importAllData, clearAllData } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, Trash2, AlertTriangle, Loader2, Info, CheckCircle, XCircle, Copy } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import type { ImportResult } from '@/lib/types';

export function SettingsClient() {
  const { toast } = useToast();
  const [isExporting, startExportTransition] = useTransition();
  const [isImporting, startImportTransition] = useTransition();
  const [isClearing, startClearTransition] = useTransition();
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const importFormRef = useRef<HTMLFormElement>(null);

  const handleExport = () => {
    startExportTransition(async () => {
      const data = await exportAllData();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aicache_export_${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: 'Export Successful',
        description: 'Your data has been downloaded.',
      });
    });
  };
  
  const handleImport = async (formData: FormData) => {
    startImportTransition(async () => {
        const result = await importAllData(formData);
        setImportResult(result);
        if (result.type === 'success') {
            toast({
                title: 'Import Successful',
                description: 'Data has been imported. Check the summary below.',
            });
            importFormRef.current?.reset();
        } else {
             toast({
                title: 'Import Failed',
                description: result.message,
                variant: 'destructive',
            });
        }
    });
  }

  const handleClear = async () => {
    startClearTransition(async () => {
        const result = await clearAllData();
        if (result.success) {
            toast({
                title: 'Data Cleared',
                description: 'All stored data has been removed.',
            });
        } else {
            toast({
                title: 'Error',
                description: result.message,
                variant: 'destructive'
            })
        }
    })
  }

  return (
    <div className="space-y-8">
      <Card className="bg-card/80 backdrop-blur-sm border-border/60 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Download /> Export Data
          </CardTitle>
          <CardDescription>
            Download all AI Keys, API Keys, and Models as a single JSON file. This is useful for backups or migrating to another instance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport} disabled={isExporting}>
             {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Export All Data
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card/80 backdrop-blur-sm border-border/60 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Upload /> Import Data
          </CardTitle>
          <CardDescription>
            Import data from a previously exported JSON file. You can choose how to handle items that already exist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleImport} ref={importFormRef} className="space-y-6">
            <div>
              <Label htmlFor="fileContent">Paste JSON content here</Label>
              <Textarea
                id="fileContent"
                name="fileContent"
                className="mt-2 min-h-[150px] font-code bg-input/70"
                placeholder='{ "aiKeys": [...], "serverApiKeys": [...], "models": [...] }'
                required
              />
            </div>
            <div>
                <Label>Conflict Resolution</Label>
                <p className='text-sm text-muted-foreground'>If an item in the import file has the same ID as an existing item, what should happen?</p>
                <RadioGroup name="conflictResolution" defaultValue="keep" className='mt-2'>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="keep" id="r1" />
                        <Label htmlFor="r1">Keep Existing (ignore imported item)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="overwrite" id="r2" />
                        <Label htmlFor="r2">Overwrite Existing (use imported item)</Label>
                    </div>
                </RadioGroup>
            </div>
            <Button type="submit" disabled={isImporting}>
              {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import Data
            </Button>
          </form>
          {importResult && (
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Import Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    {importResult.type === 'error' ? (
                         <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{importResult.message}</AlertDescription>
                        </Alert>
                    ) : (
                        <div className='space-y-4 text-sm'>
                            <div>
                                <h3 className='font-bold mb-2'>AI Keys</h3>
                                <p><CheckCircle className="inline h-4 w-4 mr-2 text-green-500" />Added: {importResult.aiKeys.added}</p>
                                <p><Info className="inline h-4 w-4 mr-2 text-blue-500" />Updated: {importResult.aiKeys.updated}</p>
                                <p><XCircle className="inline h-4 w-4 mr-2 text-amber-500" />Conflicts (Kept Existing): {importResult.aiKeys.conflicts}</p>
                            </div>
                            <div>
                                <h3 className='font-bold mb-2'>Server API Keys</h3>
                                <p><CheckCircle className="inline h-4 w-4 mr-2 text-green-500" />Added: {importResult.serverApiKeys.added}</p>
                                <p><Info className="inline h-4 w-4 mr-2 text-blue-500" />Updated: {importResult.serverApiKeys.updated}</p>
                                <p><XCircle className="inline h-4 w-4 mr-2 text-amber-500" />Conflicts (Kept Existing): {importResult.serverApiKeys.conflicts}</p>
                            </div>
                             <div>
                                <h3 className='font-bold mb-2'>Models</h3>
                                <p><CheckCircle className="inline h-4 w-4 mr-2 text-green-500" />Added: {importResult.models.added}</p>
                                <p><Info className="inline h-4 w-4 mr-2 text-blue-500" />Updated: {importResult.models.updated}</p>
                                <p><XCircle className="inline h-4 w-4 mr-2 text-amber-500" />Conflicts (Kept Existing): {importResult.models.conflicts}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/80 backdrop-blur-sm border-border/60 shadow-lg border-destructive/50">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2 text-destructive">
            <AlertTriangle /> Danger Zone
          </CardTitle>
          <CardDescription>
            These actions are irreversible and will result in data loss. Proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all AI Keys, Server API Keys, and Models from storage.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClear} disabled={isClearing} className="bg-destructive hover:bg-destructive/90">
                    {isClearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Yes, delete everything'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}

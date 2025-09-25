
"use client";

import { useState, useCallback } from 'react';
import { useApplicants } from '@/context/applicants-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, FileUp, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';
import Papa from 'papaparse';
import type { Applicant } from '@/lib/types';

type NewApplicantData = Omit<Applicant, 'id' | 'status' | 'applicationDate' | 'lastUpdated'>;

interface ImportApplicantsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportApplicantsDialog({ isOpen, onOpenChange }: ImportApplicantsDialogProps) {
  const { addApplicant } = useApplicants();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<NewApplicantData[]>([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setError(null);
      setParsedData([]);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length) {
            setError(`Error parsing CSV: ${results.errors[0].message}`);
            return;
          }
          const requiredFields = ['name', 'gender', 'dob', 'nationality', 'phone', 'email', 'instrumentInterest', 'previousExperience'];
          const missingFields = requiredFields.filter(field => !results.meta.fields?.includes(field));

          if (missingFields.length > 0) {
            setError(`CSV is missing required columns: ${missingFields.join(', ')}`);
            return;
          }
          
          const applicants = results.data.map((row: any) => ({
            name: row.name || '',
            gender: row.gender || 'other',
            dob: row.dob || '',
            nationality: row.nationality || '',
            contact: {
              phone: row.phone || '',
              email: row.email || '',
            },
            instrumentInterest: row.instrumentInterest || '',
            previousExperience: row.previousExperience || '',
          }));

          setParsedData(applicants as NewApplicantData[]);
        },
      });
    }
  };

  const handleImport = async () => {
    setIsLoading(true);
    let successCount = 0;
    for (const applicantData of parsedData) {
      const success = await addApplicant(applicantData);
      if (success) {
        successCount++;
      }
    }
    setIsLoading(false);

    toast({
      title: "Import Complete",
      description: `Successfully imported ${successCount} of ${parsedData.length} applicants.`,
    });

    if (successCount > 0) {
      handleClose();
    }
  };

  const handleClose = () => {
    setParsedData([]);
    setFileName('');
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Import Applicants from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with applicant data. The file must contain the following columns: name, gender, dob, nationality, phone, email, instrumentInterest, previousExperience.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label htmlFor="csv-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileUp className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">CSV file</p>
                    {fileName && <p className="text-xs text-primary mt-2">{fileName}</p>}
                </div>
                <input id="csv-upload" type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
            </label>
          </div>

          {error && <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          }

          {parsedData.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">Preview Data ({parsedData.length} records)</h3>
              <ScrollArea className="h-64 border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Instrument</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((applicant, index) => (
                      <TableRow key={index}>
                        <TableCell>{applicant.name}</TableCell>
                        <TableCell>{applicant.instrumentInterest}</TableCell>
                        <TableCell>{applicant.contact.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleImport} disabled={isLoading || parsedData.length === 0}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <CheckCircle className="mr-2"/>
            Confirm and Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

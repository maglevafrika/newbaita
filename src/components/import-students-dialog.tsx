
"use client";

import { useState } from 'react';
import { useDatabase } from '@/context/database-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, FileUp, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';
import Papa from 'papaparse';
import type { StudentProfile } from '@/lib/types';

type NewStudentData = Omit<StudentProfile, 'id' | 'enrolledIn' | 'paymentPlan' | 'enrollmentDate'>;

interface ImportStudentsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportStudentsDialog({ isOpen, onOpenChange }: ImportStudentsDialogProps) {
  const { addStudent } = useDatabase();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<NewStudentData[]>([]);
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
          const requiredFields = ['name', 'level', 'gender', 'dob', 'nationality', 'phone', 'email', 'instrumentInterest'];
          const missingFields = requiredFields.filter(field => !results.meta.fields?.includes(field));

          if (missingFields.length > 0) {
            setError(`CSV is missing required columns: ${missingFields.join(', ')}`);
            return;
          }
          
          const students = results.data.map((row: any) => ({
            name: row.name || '',
            level: row.level || 'Beginner',
            gender: row.gender || 'male',
            dob: row.dob || '',
            nationality: row.nationality || '',
            contact: {
              phone: row.phone || '',
              email: row.email || '',
            },
            instrumentInterest: row.instrumentInterest || '',
          }));

          setParsedData(students as NewStudentData[]);
        },
      });
    }
  };

  const handleImport = async () => {
    setIsLoading(true);
    let successCount = 0;
    for (const studentData of parsedData) {
      const studentToCreate = {
        ...studentData,
        enrollmentDate: new Date().toISOString().split('T')[0],
        enrolledIn: [],
        paymentPlan: 'none' as const,
      }
      await addStudent(studentToCreate);
      successCount++;
    }
    setIsLoading(false);

    toast({
      title: "Import Complete",
      description: `Successfully imported ${successCount} of ${parsedData.length} students.`,
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
          <DialogTitle>Import Students from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with student data. Required columns: name, level, gender, dob, nationality, phone, email, instrumentInterest.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label htmlFor="csv-upload-student" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileUp className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">CSV file</p>
                    {fileName && <p className="text-xs text-primary mt-2">{fileName}</p>}
                </div>
                <input id="csv-upload-student" type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
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
                      <TableHead>Level</TableHead>
                      <TableHead>Instrument</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((student, index) => (
                      <TableRow key={index}>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.level}</TableCell>
                        <TableCell>{student.instrumentInterest}</TableCell>
                        <TableCell>{student.contact?.email}</TableCell>
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

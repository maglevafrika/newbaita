
"use client";

import { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDatabase } from "@/context/database-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Semester } from '@/lib/types';
import { cn } from '@/lib/utils';

const semesterFormSchema = z.object({
  name: z.string().min(3, "Semester name is required."),
  startDate: z.date({ required_error: "A start date is required."}),
  endDate: z.date({ required_error: "An end date is required."}),
}).refine(data => data.endDate > data.startDate, {
  message: "End date must be after start date.",
  path: ["endDate"],
});

type SemesterFormValues = z.infer<typeof semesterFormSchema>;

interface SemesterDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  semester?: Semester | null;
}

export function SemesterDialog({ isOpen, onOpenChange, semester }: SemesterDialogProps) {
  const { addSemester, updateSemester } = useDatabase();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SemesterFormValues>({
    resolver: zodResolver(semesterFormSchema),
  });

  useEffect(() => {
    if (semester) {
      form.reset({
        name: semester.name,
        startDate: new Date(semester.startDate),
        endDate: new Date(semester.endDate),
      });
    } else {
      form.reset({
        name: '',
        startDate: undefined,
        endDate: undefined,
      });
    }
  }, [semester, isOpen, form]);

  const onSubmit = async (data: SemesterFormValues) => {
    setIsLoading(true);
    const semesterData = {
        ...data,
        startDate: format(data.startDate, 'yyyy-MM-dd'),
        endDate: format(data.endDate, 'yyyy-MM-dd'),
    };
    
    let success = false;
    if (semester) {
        success = await updateSemester(semester.id, semesterData);
    } else {
        success = await addSemester(semesterData);
    }
    
    setIsLoading(false);
    if (success) {
      form.reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{semester ? 'Edit Semester' : 'Add New Semester'}</DialogTitle>
          <DialogDescription>
            {semester ? 'Update the details for this semester.' : 'Enter the details for the new semester.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Semester Name</FormLabel>
                <FormControl><Input placeholder="e.g., Fall 2024" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="startDate" render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
            )} />
             <FormField control={form.control} name="endDate" render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
            )} />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {semester ? 'Save Changes' : 'Create Semester'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

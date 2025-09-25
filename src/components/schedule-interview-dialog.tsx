

"use client";

import { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useApplicants } from "@/context/applicants-context";
import { useAuth } from '@/context/auth-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Applicant } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';


const scheduleSchema = z.object({
  date: z.date({ required_error: "An interview date is required."}),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please use HH:MM format."),
  duration: z.coerce.number().min(5, "Duration must be at least 5 minutes."),
  breakTime: z.coerce.number().min(0, "Break time cannot be negative."),
  teacherIds: z.array(z.string()).min(1, "You must select at least one teacher."),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

interface ScheduleInterviewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedApplicants: Applicant[];
}

export function ScheduleInterviewDialog({ isOpen, onOpenChange, selectedApplicants }: ScheduleInterviewDialogProps) {
  const { scheduleInterviews } = useApplicants();
  const { users } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      teacherIds: [],
      startTime: "10:00",
      duration: 30,
      breakTime: 10,
    }
  });
  
  const teachers = users.filter(u => u.roles.includes('teacher'));

  const onSubmit = async (data: ScheduleFormValues) => {
    setIsLoading(true);
    const applicantIds = selectedApplicants.map(a => a.id);
    const interviewDetails = {
      ...data,
      date: format(data.date, 'yyyy-MM-dd')
    }
    
    const success = await scheduleInterviews(applicantIds, interviewDetails);
    
    setIsLoading(false);
    if (success) {
      form.reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Schedule Interviews</DialogTitle>
          <DialogDescription>
            Assign interviews for {selectedApplicants.length} applicant(s). A schedule will be generated based on the settings below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Interview Date</FormLabel>
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
            
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="startTime" render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl><Input placeholder="HH:MM" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="duration" render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (min)</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="breakTime" render={({ field }) => (
                <FormItem>
                  <FormLabel>Break (min)</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField
              control={form.control}
              name="teacherIds"
              render={() => (
                 <FormItem>
                    <FormLabel>Interviewers</FormLabel>
                    <ScrollArea className="h-32 w-full rounded-md border p-4">
                        <div className="space-y-2">
                          {teachers.map(teacher => (
                            <FormField
                                key={teacher.id}
                                control={form.control}
                                name="teacherIds"
                                render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                    <Checkbox
                                        checked={field.value?.includes(teacher.id)}
                                        onCheckedChange={(checked) => {
                                        return checked
                                            ? field.onChange([...(field.value || []), teacher.id])
                                            : field.onChange(
                                                field.value?.filter((value) => value !== teacher.id)
                                            );
                                        }}
                                    />
                                    </FormControl>
                                    <FormLabel className="font-normal">{teacher.name}</FormLabel>
                                </FormItem>
                                )}
                            />
                          ))}
                        </div>
                    </ScrollArea>
                    <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
               <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Schedule
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

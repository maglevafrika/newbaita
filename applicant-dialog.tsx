
"use client";

import { useEffect, useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useApplicants } from "@/context/applicants-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { Textarea } from './ui/textarea';
import type { Applicant } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from './ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const applicantFormSchema = z.object({
  name: z.string().min(2, "Name is required."),
  gender: z.enum(['male', 'female', 'other'], { required_error: "Gender is required."}),
  dob: z.date({ required_error: "Date of birth is required."}),
  nationality: z.string().min(2, "Nationality is required."),
  contact: z.object({
    phone: z.string().min(10, "A valid phone number is required."),
    email: z.string().email("A valid email is required."),
  }),
  instrumentInterest: z.string().min(2, "Instrument is required."),
  previousExperience: z.string().min(10, "Please describe previous experience."),
});

type ApplicantFormValues = z.infer<typeof applicantFormSchema>;

interface ApplicantDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  applicant?: Applicant | null;
}

export function ApplicantDialog({ isOpen, onOpenChange, applicant }: ApplicantDialogProps) {
  const { addApplicant, updateApplicant } = useApplicants();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ApplicantFormValues>({
    resolver: zodResolver(applicantFormSchema),
    defaultValues: {
        name: '',
        gender: undefined,
        dob: undefined,
        nationality: '',
        contact: {
            phone: '',
            email: ''
        },
        instrumentInterest: '',
        previousExperience: ''
    }
  });

  useEffect(() => {
    if (isOpen && applicant) {
      form.reset({
        name: applicant.name,
        gender: applicant.gender,
        dob: new Date(applicant.dob),
        nationality: applicant.nationality,
        contact: {
            phone: applicant.contact.phone,
            email: applicant.contact.email,
        },
        instrumentInterest: applicant.instrumentInterest,
        previousExperience: applicant.previousExperience,
      });
    } else if (isOpen && !applicant) {
      form.reset({
        name: '',
        gender: undefined,
        dob: undefined,
        nationality: '',
        contact: {
            phone: '',
            email: ''
        },
        instrumentInterest: '',
        previousExperience: ''
    });
    }
  }, [isOpen, applicant, form]);

  const onSubmit = async (data: ApplicantFormValues) => {
    setIsLoading(true);

    const submissionData = {
        ...data,
        dob: format(data.dob, 'yyyy-MM-dd')
    }

    let success = false;
    if (applicant) {
      success = await updateApplicant(applicant.id, submissionData);
    } else {
      success = await addApplicant(submissionData);
    }
    
    setIsLoading(false);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{applicant ? 'Edit Applicant' : 'Add New Applicant'}</DialogTitle>
          <DialogDescription>
            {applicant ? 'Update the details for this applicant.' : 'Enter the details for the new applicant.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl><Input placeholder="Applicant's full name" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="gender" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select gender..." /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="dob" render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Date of Birth</FormLabel>
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
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} captionLayout="dropdown-buttons" fromYear={1950} toYear={2024} initialFocus />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                 )} />
                 <FormField control={form.control} name="nationality" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nationality</FormLabel>
                        <FormControl><Input placeholder="e.g., Saudi Arabian" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="contact.phone" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl><Input placeholder="e.g., 05xxxxxxxx" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="contact.email" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl><Input type="email" placeholder="e.g., applicant@email.com" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            <FormField control={form.control} name="instrumentInterest" render={({ field }) => (
                <FormItem>
                    <FormLabel>Instrument of Interest</FormLabel>
                    <FormControl><Input placeholder="e.g., Oud, Nay, Qanun" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />

            <FormField control={form.control} name="previousExperience" render={({ field }) => (
                <FormItem>
                    <FormLabel>Previous Musical Experience</FormLabel>
                    <FormControl><Textarea placeholder="Describe any previous musical training or experience..." {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {applicant ? 'Save Changes' : 'Add Applicant'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

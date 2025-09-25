
"use client";

import { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDatabase } from '@/context/database-context';
import { useAuth } from '@/context/auth-context';
import type { Semester, Session, StudentProfile } from '@/lib/types';

const sessionFormSchema = z.object({
  specialization: z.string().min(1, "Specialization is required."),
  type: z.enum(["practical", "theory"]),
  duration: z.coerce.number().min(1, "Duration must be at least 1 hour.").max(4, "Duration cannot exceed 4 hours."),
  studentId: z.string().min(1, "You must select a student to enroll."),
});

type SessionFormValues = z.infer<typeof sessionFormSchema>;

interface CreateSessionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  day: string;
  time: string;
  semester: Semester;
  teacherName: string;
  onSessionCreated: () => void;
}

export function CreateSessionDialog({ isOpen, onOpenChange, day, time, semester, teacherName, onSessionCreated }: CreateSessionDialogProps) {
  const { students, updateSemester, updateStudent } = useDatabase();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      type: "practical",
      duration: 1,
    },
  });

  const onSubmit = async (data: SessionFormValues) => {
    setIsLoading(true);
    const student = students.find(s => s.id === data.studentId);
    if (!student) {
        toast({ title: "Error", description: "Selected student not found." });
        setIsLoading(false);
        return;
    }

    try {
        const newSessionId = `${day}-${Date.now()}`;
        const newSession: Session = {
            id: newSessionId,
            time: time,
            duration: data.duration,
            specialization: data.specialization,
            type: data.type,
            students: [{ id: student.id, name: student.name, attendance: null, pendingRemoval: false }]
        };

        // Update semester's master schedule
        const updatedMasterSchedule = JSON.parse(JSON.stringify(semester.masterSchedule));
        if (!updatedMasterSchedule[teacherName]) {
            updatedMasterSchedule[teacherName] = {};
        }
        if (!updatedMasterSchedule[teacherName][day]) {
            updatedMasterSchedule[teacherName][day] = [];
        }
        updatedMasterSchedule[teacherName][day].push(newSession);
        
        const semesterUpdateSuccess = await updateSemester(semester.id, { masterSchedule: updatedMasterSchedule });

        // Update student's enrolledIn
        const updatedEnrolledIn = [...student.enrolledIn, { semesterId: semester.id, teacher: teacherName, sessionId: newSessionId }];
        const studentUpdateSuccess = await updateStudent(student.id, { enrolledIn: updatedEnrolledIn });

        if (semesterUpdateSuccess && studentUpdateSuccess) {
            toast({ title: "Session Created", description: `New session on ${day} at ${time} has been added.` });
            onSessionCreated();
            onOpenChange(false);
            form.reset();
        } else {
             throw new Error("Failed to update student or semester records.");
        }

    } catch (error: any) {
        toast({ title: "Error Creating Session", description: error.message, variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Session</DialogTitle>
          <DialogDescription>
            Creating a new session for {teacherName} on {day} at {time}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="specialization" render={({ field }) => (
                <FormItem>
                    <FormLabel>Specialization</FormLabel>
                    <FormControl><Input placeholder="e.g., Oud" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )} />
                 <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="practical">Practical</SelectItem>
                        <SelectItem value="theory">Theory</SelectItem>
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )} />
            </div>

            <FormField control={form.control} name="duration" render={({ field }) => (
                <FormItem>
                    <FormLabel>Duration (in hours)</FormLabel>
                    <FormControl><Input type="number" min="1" max="4" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />

             <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Student</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a student to enroll" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students.map(student => (
                        <SelectItem key={student.id} value={student.id}>{student.name} ({student.level})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                   <FormDescription>You must add one student to create a session. Others can be added later.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Session
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

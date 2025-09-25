"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { StudentProfile, Semester, Session, SessionStudent, UserInDb } from "@/lib/types";
import { useDatabase } from "@/context/database-context";

const enrollStudentSchema = z.object({
  studentId: z.string().min(1, "Please select a student."),
  teacherId: z.string().min(1, "Please select a teacher."),
  day: z.string().min(1, "Please select a day."),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please use HH:MM format (e.g., 14:00)."),
  duration: z.coerce.number().min(0.5, "Duration must be at least 0.5 hours.").max(4, "Duration cannot exceed 4 hours."),
  specialization: z.string().min(1, "Specialization is required."),
});

type EnrollStudentFormValues = z.infer<typeof enrollStudentSchema>;

interface EnrollStudentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  students: StudentProfile[];
  semester: Semester;
  teachers: UserInDb[];
  onEnrollmentSuccess: () => void;
}

export function EnrollStudentDialog({ isOpen, onOpenChange, students, semester, teachers, onEnrollmentSuccess }: EnrollStudentDialogProps) {
  const { toast } = useToast();
  const { updateStudent, updateSemester } = useDatabase();
  const [isLoading, setIsLoading] = useState(false);
  const daysOfWeek = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

  const form = useForm<EnrollStudentFormValues>({
    resolver: zodResolver(enrollStudentSchema),
    defaultValues: {
      studentId: "",
      teacherId: "",
      day: "",
      startTime: "14:00",
      duration: 1,
      specialization: "Oud"
    },
  });

  const getFormattedTime = (time: string, duration: number) => {
      const [hour, minute] = time.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hour, minute, 0, 0);

      const endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000);

      const timeFormatter = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      });

      return {
          startTime: timeFormatter.format(startDate),
          endTime: timeFormatter.format(endDate),
      };
  }

  async function onSubmit(data: EnrollStudentFormValues) {
    setIsLoading(true);
    const studentToEnroll = students.find(s => s.id === data.studentId);
    const teacherInfo = teachers.find(t => t.id === data.teacherId);

    if (!studentToEnroll || !teacherInfo || !studentToEnroll.id) {
      toast({ title: "Error", description: "Student or teacher not found.", variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    try {
        const { startTime, endTime } = getFormattedTime(data.startTime, data.duration);
        const updatedMasterSchedule = JSON.parse(JSON.stringify(semester.masterSchedule));
        
        if (!updatedMasterSchedule[teacherInfo.name]) updatedMasterSchedule[teacherInfo.name] = {};
        if (!updatedMasterSchedule[teacherInfo.name][data.day]) updatedMasterSchedule[teacherInfo.name][data.day] = [];

        // Check if a session at this exact time already exists
        let session = updatedMasterSchedule[teacherInfo.name][data.day].find((s: Session) => s.time === startTime);

        // ✅ CRITICAL FIX: Create proper SessionStudent object instead of just name string
        const studentData: SessionStudent = { 
          id: studentToEnroll.id, 
          name: studentToEnroll.name, 
          attendance: null, 
          pendingRemoval: false 
        };

        if (session) { 
            // Session exists, add student if not already present
            const studentInSession = session.students.some((s: SessionStudent) => s.id === data.studentId);
            if (!studentInSession) {
                session.students.push(studentData); // ✅ Push SessionStudent object, not string
            }
        } else { 
            // Session does not exist, create it
            session = {
                id: `${data.day}-${teacherInfo.name}-${startTime.replace(/[\s:]/g, '')}`,
                time: startTime,
                endTime: endTime,
                duration: data.duration,
                specialization: data.specialization,
                type: 'practical',
                students: [studentData] // ✅ Array of SessionStudent objects, not strings
            };
            updatedMasterSchedule[teacherInfo.name][data.day].push(session);
        }
        
        const updatedEnrolledIn = [...studentToEnroll.enrolledIn, { 
          semesterId: semester.id || '', 
          teacher: teacherInfo.name, 
          sessionId: session.id 
        }];
        
        // Return promises and check their results
        const semesterPromise = updateSemester(semester.id || '', { masterSchedule: updatedMasterSchedule });
        const studentPromise = updateStudent(studentToEnroll.id, { enrolledIn: updatedEnrolledIn });

        await Promise.all([semesterPromise, studentPromise]);

        setIsLoading(false);

        toast({ title: "Enrollment Successful", description: `${studentToEnroll.name} has been scheduled.` });
        onEnrollmentSuccess();
        onOpenChange(false);
        form.reset();
    } catch (error: any) {
        setIsLoading(false);
        console.error("Enrollment failed:", error);
        toast({ title: "Enrollment Failed", description: error.message, variant: 'destructive'});
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enroll Student in Semester</DialogTitle>
          <DialogDescription>
            Select a student and the class details for the "{semester.name}" semester.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="studentId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Student</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a student to enroll" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {students.map(student => (
                        <SelectItem key={student.id || ''} value={student.id || ''}>{student.name} ({student.level})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
            )} />
            
            <FormField control={form.control} name="teacherId" render={({ field }) => (
                <FormItem>
                    <FormLabel>Teacher</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a teacher" /></SelectTrigger></FormControl>
                        <SelectContent>
                            {teachers.map(teacher => (
                                <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="day" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Day of Week</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {daysOfWeek.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="startTime" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl><Input placeholder="HH:MM" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

             <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="duration" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Duration (hours)</FormLabel>
                        <FormControl><Input type="number" step="0.5" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="specialization" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Specialization</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
           
            <DialogFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enroll Student
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
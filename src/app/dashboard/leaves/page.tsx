"use client";

import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Plane, CheckCircle, XCircle, Loader2, User, Building } from "lucide-react";
import { Leave, Semester, Session, StudentProfile } from "@/lib/types";
import { useDatabase } from '@/context/database-context';
import { useAuth } from '@/context/auth-context';
import { format, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

// Add Leave Dialog
const leaveFormSchema = z.object({
  type: z.enum(['student', 'teacher'], { required_error: "Please select a leave type."}),
  personId: z.string().min(1, "Please select a person."),
  dateRange: z.object({
    from: z.date({ required_error: "A start date is required."}),
    to: z.date({ required_error: "An end date is required."}),
  }),
  reason: z.string().min(5, "Reason must be at least 5 characters long."),
});
type LeaveFormValues = z.infer<typeof leaveFormSchema>;

function AddLeaveDialog({ onLeaveAdded }: { onLeaveAdded: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const { addLeave, students } = useDatabase();
  const { users } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const form = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveFormSchema),
  });

  const leaveType = form.watch("type");

  const personOptions = useMemo(() => {
    if (leaveType === 'student') {
        return students.map(s => ({ id: s.id!, name: s.name }));
    }
    if (leaveType === 'teacher') {
        return users.filter(u => u.roles.includes('teacher')).map(t => ({ id: t.id, name: t.name }));
    }
    return [];
  }, [leaveType, students, users]);

  const onSubmit = async (data: LeaveFormValues) => {
    setIsLoading(true);
    try {
      const person = personOptions.find(p => p.id === data.personId);
      if (!person) {
          toast({ title: t('common.error'), description: "Selected person not found.", variant: 'destructive'});
          setIsLoading(false);
          return;
      }

      const leaveData: Omit<Leave, 'id' | 'createdAt' | 'updatedAt'> = {
          type: data.type,
          personId: data.personId,
          personName: person.name,
          startDate: format(data.dateRange.from, 'yyyy-MM-dd'),
          endDate: format(data.dateRange.to, 'yyyy-MM-dd'),
          reason: data.reason,
          status: 'pending'
      };
      
      await addLeave(leaveData);
      onLeaveAdded();
      form.reset();
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding leave:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> 
          {t('leavesPage.newRequest')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('leavesPage.newRequest')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField 
              control={form.control} 
              name="type" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('leavesPage.requestFor')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('leavesPage.selectType')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="student">{t('leavesPage.student')}</SelectItem>
                      <SelectItem value="teacher">{t('leavesPage.teacher')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} 
            />
            
            {leaveType && (
              <FormField 
                control={form.control} 
                name="personId" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{leaveType === 'student' ? t('leavesPage.student') : t('leavesPage.teacher')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={leaveType === 'student' ? t('leavesPage.selectStudent') : t('leavesPage.selectTeacher')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <ScrollArea className="h-48">
                          {personOptions.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} 
              />
            )}
            
            <FormField 
              control={form.control} 
              name="dateRange" 
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t('leavesPage.leaveDates')}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        id="date" 
                        variant={"outline"} 
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value?.from && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value?.from ? (
                          field.value.to ? (
                            <>
                              {format(field.value.from, "LLL dd, y")} - {format(field.value.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(field.value.from, "LLL dd, y")
                          )
                        ) : (
                          <span>{t('leavesPage.pickDateRange')}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar 
                        initialFocus 
                        mode="range" 
                        defaultMonth={field.value?.from} 
                        selected={field.value} 
                        onSelect={field.onChange} 
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField 
              control={form.control} 
              name="reason" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('leavesPage.reason')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t('leavesPage.reasonPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} 
            />
            
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                {t('leavesPage.submit')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// Transfer Students Dialog
const transferFormSchema = z.object({
  transfers: z.array(z.object({
    studentId: z.string(),
    studentName: z.string(),
    sessionId: z.string(),
    day: z.string(),
    newTeacherId: z.string().min(1, "A new teacher must be selected."),
  }))
});
type TransferFormValues = z.infer<typeof transferFormSchema>;

function TransferStudentsDialog({ 
  leaveRequest, 
  onOpenChange, 
  onApprovalSuccess 
}: { 
  leaveRequest: Leave, 
  onOpenChange: (open: boolean) => void, 
  onApprovalSuccess: () => void 
}) {
  const { semesters, students, updateSemester, updateStudent } = useDatabase();
  const { users } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const form = useForm<TransferFormValues>();
  const { fields, replace } = useFieldArray({ control: form.control, name: "transfers" });
  
  const teachers = useMemo(() => users.filter(u => u.roles.includes('teacher')), [users]);

  const affectedStudents = useMemo(() => {
    const affected: { 
      studentId: string, 
      studentName: string, 
      sessionId: string, 
      day: string, 
      newTeacherId: string 
    }[] = [];
    
    if (!leaveRequest || leaveRequest.type !== 'teacher') return [];

    const leaveInterval = { 
      start: new Date(leaveRequest.startDate), 
      end: new Date(leaveRequest.endDate) 
    };

    // Find active semester
    const activeSemester = semesters.find(s => s.isActive) || semesters[0];
    if (!activeSemester) return [];

    // Check if leave overlaps with semester
    const semesterInterval = {
      start: new Date(activeSemester.startDate),
      end: new Date(activeSemester.endDate)
    };

    if (!isWithinInterval(new Date(), semesterInterval)) return [];

    const teacherSchedule = activeSemester.masterSchedule[leaveRequest.personName];
    if (!teacherSchedule) return [];

    Object.entries(teacherSchedule).forEach(([day, sessions]) => {
        const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(day);
        
        const leaveDays = eachDayOfInterval(leaveInterval);

        for (const session of sessions) {
            for (const student of session.students) {
                const studentIsAffected = leaveDays.some(leaveDay => 
                  leaveDay.getDay() === dayIndex
                );
                
                if (studentIsAffected && !affected.find(a => 
                  a.studentId === student.id && a.sessionId === session.id
                )) {
                  affected.push({ 
                    studentId: student.id, 
                    studentName: student.name, 
                    sessionId: session.id, 
                    day, 
                    newTeacherId: '' 
                  });
                }
            }
        }
    });
    
    return affected;
  }, [leaveRequest, semesters]);

  useEffect(() => {
    replace(affectedStudents);
  }, [affectedStudents, replace]);

  const onSubmit = async (data: TransferFormValues) => {
    setIsLoading(true);
    try {
      // Find active semester
      const activeSemester = semesters.find(s => s.isActive) || semesters[0];
      if (!activeSemester) throw new Error("Could not find an active semester.");
      
      const updatedMasterSchedule = JSON.parse(JSON.stringify(activeSemester.masterSchedule));

      for (const transfer of data.transfers) {
        const newTeacher = users.find(u => u.id === transfer.newTeacherId);
        if (!newTeacher) continue;
        
        // 1. Remove student from old teacher's session
        const oldTeacherSessions = updatedMasterSchedule[leaveRequest.personName][transfer.day];
        const oldSessionIndex = oldTeacherSessions.findIndex((s: Session) => s.id === transfer.sessionId);
        
        if (oldSessionIndex !== -1) {
            oldTeacherSessions[oldSessionIndex].students = oldTeacherSessions[oldSessionIndex].students.filter(
              (s: any) => s.id !== transfer.studentId
            );
        }

        // 2. Add student to new teacher's session (or create it)
        if (!updatedMasterSchedule[newTeacher.name]) updatedMasterSchedule[newTeacher.name] = {};
        if (!updatedMasterSchedule[newTeacher.name][transfer.day]) updatedMasterSchedule[newTeacher.name][transfer.day] = [];
        
        const newTeacherSessions = updatedMasterSchedule[newTeacher.name][transfer.day];
        const existingSessionIndex = newTeacherSessions.findIndex((s: Session) => s.id === transfer.sessionId);

        const studentData = { 
          id: transfer.studentId, 
          name: transfer.studentName, 
          attendance: null, 
          pendingRemoval: false 
        };
        
        if (existingSessionIndex !== -1) {
             newTeacherSessions[existingSessionIndex].students.push(studentData);
        } else {
             const oldSession = oldTeacherSessions[oldSessionIndex];
             newTeacherSessions.push({ ...oldSession, students: [studentData] });
        }

        // 3. Update student's enrolledIn record
        const student = students.find(s => s.id === transfer.studentId);
        if (student) {
          await updateStudent(transfer.studentId, { 
              enrolledIn: student.enrolledIn.map(e => 
                  e.sessionId === transfer.sessionId ? { ...e, teacher: newTeacher.name } : e
              )
          });
        }
      }

      if (activeSemester.id) {
        await updateSemester(activeSemester.id, { masterSchedule: updatedMasterSchedule });
      }
      
      await onApprovalSuccess();
      toast({ 
        title: t('leavesPage.studentsTransferred'), 
        description: t('leavesPage.studentsTransferredDescription')
      });
      onOpenChange(false);

    } catch(error: any) {
      toast({ 
        title: t('common.error'), 
        description: error.message, 
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>{t('leavesPage.transferTitle', { name: leaveRequest.personName })}</DialogTitle>
                <DialogDescription>
                  {t('leavesPage.transferDescription')}
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-72 my-4">
                <div className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-md">
                        <p className="font-semibold">{field.studentName}</p>
                        <p className="text-sm text-muted-foreground">Session on {field.day}</p>
                         <FormField
                            control={form.control}
                            name={`transfers.${index}.newTeacherId`}
                            render={({ field }) => (
                                <FormItem className="mt-2">
                                  <FormLabel>New Teacher</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a new teacher..." />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {teachers.filter(t => t.id !== leaveRequest.personId).map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                            )}
                         />
                    </div>
                ))}
                 {fields.length === 0 && (
                   <p className="text-center text-muted-foreground">
                     No students are affected during this leave period.
                   </p>
                 )}
                </div>
            </ScrollArea>
             <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                  {t('leavesPage.cancel')}
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                  {t('leavesPage.confirmTransfers')}
                </Button>
            </DialogFooter>
            </form>
            </Form>
        </DialogContent>
    </Dialog>
  )
}

// Main Page Component
export default function LeavesPage() {
  const { leaves, loading, updateLeave } = useDatabase();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [forceUpdate, setForceUpdate] = useState(0);
  const [leaveToTransfer, setLeaveToTransfer] = useState<Leave | null>(null);

  const onLeaveAdded = () => setForceUpdate(p => p + 1);

  const handleApprove = async (leave: Leave) => {
    try {
      if (leave.type === 'teacher') {
          setLeaveToTransfer(leave);
      } else {
          if (leave.id) {
            await updateLeave(leave.id, { status: 'approved' });
            toast({ 
              title: t('leavesPage.leaveApproved'), 
              description: `The leave request for ${leave.personName} has been approved.`
            });
          }
      }
    } catch (error) {
      console.error('Error approving leave:', error);
    }
  };
  
  const handleDeny = async (leave: Leave) => {
    try {
      if (leave.id) {
        await updateLeave(leave.id, { status: 'denied' });
        toast({ 
          title: t('leavesPage.leaveDenied'), 
          description: `The leave request for ${leave.personName} has been denied.`, 
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error denying leave:', error);
    }
  };
  
  const handleApprovalSuccess = async () => {
    if (!leaveToTransfer || !leaveToTransfer.id) return;
    
    try {
      await updateLeave(leaveToTransfer.id, { status: 'approved' });
      toast({ 
        title: t('leavesPage.leaveApproved'), 
        description: `The leave request for ${leaveToTransfer.personName} has been approved.`
      });
      setLeaveToTransfer(null);
    } catch (error) {
      console.error('Error completing approval:', error);
    }
  }

  const getStatusVariant = (status: Leave['status']): "default" | "secondary" | "destructive" => {
    switch (status) {
        case 'approved': return 'default';
        case 'pending': return 'secondary';
        case 'denied': return 'destructive';
    }
  }

  const sortedLeaves = useMemo(() => {
    return [...leaves].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.startDate);
      const dateB = new Date(b.createdAt || b.startDate);
      return dateB.getTime() - dateA.getTime();
    });
  }, [leaves, forceUpdate]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <Plane className="w-8 h-8" /> {t('leavesPage.title')}
        </h1>
        <AddLeaveDialog onLeaveAdded={onLeaveAdded} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('leavesPage.title')}</CardTitle>
          <CardDescription>{t('leavesPage.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex justify-center items-center h-48">
               <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : sortedLeaves.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedLeaves.map(leave => (
                <Card key={leave.id || `${leave.personId}-${leave.startDate}`}>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-start">
                            <span>{leave.personName}</span>
                            <Badge variant={getStatusVariant(leave.status)} className="capitalize">
                              {leave.status}
                            </Badge>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                           {leave.type === 'student' ? 
                             <User className="h-4 w-4" /> : 
                             <Building className="h-4 w-4" />
                           } 
                           <span className="capitalize">{leave.type === 'student' ? t('leavesPage.student') : t('leavesPage.teacher')}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p>
                          <strong>Dates:</strong> {format(new Date(leave.startDate), 'PPP')} to {format(new Date(leave.endDate), 'PPP')}
                        </p>
                        <p>
                          <strong>{t('leavesPage.reason')}:</strong> {leave.reason}
                        </p>
                    </CardContent>
                    {leave.status === 'pending' && (
                        <CardFooter className="flex gap-2">
                            <Button size="sm" className="w-full" onClick={() => handleApprove(leave)}>
                              <CheckCircle className="mr-2 h-4 w-4" /> {t('leavesPage.approve')}
                            </Button>
                            <Button size="sm" variant="destructive" className="w-full" onClick={() => handleDeny(leave)}>
                              <XCircle className="mr-2 h-4 w-4"/> {t('leavesPage.deny')}
                            </Button>
                        </CardFooter>
                    )}
                </Card>
              ))}
            </div>
          ) : (
             <p className="text-center text-muted-foreground py-8">{t('leavesPage.noRequests')}</p>
          )}
        </CardContent>
      </Card>
      
      {leaveToTransfer && (
        <TransferStudentsDialog 
            leaveRequest={leaveToTransfer}
            onOpenChange={() => setLeaveToTransfer(null)}
            onApprovalSuccess={handleApprovalSuccess}
        />
      )}
    </div>
  );
}
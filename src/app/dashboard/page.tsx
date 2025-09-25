"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, User, Hourglass, Calendar, ChevronLeft, ChevronRight, BarChart3, UserPlus, Upload, FileDown, Check, X, Clock, File, Trash2, GripVertical, FileText, MessageCircle, BookOpen, TrendingUp, CalendarPlus, Star } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Semester, SessionStudent, Session, ProcessedSession, StudentProfile, TeacherRequest, Leave, UserInDb } from "@/lib/types";
import { useAuth } from "@/context/auth-context";
import { useDatabase } from "@/context/database-context";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { addDays, format, startOfWeek, isWithinInterval, subDays } from 'date-fns';
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from 'react-i18next';
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

// Import for Export
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Component imports
import { EnrollStudentDialog } from "@/components/enroll-student-dialog";
import { AddStudentDialog } from "@/components/add-student-dialog";
import { CreateSessionDialog } from "@/components/create-session-dialog";
import { ImportStudentsDialog } from "@/components/import-students-dialog";
import { DeleteStudentDialog } from "@/components/delete-student-dialog";

interface ImportScheduleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImportScheduleDialog = ({
  isOpen,
  onOpenChange
}: ImportScheduleDialogProps) => {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("importSchedule.title")}</DialogTitle>
          <DialogDescription>
            {t("importSchedule.description")}
          </DialogDescription>
        </DialogHeader>

        {/* CSV Upload Form */}
        <ImportStudentsDialog isOpen={isOpen} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
};

// Teacher Statistics Component
const TeacherStats = ({ processedSessions, weekStartDate }: { processedSessions: ProcessedSession[], weekStartDate: string }) => {
  const { t } = useTranslation();
  
  const stats = useMemo(() => {
    let totalStudents = 0;
    let presentStudents = 0;
    let absentStudents = 0;
    let lateStudents = 0;
    let totalSessions = processedSessions.length;

    processedSessions.forEach(session => {
      session.students.forEach(student => {
        totalStudents++;
        switch (student.attendance) {
          case 'present':
            presentStudents++;
            break;
          case 'absent':
            absentStudents++;
            break;
          case 'late':
            lateStudents++;
            break;
        }
      });
    });

    const attendanceRate = totalStudents > 0 ? ((presentStudents + lateStudents) / totalStudents) * 100 : 0;

    return {
      totalSessions,
      totalStudents,
      presentStudents,
      absentStudents,
      lateStudents,
      attendanceRate: Math.round(attendanceRate)
    };
  }, [processedSessions]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{stats.totalSessions}</p>
              <p className="text-sm text-muted-foreground">Sessions</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{stats.totalStudents}</p>
              <p className="text-sm text-muted-foreground">Students</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            <div>
              <p className="text-2xl font-bold">{stats.attendanceRate}%</p>
              <p className="text-sm text-muted-foreground">Attendance</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{stats.presentStudents}</p>
              <p className="text-sm text-muted-foreground">Present</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Quick Attendance Component
const QuickAttendance = ({ processedSessions, onUpdate, semester, teacherName, weekStartDate }: { 
  processedSessions: ProcessedSession[], 
  onUpdate: () => void,
  semester: Semester,
  teacherName: string,
  weekStartDate: string
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { updateSemester } = useDatabase();

  const handleQuickAttendance = async (studentId: string, sessionId: string, status: SessionStudent['attendance']) => {
    if (!semester || !user || !weekStartDate) return;
    
    const updatedWeeklyAttendance = JSON.parse(JSON.stringify(semester.weeklyAttendance || {}));
    if (!updatedWeeklyAttendance[weekStartDate]) updatedWeeklyAttendance[weekStartDate] = {};
    if (!updatedWeeklyAttendance[weekStartDate][teacherName]) updatedWeeklyAttendance[weekStartDate][teacherName] = {};
    if (!updatedWeeklyAttendance[weekStartDate][teacherName][sessionId]) updatedWeeklyAttendance[weekStartDate][teacherName][sessionId] = {};
    
    updatedWeeklyAttendance[weekStartDate][teacherName][sessionId][studentId] = { status };
    
    try {
        await updateSemester(semester.id || "", { weeklyAttendance: updatedWeeklyAttendance });
        toast({ title: 'Attendance updated', description: `Marked as ${status}` });
        onUpdate();
    } catch (error) {
        console.error('Error updating attendance:', error);
        toast({ title: 'Error', description: 'Failed to update attendance', variant: "destructive" });
    }
  };

  const todaysSessions = processedSessions.filter(session => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return session.day === today;
  });

  if (todaysSessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Quick Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">No sessions today</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Quick Attendance - Today
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-96 overflow-y-auto">
        <div className="space-y-4">
          {todaysSessions.map(session => (
            <div key={session.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium">{session.specialization}</h4>
                  <p className="text-sm text-muted-foreground">{session.time}</p>
                </div>
                <Badge variant="outline">{session.type}</Badge>
              </div>
              
              <div className="space-y-2">
                {session.students.map(student => (
                  <div key={student.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <span className="text-sm font-medium">{student.name}</span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant={student.attendance === 'present' ? 'default' : 'outline'}
                        className="h-7 px-2"
                        onClick={() => handleQuickAttendance(student.id, session.id, 'present')}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant={student.attendance === 'absent' ? 'destructive' : 'outline'}
                        className="h-7 px-2"
                        onClick={() => handleQuickAttendance(student.id, session.id, 'absent')}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant={student.attendance === 'late' ? 'secondary' : 'outline'}
                        className="h-7 px-2"
                        onClick={() => handleQuickAttendance(student.id, session.id, 'late')}
                      >
                        <Clock className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Student Progress Component
const StudentProgress = ({ processedSessions }: { processedSessions: ProcessedSession[] }) => {
  const { t } = useTranslation();
  
  const studentStats = useMemo(() => {
    const stats: { [studentId: string]: { name: string, present: number, total: number, sessions: string[] } } = {};
    
    processedSessions.forEach(session => {
      session.students.forEach(student => {
        if (!stats[student.id]) {
          stats[student.id] = { name: student.name, present: 0, total: 0, sessions: [] };
        }
        stats[student.id].total++;
        if (student.attendance === 'present' || student.attendance === 'late') {
          stats[student.id].present++;
        }
        stats[student.id].sessions.push(session.specialization);
      });
    });
    
    return Object.values(stats).map(stat => ({
      ...stat,
      attendanceRate: stat.total > 0 ? Math.round((stat.present / stat.total) * 100) : 0
    })).sort((a, b) => b.attendanceRate - a.attendanceRate);
  }, [processedSessions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Student Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-96 overflow-y-auto">
        <div className="space-y-4">
          {studentStats.map(student => (
            <div key={student.name} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{student.name}</h4>
                <Badge variant={student.attendanceRate >= 80 ? 'default' : student.attendanceRate >= 60 ? 'secondary' : 'destructive'}>
                  {student.attendanceRate}%
                </Badge>
              </div>
              <Progress value={student.attendanceRate} className="mb-2" />
              <p className="text-xs text-muted-foreground">
                {student.present}/{student.total} sessions attended
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Simplified Teacher Actions Component
const TeacherActionsCard = ({ onRequestRemoval, onExportCSV }: { 
  onRequestRemoval: () => void,
  onExportCSV: () => void
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Teacher Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          onClick={onRequestRemoval}
          className="w-full justify-start text-destructive hover:text-destructive"
          variant="outline"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Request Student Removal
        </Button>
        <Button 
          onClick={onExportCSV}
          className="w-full justify-start"
          variant="outline"
        >
          <FileDown className="mr-2 h-4 w-4" />
          Export My Schedule
        </Button>
      </CardContent>
    </Card>
  );
};

const ScheduleGrid = ({ processedSessions, dayFilter, semester, teacherName, onUpdate, weekStartDate, studentLeaves }: { processedSessions: ProcessedSession[]; dayFilter: string; semester: Semester | undefined; teacherName: string; onUpdate: () => void; weekStartDate: string, studentLeaves: Leave[] }) => {
  const { t } = useTranslation();
  
  // Define the day keys and their order
  const allDaysKeys = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
  
  const isMobile = useIsMobile();
  const days = isMobile && dayFilter.toLowerCase() !== 'all' ? [dayFilter] : allDaysKeys;
  const timeSlots = Array.from({ length: 12 }, (_, i) => `${i + 10}:00`); // 10 AM to 9 PM (for slots ending at 10 PM)
  const { user } = useAuth();
  const { toast } = useToast();
  const { updateSemester, addTeacherRequest, updateStudent, students: allStudents } = useDatabase();
  
  const [sessionToCreate, setSessionToCreate] = useState<{day: string, time: string} | null>(null);
  const [sessionToDeleteFrom, setSessionToDeleteFrom] = useState<ProcessedSession | null>(null);

  const handleUpdateAttendance = async (studentId: string, sessionId: string, day: string, status: SessionStudent['attendance']) => {
      if (!semester || !user || !weekStartDate) return;
      const attendancePath = `weeklyAttendance.${weekStartDate}.${teacherName}.${sessionId}.${studentId}`;
      
      const updatedWeeklyAttendance = JSON.parse(JSON.stringify(semester.weeklyAttendance || {}));
      if (!updatedWeeklyAttendance[weekStartDate]) updatedWeeklyAttendance[weekStartDate] = {};
      if (!updatedWeeklyAttendance[weekStartDate][teacherName]) updatedWeeklyAttendance[weekStartDate][teacherName] = {};
      if (!updatedWeeklyAttendance[weekStartDate][teacherName][sessionId]) updatedWeeklyAttendance[weekStartDate][teacherName][sessionId] = {};
      
      updatedWeeklyAttendance[weekStartDate][teacherName][sessionId][studentId] = { status };
      
      try {
          await updateSemester(semester.id || "", { weeklyAttendance: updatedWeeklyAttendance });
          toast({ title: t('attendance.updated'), description: t('attendance.markedAs', { status: t(`attendance.${status}`) })});
          onUpdate();
      } catch (error) {
          console.error('Error updating attendance:', error);
          toast({ title: t('common.error'), description: t('attendance.updateFailed'), variant: "destructive" });
      }
  };

  const handleRemoveStudent = async (student: SessionStudent, session: ProcessedSession) => {
    if (!semester || !user) return;
    const isTeacher = user?.activeRole === 'teacher';

    try {
        if (isTeacher) {
            // Teacher requests removal
            const request: Omit<TeacherRequest, 'id' | 'createdAt' | 'updatedAt'> = {
                type: 'remove-student',
                status: 'pending',
                date: new Date().toISOString(),
                teacherId: user.id,
                teacherName: user.name,
                details: {
                    studentId: student.id,
                    studentName: student.name,
                    sessionId: session.id,
                    sessionTime: session.time,
                    day: session.day,
                    reason: t('removal.teacherReason'),
                    semesterId: semester.id || ""
                }
            };
            
            await addTeacherRequest(request);

            // Also mark student as pending removal in master schedule
            const masterSchedule = JSON.parse(JSON.stringify(semester.masterSchedule));
            const daySessions = masterSchedule[teacherName]?.[session.day];
            const sessionIndex = daySessions.findIndex((s: Session) => s.id === session.id);
            if (sessionIndex > -1) {
                const studentIndex = daySessions[sessionIndex].students.findIndex((s: SessionStudent) => s.id === student.id);
                if (studentIndex > -1) {
                    masterSchedule[teacherName][session.day][sessionIndex].students[studentIndex].pendingRemoval = true;
                     await updateSemester(semester.id || "", { masterSchedule });
                     toast({ title: t('removal.requested'), description: t('removal.requestSent', { studentName: student.name }) });
                }
            }
        } else { // Admin directly removes
            const masterSchedule = JSON.parse(JSON.stringify(semester.masterSchedule));
            const daySessions = masterSchedule[teacherName]?.[session.day];
            if (!daySessions) throw new Error(t('errors.daySessionsNotFound'));
            const sessionIndex = daySessions.findIndex((s: Session) => s.id === session.id);
            if(sessionIndex === -1) throw new Error(t('errors.sessionNotFound'));

            masterSchedule[teacherName][session.day][sessionIndex].students = 
                daySessions[sessionIndex].students.filter((s: SessionStudent) => s.id !== student.id);

            const studentProfile = allStudents.find(s => s.id === student.id);
            if (!studentProfile) throw new Error(t('errors.studentProfileNotFound'));

            const updatedEnrolledIn = studentProfile.enrolledIn.filter(e => !(e.semesterId === semester.id && e.sessionId === session.id));
            
            await updateStudent(student.id, { enrolledIn: updatedEnrolledIn });
            await updateSemester(semester.id || "", { masterSchedule });

            toast({ title: t('removal.studentRemoved'), description: t('removal.removedFromSession', { studentName: student.name }) });
        }
        onUpdate();
    } catch (error: any) {
        toast({ title: t('common.error'), description: t('removal.processFailed', { message: error.message }), variant: 'destructive'});
    }
  };

  const formatTimeForDisplay = (time: string) => {
      const date = new Date(`1970-01-01T${time}:00`);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
  }

  const filteredSessions = useMemo(() => {
    if (dayFilter.toLowerCase() === 'all') return processedSessions;
    return processedSessions.filter(s => s.day.toLowerCase() === dayFilter.toLowerCase());
  }, [processedSessions, dayFilter])

  // Updated function to get translated day name
  const getDayName = (dayKey: string) => {
    const dayMap: { [key: string]: string } = {
      'Saturday': t('days.saturday'),
      'Sunday': t('days.sunday'),
      'Monday': t('days.monday'),
      'Tuesday': t('days.tuesday'),
      'Wednesday': t('days.wednesday'),
      'Thursday': t('days.thursday')
    };
    return dayMap[dayKey] || dayKey;
  };

  if (isMobile && dayFilter.toLowerCase() === 'all' && filteredSessions.length > 0) {
    return <Card className="mt-4"><CardContent className="p-4 text-center text-muted-foreground">{t('schedule.selectDayToView')}</CardContent></Card>;
  }

  if (!processedSessions || processedSessions.length === 0 || (isMobile && filteredSessions.length === 0 && dayFilter.toLowerCase() !== 'all')) {
    return <Card className="mt-4"><CardContent className="p-4 text-center text-muted-foreground">{t('schedule.noScheduleAvailable')}</CardContent></Card>;
  }

  return (
    <>
    <div id="schedule-grid-container" className={cn("grid gap-px bg-border", isMobile ? "grid-cols-[auto_1fr]" : "grid-cols-[auto_repeat(6,_1fr)] -ml-4 -mr-4")}>
      {/* Time Column */}
      <div className="flex flex-col">
        <div className="h-12 bg-background"></div>
        {timeSlots.map(time => (
            <div key={time} className="h-28 flex items-start justify-center bg-background pt-2 px-2 text-xs text-muted-foreground">
                {formatTimeForDisplay(time)}
            </div>
        ))}
      </div>

      {/* Day Columns */}
      {days.map((day) => day && (
        <div key={day} className="relative col-span-1 bg-background">
          <div className="sticky top-16 z-10 bg-background/95 backdrop-blur-sm h-12 flex items-center justify-center font-semibold border-b">
            {getDayName(day)}
          </div>
          <div className="space-y-px">
             {timeSlots.map((time, index) => {
               // Check if there's a session starting at this time slot
               const sessionAtThisTime = filteredSessions.find(session => 
                 session.day === day && session.startRow === index
               );
               
               if (sessionAtThisTime) {
                 // Render session card spanning multiple rows
                 return (
                   <div 
                     key={`${day}-${time}`} 
                     className="bg-background border-t group/cell relative p-1"
                     style={{ minHeight: `${sessionAtThisTime.duration * 7}rem` }}
                   >
                     <Card className="w-full h-full flex flex-col shadow-sm bg-background border">
                       <CardHeader className="p-3 pb-2">
                           <div className="flex items-center justify-between">
                               <div className="min-w-0 flex-1">
                                   <p className="font-semibold text-sm leading-tight truncate">{sessionAtThisTime.specialization}</p>
                                   <p className="text-xs text-muted-foreground">{sessionAtThisTime.time} - {sessionAtThisTime.endTime}</p>
                               </div>
                               <Badge variant="secondary" className="text-xs font-normal ml-2 flex-shrink-0">{sessionAtThisTime.type}</Badge>
                           </div>
                       </CardHeader>
                       <CardContent className="p-3 pt-0 flex-grow flex flex-col overflow-hidden">
                           <Separator className="mb-2"/>
                           <div className="flex-grow overflow-y-auto">
                               {sessionAtThisTime.students && sessionAtThisTime.students.length > 0 ? (
                                   <div className="space-y-2">
                                       {sessionAtThisTime.students.map((student: SessionStudent) => {
                                           const isOnLeave = studentLeaves.some(l => l.personId === student.id);
                                           const attendance = isOnLeave ? 'excused' : student.attendance;

                                           return (
                                               <div key={student.id} className={cn(
                                                   "flex justify-between items-center p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors group/student",
                                                   student.pendingRemoval && "opacity-50 bg-destructive/10"
                                               )}>
                                                   <div className="flex items-center gap-2 flex-1 min-w-0">
                                                       <User className="h-3 w-3 shrink-0 text-muted-foreground" />
                                                       <span className="text-xs font-medium truncate">{student.name}</span>
                                                       {student.pendingRemoval && (
                                                           <Badge variant="destructive" className="text-[9px] px-1 py-0 h-auto">
                                                               <Hourglass className="h-2 w-2 mr-1" />
                                                               Pending
                                                           </Badge>
                                                       )}
                                                       {isOnLeave && (
                                                           <Badge variant="outline" className="text-[9px] px-1 py-0 h-auto">
                                                               Leave
                                                           </Badge>
                                                       )}
                                                   </div>
                                                   <div className="flex items-center gap-1 shrink-0">
                                                       {/* Attendance Status Indicator */}
                                                       <div className={cn(
                                                           "w-2 h-2 rounded-full flex-shrink-0",
                                                           attendance === 'present' && "bg-green-500",
                                                           attendance === 'absent' && "bg-red-500",
                                                           attendance === 'late' && "bg-amber-500",
                                                           attendance === 'excused' && "bg-blue-500",
                                                           !attendance && "bg-gray-300"
                                                       )} />

                                                       {/* Attendance Popover */}
                                                       <Popover>
                                                           <PopoverTrigger asChild>
                                                               <Button
                                                                   variant="ghost"
                                                                   size="icon"
                                                                   className="h-5 w-5 opacity-0 group-hover/student:opacity-100 transition-opacity hover:bg-background flex-shrink-0"
                                                                   title="Mark Attendance"
                                                               >
                                                                   <GripVertical className="h-2.5 w-2.5" />
                                                               </Button>
                                                           </PopoverTrigger>
                                                           <PopoverContent className="w-auto p-1" align="end">
                                                               <div className="flex gap-1">
                                                                   <Button
                                                                       onClick={() => handleUpdateAttendance(student.id, sessionAtThisTime.id, day, 'present')}
                                                                       variant="ghost"
                                                                       size="icon"
                                                                       className="h-6 w-6 hover:bg-green-50"
                                                                       title="Present"
                                                                   >
                                                                       <Check className="h-3 w-3 text-green-600" />
                                                                   </Button>
                                                                   <Button
                                                                       onClick={() => handleUpdateAttendance(student.id, sessionAtThisTime.id, day, 'absent')}
                                                                       variant="ghost"
                                                                       size="icon"
                                                                       className="h-6 w-6 hover:bg-red-50"
                                                                       title="Absent"
                                                                   >
                                                                       <X className="h-3 w-3 text-red-600" />
                                                                   </Button>
                                                                   <Button
                                                                       onClick={() => handleUpdateAttendance(student.id, sessionAtThisTime.id, day, 'late')}
                                                                       variant="ghost"
                                                                       size="icon"
                                                                       className="h-6 w-6 hover:bg-amber-50"
                                                                       title="Late"
                                                                   >
                                                                       <Clock className="h-3 w-3 text-amber-600" />
                                                                   </Button>
                                                                   <Button
                                                                       onClick={() => handleUpdateAttendance(student.id, sessionAtThisTime.id, day, 'excused')}
                                                                       variant="ghost"
                                                                       size="icon"
                                                                       className="h-6 w-6 hover:bg-blue-50"
                                                                       title="Excused"
                                                                   >
                                                                       <File className="h-3 w-3 text-blue-600" />
                                                                   </Button>
                                                               </div>
                                                           </PopoverContent>
                                                       </Popover>

                                                       {/* Delete Button */}
                                                       <Button
                                                           onClick={() => handleRemoveStudent(student, sessionAtThisTime)}
                                                           variant="ghost"
                                                           size="icon"
                                                           className="h-5 w-5 opacity-0 group-hover/student:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                                                           title={t('actions.removeFromSession', { name: student.name })}
                                                       >
                                                           <Trash2 className="h-2.5 w-2.5" />
                                                       </Button>
                                                   </div>
                                               </div>
                                           )
                                       })}
                                   </div>
                               ) : (
                                   <div className="flex-grow flex items-center justify-center py-4">
                                       <div className="text-center">
                                           <User className="h-6 w-6 mx-auto text-muted-foreground/50 mb-2" />
                                           <p className="text-xs text-muted-foreground">{t('schedule.noStudentsEnrolled')}</p>
                                       </div>
                                   </div>
                               )}
                           </div>
                       </CardContent>
                       {semester && (
                           <CardFooter className="p-2 border-t bg-background/50">
                               <div className="flex w-full gap-1">
                                   <AddStudentDialog session={sessionAtThisTime} semester={semester} teacherName={teacherName} onStudentAdded={onUpdate} asChild>
                                       <Button variant="ghost" size="sm" className={cn("h-7 text-xs font-normal", sessionAtThisTime.students && sessionAtThisTime.students.length > 0 ? "flex-1" : "w-full", "text-muted-foreground hover:text-foreground")}>
                                           <UserPlus className="mr-1 h-3 w-3" /> {t('actions.enrollStudent')}
                                       </Button>
                                   </AddStudentDialog>
                                   {sessionAtThisTime.students && sessionAtThisTime.students.length > 0 && (
                                       <Button 
                                           variant="ghost" 
                                           size="sm" 
                                           className="flex-1 h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 font-normal"
                                           onClick={() => setSessionToDeleteFrom(sessionAtThisTime)}
                                       >
                                           <Trash2 className="mr-1 h-3 w-3" /> {t('actions.removeStudent')}
                                       </Button>
                                   )}
                               </div>
                           </CardFooter>
                       )}
                     </Card>
                   </div>
                 );
               } else {
                 // Check if this slot is occupied by a multi-row session from above
                 const occupyingSession = filteredSessions.find(session => 
                   session.day === day && 
                   session.startRow < index && 
                   session.startRow + session.duration > index
                 );
                 
                 if (occupyingSession) {
                   // This slot is occupied by a session that started earlier, skip it
                   return null;
                 }
                 
                 // Render empty time slot
                 return (
                   <div key={`${day}-${time}`} className="h-28 bg-background border-t group/cell relative">
                       <Button 
                           variant="ghost" 
                           size="icon" 
                           className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-0 group-hover/cell:opacity-100 transition-opacity z-10"
                           onClick={() => setSessionToCreate({ day, time: formatTimeForDisplay(time) })}
                       >
                           <UserPlus className="h-4 w-4 text-muted-foreground" />
                       </Button>
                   </div>
                 );
               }
             })}
          </div>
        </div>
      ))}
    </div>
     {sessionToCreate && semester && (
        <CreateSessionDialog
            isOpen={!!sessionToCreate}
            onOpenChange={() => setSessionToCreate(null)}
            day={sessionToCreate.day}
            time={sessionToCreate.time}
            semester={semester}
            teacherName={teacherName}
            onSessionCreated={onUpdate}
        />
     )}
     {sessionToDeleteFrom && semester && (
        <Dialog open={!!sessionToDeleteFrom} onOpenChange={() => setSessionToDeleteFrom(null)}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('actions.removeStudent')}</DialogTitle>
                    <DialogDescription>
                        {t('removal.selectStudentFromSession')}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {sessionToDeleteFrom.students.map((sessionStudent) => {
                        const fullStudent = allStudents.find(s => s.id === sessionStudent.id);
                        if (!fullStudent) return null;
                        
                        return (
                            <div key={sessionStudent.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">{sessionStudent.name}</p>
                                        <p className="text-sm text-muted-foreground">{fullStudent.level}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                        handleRemoveStudent(sessionStudent, sessionToDeleteFrom);
                                        setSessionToDeleteFrom(null);
                                    }}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {t('actions.remove')}
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
     )}
    </>
  );
};

export default function DashboardPage() {
    const { user, users } = useAuth();
    const { semesters, students, leaves, loading: dbLoading } = useDatabase();
    const isAdmin = user?.activeRole === 'admin';
    const isTeacher = user?.activeRole === 'teacher';
    const isMobile = useIsMobile();
    const { t } = useTranslation();

    const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
    const [selectedTeacher, setSelectedTeacher] = useState<string>("");
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [dayFilter, setDayFilter] = useState('All');
    
    const [processedSessions, setProcessedSessions] = useState<ProcessedSession[]>([]);
    const [_, setForceUpdate] = useState({});

    const [isEnrolling, setIsEnrolling] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    // Prevent hydration error
    useEffect(() => {
        setSelectedDate(new Date());
    }, []);

    const weekStart = useMemo(() => {
        if (!selectedDate) return '';
        // Assuming week starts on Saturday
        const dayOfWeek = selectedDate.getDay();
        const difference = (dayOfWeek < 6) ? - (dayOfWeek + 1) : 0;
        const saturday = addDays(selectedDate, difference);
        return format(saturday, 'yyyy-MM-dd');
    }, [selectedDate]);
    
    const [semestersState, setSemestersState] = useState(semesters);
     useEffect(() => {
        setSemestersState(semesters);
    }, [semesters]);

    useEffect(() => {
        if (semestersState.length > 0 && !selectedSemesterId) {
            const activeSemester = semestersState.find(s => isWithinInterval(new Date(), {start: new Date(s.startDate), end: new Date(s.endDate)})) || semestersState[0];
            setSelectedSemesterId(activeSemester.id || null);
        }
    }, [semestersState, selectedSemesterId]);

    const selectedSemester = useMemo(() => {
        return semestersState.find(s => s.id === selectedSemesterId);
    }, [semestersState, selectedSemesterId]);

    const availableTeachers = useMemo(() => {
        if (!selectedSemester?.masterSchedule) return [];
        const teacherNames = Object.keys(selectedSemester.masterSchedule);
        const teacherUsers = users.filter(u => teacherNames.includes(u.name) && u.roles.includes('teacher'));

        if (user?.activeRole === 'teacher') {
            return teacherUsers.filter(t => t.name === user.name);
        }
        return teacherUsers;
    }, [selectedSemester, user, users]);

    useEffect(() => {
        if (availableTeachers.length > 0) {
            if (user?.activeRole === 'teacher' && user.name && availableTeachers.some(t => t.name === user.name)) {
                setSelectedTeacher(user.name);
            } else if (!selectedTeacher || !availableTeachers.some(t => t.name === selectedTeacher)) {
                setSelectedTeacher(availableTeachers[0].name);
            }
        } else if (availableTeachers.length === 0) {
            setSelectedTeacher("");
        }
    }, [availableTeachers, user, selectedTeacher]);

    const loadScheduleForTeacherAndWeek = useCallback(() => {
        if (!selectedSemester || !selectedTeacher || !weekStart) {
            setProcessedSessions([]);
            return;
        }

        const teacherSchedule = selectedSemester.masterSchedule?.[selectedTeacher] || {};
        const weeklyAttendance = selectedSemester.weeklyAttendance?.[weekStart]?.[selectedTeacher] || {};
        
        const newProcessedSessions: ProcessedSession[] = [];
        
        Object.entries(teacherSchedule).forEach(([day, sessions]) => {
            sessions.forEach(session => {
                const timeParts = session.time.match(/(\d+):(\d+)\s(AM|PM)/);
                if (!timeParts) return;

                let [, hourStr, , ampm] = timeParts;
                let hour = parseInt(hourStr, 10);
                
                if (ampm === 'PM' && hour !== 12) hour += 12;
                if (ampm === 'AM' && hour === 12) hour = 0; // Midnight case

                // The grid starts at 10 AM, so we subtract 10 to get the row index.
                const startRow = hour - 10;
                
                if (startRow >= 0) {
                    const sessionAttendance = weeklyAttendance[session.id] || {};
                    const studentsWithAttendance = session.students.map(student => ({
                        ...student,
                        attendance: sessionAttendance[student.id]?.status || null,
                    }));

                    newProcessedSessions.push({ 
                        ...session, 
                        students: studentsWithAttendance,
                        day, 
                        startRow 
                    });
                }
            });
        });
        setProcessedSessions(newProcessedSessions);
    }, [selectedSemester, selectedTeacher, weekStart]);

    const weekDates = useMemo(() => {
        if (!weekStart) return [];
        const start = new Date(weekStart);
        return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }, [weekStart]);

    const studentLeavesForWeek = useMemo(() => {
        return leaves.filter(l => 
            l.type === 'student' &&
            l.status === 'approved' &&
            weekDates.some(d => isWithinInterval(d, { start: new Date(l.startDate), end: new Date(l.endDate) }))
        );
    }, [leaves, weekDates]);

    const isTeacherOnLeave = useMemo(() => {
        if (!user || user.activeRole !== 'teacher') return false;
        return leaves.some(l => 
            l.type === 'teacher' &&
            l.personId === user.id &&
            l.status === 'approved' &&
            weekDates.some(d => isWithinInterval(d, { start: new Date(l.startDate), end: new Date(l.endDate) }))
        )
    }, [leaves, user, weekDates]);

    useEffect(() => {
        loadScheduleForTeacherAndWeek();
    }, [loadScheduleForTeacherAndWeek]);

    const handleUpdate = () => {
        loadScheduleForTeacherAndWeek();
        setForceUpdate({}); // Force re-render if needed
    };

    const handleExportPDF = () => {
        const scheduleElement = document.getElementById('schedule-grid-container');
        if (scheduleElement) {
            html2canvas(scheduleElement).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('l', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`schedule-${selectedTeacher}-${weekStart}.pdf`);
            });
        }
    };
    
    const handleExportCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += `"${t('csv.day')}","${t('csv.time')}","${t('csv.specialization')}","${t('csv.type')}","${t('csv.studentName')}","${t('csv.attendance')}"\n`;

        processedSessions.forEach(session => {
            session.students.forEach(student => {
                const row = [
                    `"${session.day}"`,
                    `"${session.time}"`,
                    `"${session.specialization}"`,
                    `"${session.type}"`,
                    `"${student.name}"`,
                    `"${student.attendance ? t(`attendance.${student.attendance}`) : t('common.na')}"`
                ].join(",");
                csvContent += row + "\r\n";
            });
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `schedule-${selectedTeacher}-${weekStart}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (dbLoading || !selectedDate) {
        return (
            <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const weekEnd = addDays(new Date(weekStart), 5);
    
    return (
        <div className="space-y-4">
            {/* Teacher-specific dashboard widgets */}
            {isTeacher && selectedSemester && selectedTeacher && (
                <>
                    {/* Welcome Section for Teachers */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back, {user?.name}!</h1>
                        <p className="text-muted-foreground">Here's your teaching overview for this week</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                        <TeacherStats processedSessions={processedSessions} weekStartDate={weekStart} />
                        <QuickAttendance 
                            processedSessions={processedSessions} 
                            onUpdate={handleUpdate}
                            semester={selectedSemester}
                            teacherName={selectedTeacher}
                            weekStartDate={weekStart}
                        />
                        <StudentProgress processedSessions={processedSessions} />
                    </div>

                    {/* Teacher Tools Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageCircle className="h-5 w-5" />
                                    My Class Notes
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">Keep track of your observations and reminders</p>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    placeholder="Add your class notes, observations, and reminders here..."
                                    className="min-h-32 mb-4"
                                    disabled
                                />
                                <p className="text-sm text-muted-foreground">
                                    Notes feature coming soon - requires database schema update
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Star className="h-5 w-5" />
                                    Quick Actions
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">Manage your classes efficiently</p>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button 
                                    onClick={() => setIsEnrolling(true)}
                                    className="w-full justify-start"
                                    variant="outline"
                                >
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Enroll Student in My Classes
                                </Button>
                                <Button 
                                    onClick={() => setIsDeleting(true)}
                                    className="w-full justify-start text-destructive hover:text-destructive"
                                    variant="outline"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Request Student Removal
                                </Button>
                                <Button 
                                    onClick={handleExportCSV}
                                    className="w-full justify-start"
                                    variant="outline"
                                >
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Export My Schedule
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}

            {/* Main Dashboard Header - Different for Admin vs Teacher */}
            {!isTeacher && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <h1 className="text-2xl font-headline self-start">{t('dashboard.title')}</h1>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                        {isAdmin && (
                            <>
                                <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsEnrolling(true)}>
                                    <UserPlus className="h-4 w-4 mr-2" /> {t('actions.enrollStudent')}
                                </Button>
                                <Button variant="outline" className="w-full sm:w-auto text-destructive hover:text-destructive" onClick={() => setIsDeleting(true)}>
                                    <Trash2 className="h-4 w-4 mr-2" /> {t('actions.removeStudent')}
                                </Button>
                                <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsImporting(true)}>
                                    <Upload className="h-4 w-4 mr-2" /> {t('actions.import')}
                                </Button>
                                <Button variant="outline" className="w-full sm:w-auto" onClick={handleExportPDF}>
                                    <FileText className="h-4 w-4 mr-2" /> {t('actions.exportPDF')}
                                </Button>
                                <Button variant="outline" className="w-full sm:w-auto" onClick={handleExportCSV}>
                                    <FileDown className="h-4 w-4 mr-2" /> {t('actions.exportCSV')}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Teacher-specific schedule header */}
            {isTeacher && (
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">My Teaching Schedule</h2>
                    <div className="text-sm text-muted-foreground">
                        Click on students to mark attendance or manage enrollment
                    </div>
                </div>
            )}
            
            <Card>
                <CardContent className="p-4 flex flex-col xl:flex-row xl:items-center gap-4">
                    {isAdmin && (
                        <>
                            <div className="w-full xl:w-auto flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-muted-foreground" />
                                <Select value={selectedSemesterId || ""} onValueChange={setSelectedSemesterId}>
                                  <SelectTrigger className="w-full xl:w-[180px]">
                                    <SelectValue placeholder={t('dashboard.selectSemester')} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {semestersState.map(s => <SelectItem key={s.id} value={s.id || ""}>{s.name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                            </div>
                            <div className="w-full xl:w-auto flex items-center gap-2">
                                 <Users className="w-5 h-5 text-muted-foreground" />
                                 <Select value={selectedTeacher} onValueChange={setSelectedTeacher} disabled={!selectedSemesterId || availableTeachers.length === 0}>
                                  <SelectTrigger className="w-full xl:w-[180px]">
                                    <SelectValue placeholder={t('dashboard.selectTeacher')} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableTeachers.map(t => <SelectItem key={t.id} value={t.name || ""}>{t.name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}
                     <div className="w-full xl:w-auto flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full xl:w-[240px] justify-start text-left font-normal">
                                    <span>{format(new Date(weekStart), 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent mode="single" selected={selectedDate || undefined} onSelect={(date) => date && setSelectedDate(date)} initialFocus/>
                            </PopoverContent>
                        </Popover>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedDate(addDays(selectedDate!, -7))}><ChevronLeft /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedDate(addDays(selectedDate!, 7))}><ChevronRight /></Button>
                        </div>
                    </div>
                    <div className="w-full xl:w-auto flex items-center gap-2 xl:ml-auto">
                         <Tabs value={dayFilter} onValueChange={setDayFilter} className="w-full md:w-auto">
                            <TabsList className="grid w-full grid-cols-4 md:grid-cols-7">
                                <TabsTrigger value="All">{t('days.all')}</TabsTrigger>
                                <TabsTrigger value="Saturday">{t('days.satShort')}</TabsTrigger>
                                <TabsTrigger value="Sunday">{t('days.sunShort')}</TabsTrigger>
                                <TabsTrigger value="Monday">{t('days.monShort')}</TabsTrigger>
                                <TabsTrigger value="Tuesday">{t('days.tueShort')}</TabsTrigger>
                                <TabsTrigger value="Wednesday">{t('days.wedShort')}</TabsTrigger>
                                <TabsTrigger value="Thursday">{t('days.thuShort')}</TabsTrigger>
                            </TabsList>
                         </Tabs>
                    </div>
                </CardContent>
            </Card>

            <div className="overflow-x-auto">
                {isTeacherOnLeave ? (
                     <Card><CardContent className="p-6 text-center text-muted-foreground">{t('schedule.onLeaveMessage')}</CardContent></Card>
                ) : selectedTeacher ? (
                    <ScheduleGrid 
                        processedSessions={processedSessions} 
                        dayFilter={dayFilter} 
                        semester={selectedSemester}
                        teacherName={selectedTeacher}
                        onUpdate={handleUpdate}
                        weekStartDate={weekStart}
                        studentLeaves={studentLeavesForWeek}
                    />
                ) : (
                    <Card><CardContent className="p-6 text-center text-muted-foreground">{isAdmin ? t('schedule.selectTeacherMessage') : 'Loading your schedule...'}</CardContent></Card>
                )}
            </div>

             {selectedSemester && (
                <>
                    <EnrollStudentDialog 
                        isOpen={isEnrolling} 
                        onOpenChange={setIsEnrolling} 
                        students={students}
                        semester={selectedSemester}
                        teachers={users.filter(u => u.roles.includes('teacher'))}
                        onEnrollmentSuccess={handleUpdate}
                    />
                    {/* You need to select a single student to delete; here is an example using the first student */}
                    <DeleteStudentDialog
                        isOpen={isDeleting}
                        onOpenChange={setIsDeleting}
                        student={students[0]}
                    />
                </>
            )}
            <ImportScheduleDialog isOpen={isImporting} onOpenChange={setIsImporting} />
        </div>
    );
}
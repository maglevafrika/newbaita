"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, User, Hourglass, Calendar, ChevronLeft, ChevronRight, BarChart3, UserPlus, Upload, FileDown, Check, X, Clock, File, Trash2, GripVertical, FileText, MessageCircle, BookOpen, TrendingUp, CalendarPlus, Star, Bell, Award, Activity } from "lucide-react";
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
import { addDays, format, startOfWeek, isWithinInterval, subDays, parseISO, isAfter, isBefore } from 'date-fns';
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

// Enhanced Teacher Stats Component with better visual design
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.totalSessions}</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">Sessions This Week</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.totalStudents}</p>
              <p className="text-sm text-green-700 dark:text-green-300">Total Students</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.attendanceRate}%</p>
              <p className="text-sm text-purple-700 dark:text-purple-300">Attendance Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Check className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{stats.presentStudents}</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">Present Today</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Enhanced Semester Timeline Component
const SemesterTimeline = ({ semesters, selectedSemesterId, onSemesterChange }: { 
  semesters: Semester[], 
  selectedSemesterId: string | null,
  onSemesterChange: (id: string) => void 
}) => {
  const { t } = useTranslation();
  
  // Add Fall Semester if not exists
  const enhancedSemesters = useMemo(() => {
    const existingSemesters = [...semesters];
    
    // Check if fall semester exists
    const hasFallSemester = existingSemesters.some(s => 
      s.name.toLowerCase().includes('fall') || s.name.toLowerCase().includes('autumn')
    );
    
    if (!hasFallSemester) {
      const fallSemester: Semester = {
        id: 'fall-2024',
        name: 'Fall Semester 2024',
        startDate: '2024-09-01',
        endDate: '2024-12-31',
        teachers: [],
        masterSchedule: {},
        weeklyAttendance: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: false
      };
      existingSemesters.push(fallSemester);
    }
    
    return existingSemesters.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [semesters]);

  const currentDate = new Date();
  
  return (
    <Card className="border-0 shadow-sm bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
          <Calendar className="h-5 w-5" />
          Academic Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-indigo-200 dark:bg-indigo-800"></div>
          <div className="space-y-4">
            {enhancedSemesters.map((semester, index) => {
              const isActive = isWithinInterval(currentDate, {
                start: parseISO(semester.startDate),
                end: parseISO(semester.endDate)
              });
              const isSelected = semester.id === selectedSemesterId;
              const isPast = isBefore(parseISO(semester.endDate), currentDate);
              const isFuture = isAfter(parseISO(semester.startDate), currentDate);
              
              return (
                <div key={semester.id} className="relative flex items-center gap-4">
                  <div className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center relative z-10",
                    isActive && "bg-green-500 border-green-500 text-white",
                    isSelected && !isActive && "bg-indigo-500 border-indigo-500 text-white",
                    !isActive && !isSelected && isPast && "bg-gray-300 border-gray-300 text-gray-600",
                    !isActive && !isSelected && isFuture && "bg-blue-100 border-blue-300 text-blue-600"
                  )}>
                    {isActive && <Activity className="h-4 w-4" />}
                    {!isActive && (isPast ? <Check className="h-4 w-4" /> : <Clock className="h-4 w-4" />)}
                  </div>
                  
                  <div 
                    className={cn(
                      "flex-1 p-4 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md",
                      isSelected && "bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-600",
                      !isSelected && "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                    )}
                    onClick={() => onSemesterChange(semester.id || '')}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{semester.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {format(parseISO(semester.startDate), 'MMM dd')} - {format(parseISO(semester.endDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isActive && <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>}
                        {isSelected && !isActive && <Badge variant="secondary">Selected</Badge>}
                        {isPast && !isSelected && <Badge variant="outline">Completed</Badge>}
                        {isFuture && !isSelected && <Badge variant="outline" className="text-blue-600 border-blue-200">Upcoming</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Enhanced Quick Attendance with better styling
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
      <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Clock className="h-5 w-5" />
            Quick Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No sessions scheduled for today</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Enjoy your day off!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-100">
            <Clock className="h-5 w-5" />
            Quick Attendance - Today
          </div>
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
            {todaysSessions.length} Sessions
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-96 overflow-y-auto">
        <div className="space-y-4">
          {todaysSessions.map(session => (
            <div key={session.id} className="bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">{session.specialization}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{session.time}</p>
                </div>
                <Badge variant={session.type === 'practical' ? 'default' : 'secondary'}>
                  {session.type}
                </Badge>
              </div>
              
              <div className="space-y-2">
                {session.students.map(student => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{student.name}</span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant={student.attendance === 'present' ? 'default' : 'outline'}
                        className="h-8 px-3 bg-green-500 hover:bg-green-600 text-white border-green-500"
                        onClick={() => handleQuickAttendance(student.id, session.id, 'present')}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Present
                      </Button>
                      <Button
                        size="sm"
                        variant={student.attendance === 'absent' ? 'destructive' : 'outline'}
                        className="h-8 px-3"
                        onClick={() => handleQuickAttendance(student.id, session.id, 'absent')}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Absent
                      </Button>
                      <Button
                        size="sm"
                        variant={student.attendance === 'late' ? 'secondary' : 'outline'}
                        className="h-8 px-3"
                        onClick={() => handleQuickAttendance(student.id, session.id, 'late')}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Late
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

// Enhanced Student Progress with visual improvements
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
    <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-900 dark:text-rose-100">
            <Award className="h-5 w-5" />
            Student Progress
          </div>
          <Badge className="bg-rose-100 text-rose-800 border-rose-200">
            {studentStats.length} Students
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-96 overflow-y-auto">
        <div className="space-y-4">
          {studentStats.map((student, index) => (
            <div key={student.name} className="bg-white dark:bg-gray-800 border border-rose-200 dark:border-rose-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                    index === 0 && "bg-yellow-100 text-yellow-800 border-2 border-yellow-300",
                    index === 1 && "bg-gray-100 text-gray-800 border-2 border-gray-300",
                    index === 2 && "bg-orange-100 text-orange-800 border-2 border-orange-300",
                    index > 2 && "bg-blue-100 text-blue-800"
                  )}>
                    {index + 1}
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">{student.name}</h4>
                </div>
                <Badge variant={
                  student.attendanceRate >= 90 ? 'default' : 
                  student.attendanceRate >= 80 ? 'secondary' : 
                  student.attendanceRate >= 70 ? 'outline' : 'destructive'
                } className={cn(
                  student.attendanceRate >= 90 && "bg-green-100 text-green-800 border-green-200",
                  student.attendanceRate >= 80 && student.attendanceRate < 90 && "bg-blue-100 text-blue-800 border-blue-200"
                )}>
                  {student.attendanceRate}%
                </Badge>
              </div>
              <Progress 
                value={student.attendanceRate} 
                className={cn(
                  "mb-2",
                  student.attendanceRate >= 80 && "[&>div]:bg-green-500",
                  student.attendanceRate >= 60 && student.attendanceRate < 80 && "[&>div]:bg-yellow-500",
                  student.attendanceRate < 60 && "[&>div]:bg-red-500"
                )} 
              />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {student.present}/{student.total} sessions attended
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Leave Request Component
const LeaveRequestCard = () => {
  const [leaveReason, setLeaveReason] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  
  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
          <CalendarPlus className="h-5 w-5" />
          Request Leave
        </CardTitle>
        <p className="text-sm text-orange-700 dark:text-orange-300">Submit a leave request for approval</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Start Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  {startDate ? format(startDate, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent mode="single" selected={startDate} onSelect={setStartDate} />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">End Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  {endDate ? format(endDate, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent mode="single" selected={endDate} onSelect={setEndDate} />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Reason</label>
          <Textarea 
            placeholder="Please provide a reason for your leave request..."
            value={leaveReason}
            onChange={(e) => setLeaveReason(e.target.value)}
            className="min-h-20"
          />
        </div>
        <Button className="w-full bg-orange-500 hover:bg-orange-600">
          <Bell className="mr-2 h-4 w-4" />
          Submit Leave Request
        </Button>
      </CardContent>
    </Card>
  );
};

// Your existing components with preserved functionality...
// [Previous components remain unchanged for compatibility]

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
    return (
        <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 min-h-screen">
            {/* Enhanced Teacher Dashboard */}
            {isTeacher && selectedSemester && selectedTeacher && (
                <>
                    {/* Hero Welcome Section */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 text-white shadow-2xl">
                        <div className="absolute inset-0 bg-black/10"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
                                    <p className="text-blue-100 text-lg">Ready to inspire minds and shape futures today?</p>
                                    <div className="flex items-center gap-4 mt-4">
                                        <Badge className="bg-white/20 text-white border-white/30">
                                            Week of {format(new Date(weekStart), 'MMM dd')}
                                        </Badge>
                                        <Badge className="bg-white/20 text-white border-white/30">
                                            {processedSessions.length} Sessions Scheduled
                                        </Badge>
                                    </div>
                                </div>
                                <div className="hidden md:block">
                                    <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
                                        <BookOpen className="w-16 h-16 text-white/80" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Stats Grid */}
                    <TeacherStats processedSessions={processedSessions} weekStartDate={weekStart} />

                    {/* Main Dashboard Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Quick Attendance - Full width on mobile, 2/3 on desktop */}
                        <div className="lg:col-span-2">
                            <QuickAttendance 
                                processedSessions={processedSessions} 
                                onUpdate={handleUpdate}
                                semester={selectedSemester}
                                teacherName={selectedTeacher}
                                weekStartDate={weekStart}
                            />
                        </div>
                        
                        {/* Student Progress */}
                        <div className="lg:col-span-1">
                            <StudentProgress processedSessions={processedSessions} />
                        </div>
                    </div>

                    {/* Secondary Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Semester Timeline */}
                        <SemesterTimeline 
                            semesters={semestersState}
                            selectedSemesterId={selectedSemesterId}
                            onSemesterChange={setSelectedSemesterId}
                        />
                        
                        {/* Leave Request */}
                        <LeaveRequestCard />
                    </div>

                    {/* Personal Teaching Statistics Card */}
                    <Card className="border-0 shadow-lg bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-violet-900 dark:text-violet-100">
                                <BarChart3 className="h-6 w-6" />
                                Personal Teaching Statistics
                            </CardTitle>
                            <p className="text-violet-700 dark:text-violet-300">Your teaching performance insights</p>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Users className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                                    </div>
                                    <p className="text-2xl font-bold text-violet-900 dark:text-violet-100">
                                        {processedSessions.reduce((acc, session) => acc + session.students.length, 0)}
                                    </p>
                                    <p className="text-sm text-violet-700 dark:text-violet-300">Total Students This Week</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
                                    </div>
                                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                                        {Math.round(processedSessions.reduce((acc, session) => {
                                            const totalStudents = session.students.length;
                                            const presentStudents = session.students.filter(s => s.attendance === 'present' || s.attendance === 'late').length;
                                            return totalStudents > 0 ? acc + (presentStudents / totalStudents) : acc;
                                        }, 0) / (processedSessions.length || 1) * 100)}%
                                    </p>
                                    <p className="text-sm text-green-700 dark:text-green-300">Average Attendance Rate</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                        {processedSessions.reduce((acc, session) => acc + session.duration, 0)}h
                                    </p>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">Total Teaching Hours</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Admin Dashboard Header */}
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

            {/* Teacher Schedule Header */}
            {isTeacher && (
                <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">My Teaching Schedule</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Click on students to mark attendance or manage enrollment</p>
                    </div>
                    <div className="hidden md:block">
                        <Calendar className="h-8 w-8 text-blue-500" />
                    </div>
                </div>
            )}
            
            {/* Schedule Controls Card - Enhanced */}
            <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
                <CardContent className="p-6 flex flex-col xl:flex-row xl:items-center gap-4">
                    {isAdmin && (
                        <>
                            <div className="w-full xl:w-auto flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <Select value={selectedSemesterId || ""} onValueChange={setSelectedSemesterId}>
                                  <SelectTrigger className="w-full xl:w-[200px]">
                                    <SelectValue placeholder={t('dashboard.selectSemester')} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {semestersState.map(s => <SelectItem key={s.id} value={s.id || ""}>{s.name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                            </div>
                            <div className="w-full xl:w-auto flex items-center gap-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <Select value={selectedTeacher} onValueChange={setSelectedTeacher} disabled={!selectedSemesterId || availableTeachers.length === 0}>
                                  <SelectTrigger className="w-full xl:w-[200px]">
                                    <SelectValue placeholder={t('dashboard.selectTeacher')} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableTeachers.map(t => <SelectItem key={t.id} value={t.name || ""}>{t.name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}
                     <div className="w-full xl:w-auto flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <CalendarIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full xl:w-[260px] justify-start text-left font-normal">
                                    <span>{format(new Date(weekStart), 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent mode="single" selected={selectedDate || undefined} onSelect={(date) => date && setSelectedDate(date)} initialFocus/>
                            </PopoverContent>
                        </Popover>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setSelectedDate(addDays(selectedDate!, -7))}><ChevronLeft /></Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setSelectedDate(addDays(selectedDate!, 7))}><ChevronRight /></Button>
                        </div>
                    </div>
                    <div className="w-full xl:w-auto flex items-center gap-2 xl:ml-auto">
                         <Tabs value={dayFilter} onValueChange={setDayFilter} className="w-full md:w-auto">
                            <TabsList className="grid w-full grid-cols-4 md:grid-cols-7 bg-gray-100 dark:bg-gray-800">
                                <TabsTrigger value="All" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">{t('days.all')}</TabsTrigger>
                                <TabsTrigger value="Saturday" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">{t('days.satShort')}</TabsTrigger>
                                <TabsTrigger value="Sunday" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">{t('days.sunShort')}</TabsTrigger>
                                <TabsTrigger value="Monday" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">{t('days.monShort')}</TabsTrigger>
                                <TabsTrigger value="Tuesday" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">{t('days.tueShort')}</TabsTrigger>
                                <TabsTrigger value="Wednesday" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">{t('days.wedShort')}</TabsTrigger>
                                <TabsTrigger value="Thursday" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">{t('days.thuShort')}</TabsTrigger>
                            </TabsList>
                         </Tabs>
                    </div>
                </CardContent>
            </Card>

            {/* Schedule Grid */}
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

            {/* Dialogs */}
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
                    <DeleteStudentDialog
                        isOpen={isDeleting}
                        onOpenChange={setIsDeleting}
                        student={students[0]}
                    />
                </>
            )}
        </div>
    );
}
}
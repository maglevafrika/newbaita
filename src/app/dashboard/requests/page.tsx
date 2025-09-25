"use client";

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  User,
  Calendar,
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { TeacherRequest, Semester, Session, SessionStudent, StudentProfile } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useDatabase } from '@/context/database-context';
import { useTranslation } from 'react-i18next';

export default function RequestsPage() {
  const { 
    teacherRequests, 
    loading, 
    updateTeacherRequest, 
    updateSemester, 
    updateStudent, 
    semesters, 
    students 
  } = useDatabase();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Helper function to get semester by ID
  const getSemester = (semesterId: string): Semester | null => {
    return semesters.find(s => s.id === semesterId) || null;
  };

  // Helper function to get student by ID
  const getStudent = (studentId: string): StudentProfile | null => {
    return students.find(s => s.id === studentId) || null;
  };

  const handleAction = async (request: TeacherRequest, action: "approved" | "denied") => {
    if (!request.id) {
      toast({
        title: t('common.error'),
        description: t('requests.errors.missingRequestId'),
        variant: "destructive",
      });
      return;
    }

    try {
      if (action === 'approved' && request.type === 'remove-student') {
        const semester = getSemester(request.details.semesterId);
        const student = getStudent(request.details.studentId);
        
        if (!semester || !student) {
          throw new Error(t('requests.errors.semesterOrStudentNotFound'));
        }

        if (!semester.id) {
          throw new Error(t('requests.errors.missingSemesterId'));
        }

        if (!student.id) {
          throw new Error(t('requests.errors.missingStudentId'));
        }

        // Create a deep copy of the master schedule
        const masterSchedule = JSON.parse(JSON.stringify(semester.masterSchedule));
        
        // Check if teacher exists in schedule
        if (!masterSchedule[request.teacherName]) {
          throw new Error(t('requests.errors.teacherNotFound', { teacherName: request.teacherName }));
        }

        // Check if day exists for teacher
        const daySessions = masterSchedule[request.teacherName]?.[request.details.day];
        if (!daySessions) {
          throw new Error(t('requests.errors.noSessionsFound', { teacherName: request.teacherName, day: request.details.day }));
        }
        
        // Find the session
        const sessionIndex = daySessions.findIndex((s: Session) => s.id === request.details.sessionId);
        if (sessionIndex === -1) {
          throw new Error(t('requests.errors.sessionNotFound', { sessionId: request.details.sessionId }));
        }
        
        // Remove the student from the session
        const updatedStudents = daySessions[sessionIndex].students.filter(
          (s: SessionStudent) => s.id !== request.details.studentId
        );
        
        masterSchedule[request.teacherName][request.details.day][sessionIndex].students = updatedStudents;
        
        // Remove the enrollment from student's enrolledIn list
        const updatedEnrolledIn = student.enrolledIn.filter(e => 
          !(e.semesterId === request.details.semesterId && e.sessionId === request.details.sessionId)
        );
        
        // Update both student and semester
        await updateStudent(student.id, { enrolledIn: updatedEnrolledIn });
        await updateSemester(semester.id, { masterSchedule });
      }
      
      // Update the request status
      await updateTeacherRequest(request.id, { status: action });
      
      toast({
        title: t(`requests.status.${action}`),
        description: t(`requests.status.${action}Description`),
      });

    } catch (error: any) {
      console.error(`Error updating request ${request.id}: `, error);
      toast({
        title: t(`requests.status.failed${action.charAt(0).toUpperCase() + action.slice(1)}`),
        description: t('requests.status.updateError', { message: error.message }),
        variant: "destructive",
      });
    }
  };

  const getRequestTitle = (request: TeacherRequest) => {
    switch (request.type) {
      case "add-student":
        return t('requests.types.addStudentTitle');
      case "remove-student":
        return t('requests.types.removeStudentTitle');
      case "change-time":
        return t('requests.types.changeTimeTitle');
      default:
        return t('requests.types.newRequest');
    }
  };

  const getBadgeVariant = (type: TeacherRequest['type']): "default" | "secondary" | "destructive" => {
    switch (type) {
      case 'remove-student':
        return 'destructive';
      case 'add-student':
        return 'default';
      case 'change-time':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const formatRequestType = (type: TeacherRequest['type'] | string): string => {
    switch (type) {
      case 'add-student':
        return t('requests.types.addStudent');
      case 'remove-student':
        return t('requests.types.removeStudent');
      case 'change-time':
        return t('requests.types.changeTime');
      default:
        return (type as string).replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
    }
  };

  const pendingRequests = teacherRequests.filter((r) => r.status === "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <FileText className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">{t('requests.title')}</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : pendingRequests.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('requests.noPending.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('requests.noPending.description')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pendingRequests.map((request) => (
            <Card key={request.id || `${request.teacherId}-${request.date}`} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span className="text-base">{getRequestTitle(request)}</span>
                  <Badge variant={getBadgeVariant(request.type)}>
                    {formatRequestType(request.type)}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {t('requests.submittedOn')}{" "}
                  {format(new Date(request.date), "MMMM dd, yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">{request.details.studentName}</p>
                    <p className="text-muted-foreground">{t('requests.labels.student')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">{request.teacherName}</p>
                    <p className="text-muted-foreground">{t('requests.labels.teacher')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">{request.details.day}</p>
                    <p className="text-muted-foreground">{t('requests.labels.classDay')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">{request.details.sessionTime}</p>
                    <p className="text-muted-foreground">{t('requests.labels.classTime')}</p>
                  </div>
                </div>
                <div className="border-l-2 pl-3 ml-1.5 border-muted">
                  <p className="font-semibold text-muted-foreground mb-1">{t('requests.labels.reason')}:</p>
                  <p className="italic">"{request.details.reason}"</p>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  className="w-full"
                  onClick={() => handleAction(request, "approved")}
                  disabled={loading}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t('requests.actions.approve')}
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleAction(request, "denied")}
                  disabled={loading}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {t('requests.actions.deny')}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
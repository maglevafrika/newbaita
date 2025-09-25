"use client";

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import type { ProcessedSession, Semester, Session, StudentProfile, SessionStudent, TeacherRequest } from '@/lib/types';
import { UserPlus } from 'lucide-react';
import { useDatabase } from '@/context/database-context';

interface AddStudentDialogProps {
  session: ProcessedSession;
  semester: Semester;
  teacherName: string;
  onStudentAdded: () => void;
  asChild?: boolean;
  children?: React.ReactNode;
}

export const AddStudentDialog = ({ 
  session, 
  semester, 
  teacherName, 
  onStudentAdded, 
  asChild = false, 
  children 
}: AddStudentDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { students: allStudents, updateSemester, addTeacherRequest, enrollStudent } = useDatabase();
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Check user permissions
  const isAdmin = user?.activeRole === 'admin';
  const canAddDirectly = isAdmin || user?.roles.includes('admin');

  const handleAddStudent = async (student: StudentProfile) => {
    if (!student.id || !semester.id) {
      toast({ 
        title: "Error", 
        description: "Missing required student or semester information!", 
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create the student session entry
      const studentToAdd: SessionStudent = { 
        id: student.id, 
        name: student.name, 
        attendance: null, 
        pendingRemoval: false 
      };
      
      // Deep clone the semester's master schedule
      const updatedSchedule = JSON.parse(JSON.stringify(semester.masterSchedule));
      const daySessions = updatedSchedule[teacherName]?.[session.day];
      
      if (!daySessions) {
        toast({ 
          title: "Error", 
          description: "Day or teacher schedule not found!", 
          variant: 'destructive'
        });
        return;
      }

      // Find the session in the schedule
      const sessionIndex = daySessions.findIndex((s: Session) => s.id === session.id);
      if (sessionIndex === -1) {
        toast({ 
          title: "Error", 
          description: "Session not found!", 
          variant: 'destructive'
        });
        return;
      }

      // Check if student is already in this session
      const studentExists = daySessions[sessionIndex].students.some((s: SessionStudent) => s.id === student.id);
      if (studentExists) {
        toast({ 
          title: "Student Already Enrolled", 
          description: `${student.name} is already in this session.`, 
          variant: "default" 
        });
        return;
      }
      
      // Add student to the session
      updatedSchedule[teacherName][session.day][sessionIndex].students.push(studentToAdd);
      
      // Update the semester schedule
      await updateSemester(semester.id, { masterSchedule: updatedSchedule });

      // Also enroll the student in their profile
      await enrollStudent(student.id, {
        semesterId: semester.id,
        teacher: teacherName,
        sessionId: session.id,
      });

      toast({ 
        title: "Student Added", 
        description: `${student.name} has been added to the session successfully.` 
      });
      
      onStudentAdded();
      setIsOpen(false);

    } catch (error: any) {
      console.error('Error adding student:', error);
      toast({
        title: "Error",
        description: `Failed to add student: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRequestAddStudent = async (student: StudentProfile) => {
    if (!user || !student.id || !semester.id) {
      toast({
        title: "Error",
        description: "Missing required information to submit request!",
        variant: 'destructive'
      });
      return;
    }
    
    setIsLoading(true);

    try {
      const request: Omit<TeacherRequest, 'id' | 'createdAt' | 'updatedAt'> = {
        type: 'add-student',
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
          reason: `Teacher requested to add ${student.name} to their session.`,
          semesterId: semester.id
        }
      };

      await addTeacherRequest(request);

      toast({ 
        title: "Request Sent", 
        description: `Request to add ${student.name} has been sent for approval.` 
      });
      
      onStudentAdded();
      setIsOpen(false);

    } catch (error: any) {
      console.error('Error submitting request:', error);
      toast({
        title: "Error",
        description: `Failed to submit request: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter students to show only those not already in this session
  const filteredStudents = useMemo(() => {
    const sessionStudentIds = session.students.map(s => s.id);
    return allStudents.filter(student => 
      student.id && // Ensure student has an ID
      student.status !== 'deleted' && // Exclude deleted students
      !sessionStudentIds.includes(student.id) &&
      student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allStudents, searchTerm, session.students]);

  // Don't render if user doesn't have permission to see this
  if (!user) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild={asChild}>
        {children ?? (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full h-full text-xs text-muted-foreground font-normal"
            disabled={isLoading}
          >
            <UserPlus className="mr-2 h-3 w-3" /> 
            {canAddDirectly ? "Add Student" : "Request to Add"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Student to Session</DialogTitle>
          <DialogDescription>
            Search for an existing student to add to this session.
            {!canAddDirectly && " Your request will need admin approval."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Session Info */}
          <div className="text-sm text-muted-foreground space-y-1 p-3 bg-muted/50 rounded-md">
            <div><strong>Session:</strong> {session.day} at {session.time}</div>
            <div><strong>Teacher:</strong> {teacherName}</div>
            <div><strong>Current Students:</strong> {session.students.length}</div>
          </div>

          {/* Search Input */}
          <Input 
            placeholder="Search student name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          {/* Students List */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredStudents.length > 0 ? (
              filteredStudents.map(student => (
                <div key={student.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex-1">
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Level: {student.level}
                      {student.contact?.phone && ` • ${student.contact.phone}`}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => canAddDirectly ? handleAddStudent(student) : handleRequestAddStudent(student)}
                    disabled={isLoading}
                  >
                    {isLoading ? "..." : (canAddDirectly ? 'Add' : 'Request')}
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {searchTerm ? "No students found matching your search." : "No available students to add."}
              </p>
            )}
          </div>
          
          {/* Action Info */}
          <div className="text-xs text-muted-foreground text-center">
            {canAddDirectly ? (
              "Students will be added immediately to the session."
            ) : (
              "Requests will be sent to administrators for approval."
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
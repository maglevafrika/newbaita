"use client";

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { StudentProfile } from '@/lib/types';
import { useDatabase } from '@/context/database-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface DeleteStudentDialogProps {
  student: StudentProfile;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteStudentDialog({ student, isOpen, onOpenChange, onSuccess }: DeleteStudentDialogProps) {
  const { updateStudent, deleteStudent } = useDatabase();
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!student.id) {
      toast({
        title: "Error",
        description: "Student ID is missing. Cannot delete student.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // First, update the student with deletion info (soft delete)
      await updateStudent(student.id, {
        status: 'deleted',
        deletionInfo: {
          date: new Date().toISOString(),
          reason: reason || "No reason provided.",
        },
        enrolledIn: [], // Un-enroll from all classes
      });

      // Optionally, you can also hard delete if that's what you prefer
      // await deleteStudent(student.id);

      onOpenChange(false);
      setReason('');
      if (onSuccess) {
        onSuccess();
      }
      
      toast({
        title: "Student Deleted",
        description: `${student.name} has been successfully deleted.`,
      });
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({
        title: "Error",
        description: "Failed to delete student. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleHardDelete = async () => {
    if (!student.id) {
      toast({
        title: "Error",
        description: "Student ID is missing. Cannot delete student.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Hard delete - completely removes from database
      await deleteStudent(student.id);
      
      onOpenChange(false);
      setReason('');
      if (onSuccess) {
        onSuccess();
      }
      
      toast({
        title: "Student Deleted",
        description: `${student.name} has been permanently deleted.`,
      });
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({
        title: "Error",
        description: "Failed to delete student. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete this student?</AlertDialogTitle>
          <AlertDialogDescription>
            This will mark the student '{student.name}' as deleted and un-enroll them from all classes. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reason">Reason for deletion (optional)</Label>
          <Textarea
            id="reason"
            placeholder="e.g., Student has moved to another city."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Soft Delete (Recommended)
          </Button>
          <Button variant="outline" onClick={handleHardDelete} disabled={isLoading} className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Permanent Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
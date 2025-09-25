"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { StudentProfile, Grade, Evaluation, LevelChange } from "@/lib/types";
import { useDatabase } from './database-context';

interface StudentProfileContextType {
  student: StudentProfile | null;
  loading: boolean;
  handleAddGrade: (gradeData: Omit<Grade, 'id'>) => Promise<boolean>;
  handleUpdateStudentLevel: (newLevel: string, review: string) => Promise<boolean>;
  handleEvaluateStudent: (evaluationData: Omit<Evaluation, 'id'>) => Promise<boolean>;
}

const StudentProfileContext = createContext<StudentProfileContextType | undefined>(undefined);

export function StudentProfileProvider({ children, studentId }: { children: ReactNode; studentId: string; }) {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { students, updateStudent, addGrade, addEvaluation } = useDatabase();

  // Update student state when students data changes or studentId changes
  useEffect(() => {
    if (!studentId) {
      setStudent(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const currentStudent = students.find(s => s.id === studentId);
    if (currentStudent) {
      setStudent(currentStudent);
    } else {
      setStudent(null);
    }
    setLoading(false);
  }, [studentId, students]);

  const handleAddGrade = useCallback(async (gradeData: Omit<Grade, 'id'>): Promise<boolean> => {
    if (!student) {
      toast({
        title: "Error",
        description: "No student selected.",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Use the database context's addGrade method for Firebase integration
      await addGrade({
        ...gradeData,
        studentId: student.id!,
      });

      toast({ 
        title: "Grade Added", 
        description: "The new grade has been successfully recorded." 
      });
      return true;
    } catch (error: any) {
      console.error('Add grade error:', error);
      toast({
        title: "Error",
        description: `Failed to add grade: ${error.message}`,
        variant: "destructive"
      });
      return false;
    }
  }, [student, addGrade, toast]);

  const handleUpdateStudentLevel = useCallback(async (newLevel: string, review: string): Promise<boolean> => {
    if (!student) {
      toast({
        title: "Error",
        description: "No student selected.",
        variant: "destructive"
      });
      return false;
    }

    if (newLevel === student.level) {
      toast({ 
        title: "No Change", 
        description: "The selected level is the same as the current level.", 
        variant: "default" 
      });
      return false;
    }

    try {
      const levelChangeEntry: LevelChange = {
        date: new Date().toISOString(),
        level: newLevel,
        review: review
      };

      const updatedLevelHistory = [...(student.levelHistory || []), levelChangeEntry];
      
      // Update student using the database context method
      await updateStudent(student.id!, { 
        level: newLevel, 
        levelHistory: updatedLevelHistory 
      });

      toast({ 
        title: "Level Updated", 
        description: `${student.name}'s level has been changed to ${newLevel}.` 
      });
      return true;
    } catch (error: any) {
      console.error('Update level error:', error);
      toast({
        title: "Error",
        description: `Failed to update level: ${error.message}`,
        variant: "destructive"
      });
      return false;
    }
  }, [student, updateStudent, toast]);

  const handleEvaluateStudent = useCallback(async (evaluationData: Omit<Evaluation, 'id'>): Promise<boolean> => {
    if (!student) {
      toast({
        title: "Error",
        description: "No student selected.",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Use the database context's addEvaluation method for Firebase integration
      // Only pass the data that matches the Evaluation type structure
      await addEvaluation({
        ...evaluationData,
        // Don't add studentName if it's not part of the Evaluation type
        // The addEvaluation method should handle associating with the student internally
      });

      toast({ 
        title: "Evaluation Added", 
        description: "The new evaluation has been successfully recorded." 
      });
      return true;
    } catch (error: any) {
      console.error('Add evaluation error:', error);
      toast({
        title: "Error",
        description: `Failed to add evaluation: ${error.message}`,
        variant: "destructive"
      });
      return false;
    }
  }, [student, addEvaluation, toast]);

  const value: StudentProfileContextType = { 
    student, 
    loading, 
    handleAddGrade, 
    handleUpdateStudentLevel, 
    handleEvaluateStudent 
  };

  return <StudentProfileContext.Provider value={value}>{children}</StudentProfileContext.Provider>;
}

export function useStudentProfile() {
  const context = useContext(StudentProfileContext);
  if (context === undefined) {
    throw new Error('useStudentProfile must be used within a StudentProfileProvider');
  }
  return context;
}
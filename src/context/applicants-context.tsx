"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { Applicant, StudentProfile, InterviewEvaluation } from "@/lib/types";
import { useAuth } from './auth-context';
import { useDatabase } from './database-context';
import { addMinutes, format } from 'date-fns';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ApplicantsContextType {
  applicants: Applicant[];
  loading: boolean;
  addApplicant: (applicantData: Omit<Applicant, 'id' | 'status' | 'applicationDate' | 'lastUpdated'>) => Promise<boolean>;
  updateApplicant: (applicantId: string, applicantData: Partial<Applicant>) => Promise<boolean>;
  deleteApplicant: (applicantId: string) => Promise<boolean>;
  scheduleInterviews: (applicantIds: string[], details: { date: string; startTime: string; duration: number; breakTime: number; teacherIds: string[] }) => Promise<boolean>;
  evaluateApplication: (applicantId: string, evaluation: InterviewEvaluation, enroll: boolean) => Promise<boolean>;
  cancelApplication: (applicantId: string, reason: string) => Promise<boolean>;
  getApplicantsByStatus: (status: string) => Applicant[];
  refreshApplicants: () => Promise<void>;
  migrateInitialApplicants: () => Promise<void>;
}

const ApplicantsContext = createContext<ApplicantsContextType | undefined>(undefined);

export function ApplicantsProvider({ children }: { children: ReactNode }) {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { users } = useAuth();
  const { addStudent } = useDatabase();

  // Initialize real-time listener for applicants
  useEffect(() => {
    const applicantsQuery = query(collection(db, 'applicants'), orderBy('applicationDate', 'desc'));
    const unsubscribeApplicants = onSnapshot(applicantsQuery, 
      (snapshot) => {
        const applicantsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Applicant));
        setApplicants(applicantsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to applicants:', error);
        toast({
          title: "Connection Error",
          description: "Failed to sync applicant data. Please refresh the page.",
          variant: "destructive"
        });
        setLoading(false);
      }
    );

    return () => unsubscribeApplicants();
  }, [toast]);
  
  const addApplicant = useCallback(async (applicantData: Omit<Applicant, 'id' | 'status' | 'applicationDate' | 'lastUpdated'>): Promise<boolean> => {
    try {
      const now = new Date().toISOString();
      await addDoc(collection(db, 'applicants'), {
        ...applicantData,
        status: 'pending-review',
        applicationDate: now,
        lastUpdated: now,
        createdAt: now,
        updatedAt: now,
      });
      
      toast({ 
        title: "Applicant Added", 
        description: `${applicantData.name} has been added successfully.`
      });
      return true;
    } catch(error: any) {
      console.error('Add applicant error:', error);
      toast({ 
        title: "Error", 
        description: `Failed to add applicant: ${error.message}`, 
        variant: 'destructive'
      });
      return false;
    }
  }, [toast]);

  const updateApplicant = useCallback(async (applicantId: string, applicantData: Partial<Applicant>): Promise<boolean> => {
    try {
      await updateDoc(doc(db, 'applicants', applicantId), {
        ...applicantData,
        lastUpdated: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      toast({ 
        title: "Applicant Updated", 
        description: "Applicant details have been saved successfully." 
      });
      return true;
    } catch (error: any) {
      console.error('Update applicant error:', error);
      toast({ 
        title: "Error", 
        description: `Failed to update applicant: ${error.message}`, 
        variant: "destructive" 
      });
      return false;
    }
  }, [toast]);

  const deleteApplicant = useCallback(async (applicantId: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, 'applicants', applicantId));
      
      toast({ 
        title: "Applicant Deleted", 
        description: "The applicant has been permanently removed." 
      });
      return true;
    } catch (error: any) {
      console.error('Delete applicant error:', error);
      toast({ 
        title: "Error", 
        description: `Failed to delete applicant: ${error.message}`, 
        variant: "destructive" 
      });
      return false;
    }
  }, [toast]);

  const scheduleInterviews = useCallback(async (
    applicantIds: string[], 
    details: { date: string; startTime: string; duration: number; breakTime: number; teacherIds: string[] }
  ): Promise<boolean> => {
    try {
      const { date, startTime, duration, breakTime, teacherIds } = details;

      const interviewers = users.filter(u => teacherIds.includes(u.id));
      if (interviewers.length === 0) {
        toast({ 
          title: "No Interviewers", 
          description: "The selected teachers could not be found.", 
          variant: "destructive" 
        });
        return false;
      }

      const [startHour, startMinute] = startTime.split(':').map(Number);
      let interviewTime = new Date(date);
      interviewTime.setHours(startHour, startMinute, 0, 0);

      const totalSlotTime = duration + breakTime;
      
      const schedules: Record<string, Date> = {};
      interviewers.forEach(interviewer => {
        schedules[interviewer.id] = new Date(interviewTime.getTime());
      });
      
      // Use batch for atomic updates
      const batch = writeBatch(db);
      let applicantIndex = 0;

      while(applicantIndex < applicantIds.length) {
        for(const interviewer of interviewers) {
          if(applicantIndex >= applicantIds.length) break;

          const applicantId = applicantIds[applicantIndex];
          const assignedTime = schedules[interviewer.id];

          // Update the applicant document
          batch.update(doc(db, 'applicants', applicantId), {
            status: 'interview-scheduled',
            interviewDate: date,
            interviewTime: format(assignedTime, 'HH:mm'),
            interviewer: interviewer.name,
            lastUpdated: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          schedules[interviewer.id] = addMinutes(assignedTime, totalSlotTime);
          applicantIndex++;
        }
      }

      await batch.commit();
      
      toast({ 
        title: "Interviews Scheduled", 
        description: `Generated schedule for ${applicantIds.length} applicants successfully.` 
      });
      return true;
    } catch (error: any) {
      console.error('Schedule interviews error:', error);
      toast({ 
        title: "Error", 
        description: `Failed to schedule interviews: ${error.message}`, 
        variant: "destructive" 
      });
      return false;
    }
  }, [toast, users]);

  const evaluateApplication = useCallback(async (applicantId: string, evaluation: InterviewEvaluation, enroll: boolean): Promise<boolean> => {
    try {
      const applicantDoc = applicants.find(a => a.id === applicantId);
      if (!applicantDoc) {
        throw new Error("Applicant not found");
      }

      // Use batch for atomic operations
      const batch = writeBatch(db);
      
      // Update applicant with evaluation
      const newStatus = evaluation.decision === 'rejected' ? 'rejected' : 'approved';
      batch.update(doc(db, 'applicants', applicantId), {
        status: newStatus,
        evaluation: evaluation,
        lastUpdated: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // If approved and should enroll, create student record
      if (evaluation.decision === 'approved' && enroll) {
        const studentData = {
          name: applicantDoc.name,
          gender: applicantDoc.gender === "male" || applicantDoc.gender === "female" ? applicantDoc.gender : undefined,
          dob: applicantDoc.dob,
          nationality: applicantDoc.nationality,
          instrumentInterest: applicantDoc.instrumentInterest,
          enrollmentDate: new Date().toISOString().split('T')[0],
          level: 'Beginner', // Default level
          paymentPlan: "none" as "none",
          enrolledIn: [],
          levelHistory: [{
            date: new Date().toISOString(),
            level: 'Beginner',
            review: 'Initial enrollment from application.'
          }],
          status: "active" as const,
          applicantId: applicantId, // Link to original application
        };

        // Add student using the database context method
        await addStudent(studentData);
      }

      await batch.commit();

      const message = evaluation.decision === 'rejected' ? 'rejected' : (enroll ? 'approved and enrolled' : 'approved');
      toast({ 
        title: "Application Evaluated", 
        description: `The application has been ${message} successfully.` 
      });
      return true;
    } catch (error: any) {
      console.error('Evaluate application error:', error);
      toast({ 
        title: "Error", 
        description: `Failed to evaluate application: ${error.message}`, 
        variant: "destructive" 
      });
      return false;
    }
  }, [applicants, toast, addStudent]);

  const cancelApplication = useCallback(async (applicantId: string, reason: string): Promise<boolean> => {
    try {
      await updateDoc(doc(db, 'applicants', applicantId), {
        status: 'cancelled',
        cancellationReason: reason,
        lastUpdated: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      toast({ 
        title: "Application Cancelled", 
        description: "The application has been cancelled successfully." 
      });
      return true;
    } catch (error: any) {
      console.error('Cancel application error:', error);
      toast({ 
        title: "Error", 
        description: `Failed to cancel application: ${error.message}`, 
        variant: "destructive" 
      });
      return false;
    }
  }, [toast]);

  const getApplicantsByStatus = useCallback((status: string) => {
    return applicants.filter(applicant => applicant.status === status);
  }, [applicants]);

  const refreshApplicants = useCallback(async () => {
    try {
      setLoading(true);
      // Data will be refreshed automatically by the listener
      setTimeout(() => setLoading(false), 1000);
    } catch (error: any) {
      console.error('Refresh applicants error:', error);
      setLoading(false);
    }
  }, []);

  const migrateInitialApplicants = useCallback(async () => {
    try {
      // Import the initial data function
      const { getInitialApplicants } = await import('@/lib/data');
      const initialApplicants = getInitialApplicants();
      
      // Check if applicants already exist
      const existingApplicants = await getDocs(collection(db, 'applicants'));
      if (existingApplicants.size > 0) {
        toast({
          title: "Migration Skipped",
          description: "Applicants data already exists in Firebase.",
        });
        return;
      }

      const batch = writeBatch(db);
      const now = new Date().toISOString();

      initialApplicants.forEach((applicant) => {
        const docRef = doc(collection(db, 'applicants'));
        batch.set(docRef, {
          ...applicant,
          createdAt: now,
          updatedAt: now,
          lastUpdated: applicant.lastUpdated || now,
        });
      });

      await batch.commit();
      
      toast({
        title: "Migration Successful",
        description: `${initialApplicants.length} applicants migrated to Firebase successfully.`,
      });
    } catch (error: any) {
      console.error('Migration error:', error);
      toast({
        title: "Migration Failed",
        description: `Failed to migrate applicants: ${error.message}`,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const value: ApplicantsContextType = { 
    applicants, 
    loading, 
    addApplicant,
    updateApplicant,
    deleteApplicant,
    scheduleInterviews,
    evaluateApplication,
    cancelApplication,
    getApplicantsByStatus,
    refreshApplicants,
    migrateInitialApplicants,
  };

  return <ApplicantsContext.Provider value={value}>{children}</ApplicantsContext.Provider>;
}

export function useApplicants() {
  const context = useContext(ApplicantsContext);
  if (context === undefined) {
    throw new Error('useApplicants must be used within an ApplicantsProvider');
  }
  return context;
}
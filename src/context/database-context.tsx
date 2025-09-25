// src/context/database-context.tsx
'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import { 
  StudentProfile, 
  Applicant, 
  Semester, 
  TeacherRequest, 
  Leave, 
  PaymentSettings,
  Grade,
  Evaluation,
  Incompatibility,
  UserProfile
} from '@/lib/types';

interface DatabaseContextType {
  // Students
  students: StudentProfile[];
  addStudent: (student: Omit<StudentProfile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateStudent: (id: string, student: Partial<StudentProfile>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  getStudentsByLevel: (level: string) => StudentProfile[];
  getStudentsByTeacher: (teacherName: string) => StudentProfile[];
  enrollStudent: (studentId: string, enrollment: { semesterId: string; teacher: string; sessionId: string }) => Promise<void>;
  
  // Applicants
  applicants: Applicant[];
  addApplicant: (applicant: Omit<Applicant, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateApplicant: (id: string, applicant: Partial<Applicant>) => Promise<void>;
  deleteApplicant: (id: string) => Promise<void>;
  scheduleInterview: (applicantId: string, interviewData: { interviewDate: string; interviewTime: string; interviewer: string }) => Promise<void>;
  
  // Semesters
  semesters: Semester[];
  activeSemester: Semester | null;
  addSemester: (semester: Omit<Semester, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSemester: (id: string, semester: Partial<Semester>) => Promise<void>;
  deleteSemester: (id: string) => Promise<void>;
  setActiveSemester: (semesterId: string) => Promise<void>;
  
  // Teacher Requests
  teacherRequests: TeacherRequest[];
  addTeacherRequest: (request: Omit<TeacherRequest, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTeacherRequest: (id: string, request: Partial<TeacherRequest>) => Promise<void>;
  deleteTeacherRequest: (id: string) => Promise<void>;
  
  // Leaves
  leaves: Leave[];
  addLeave: (leave: Omit<Leave, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateLeave: (id: string, leave: Partial<Leave>) => Promise<void>;
  deleteLeave: (id: string) => Promise<void>;
  
  // Grades
  grades: Grade[];
  addGrade: (grade: Omit<Grade, 'id' | 'createdAt'>) => Promise<void>;
  updateGrade: (id: string, grade: Partial<Grade>) => Promise<void>;
  deleteGrade: (id: string) => Promise<void>;
  getGradesByStudent: (studentId: string) => Grade[];
  
  // Evaluations
  evaluations: Evaluation[];
  addEvaluation: (evaluation: Omit<Evaluation, 'id' | 'createdAt'>) => Promise<void>;
  updateEvaluation: (id: string, evaluation: Partial<Evaluation>) => Promise<void>;
  deleteEvaluation: (id: string) => Promise<void>;
  
  // Incompatibilities
  incompatibilities: Incompatibility[];
  addIncompatibility: (incompatibility: Omit<Incompatibility, 'id' | 'createdAt'>) => Promise<void>;
  updateIncompatibility: (id: string, incompatibility: Partial<Incompatibility>) => Promise<void>;
  deleteIncompatibility: (id: string) => Promise<void>;
  
  // Settings
  paymentSettings: PaymentSettings | null;
  updatePaymentSettings: (settings: Omit<PaymentSettings, 'updatedAt'>) => Promise<void>;
  
  // Utility
  loading: boolean;
  refreshData: () => Promise<void>;
  migrateInitialData: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [activeSemester, setActiveSemesterState] = useState<Semester | null>(null);
  const [teacherRequests, setTeacherRequests] = useState<TeacherRequest[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [incompatibilities, setIncompatibilities] = useState<Incompatibility[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize real-time listeners
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    // Students listener
    const studentsQuery = query(collection(db, 'students'), orderBy('createdAt', 'desc'));
    const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as StudentProfile));
      setStudents(studentsData);
    });
    unsubscribes.push(unsubscribeStudents);

    // Applicants listener
    const applicantsQuery = query(collection(db, 'applicants'), orderBy('createdAt', 'desc'));
    const unsubscribeApplicants = onSnapshot(applicantsQuery, (snapshot) => {
      const applicantsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Applicant));
      setApplicants(applicantsData);
    });
    unsubscribes.push(unsubscribeApplicants);

    // Semesters listener
    const semestersQuery = query(collection(db, 'semesters'), orderBy('startDate', 'desc'));
    const unsubscribeSemesters = onSnapshot(semestersQuery, (snapshot) => {
      const semestersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Semester));
      setSemesters(semestersData);
      
      // Set active semester
      const active = semestersData.find(s => s.isActive);
      setActiveSemesterState(active || semestersData[0] || null);
    });
    unsubscribes.push(unsubscribeSemesters);

    // Teacher Requests listener
    const requestsQuery = query(collection(db, 'teacherRequests'), orderBy('createdAt', 'desc'));
    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TeacherRequest));
      setTeacherRequests(requestsData);
    });
    unsubscribes.push(unsubscribeRequests);

    // Leaves listener
    const leavesQuery = query(collection(db, 'leaves'), orderBy('createdAt', 'desc'));
    const unsubscribeLeaves = onSnapshot(leavesQuery, (snapshot) => {
      const leavesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Leave));
      setLeaves(leavesData);
    });
    unsubscribes.push(unsubscribeLeaves);

    // Grades listener
    const gradesQuery = query(collection(db, 'grades'), orderBy('date', 'desc'));
    const unsubscribeGrades = onSnapshot(gradesQuery, (snapshot) => {
      const gradesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Grade));
      setGrades(gradesData);
    });
    unsubscribes.push(unsubscribeGrades);

    // Evaluations listener
    const evaluationsQuery = query(collection(db, 'evaluations'), orderBy('date', 'desc'));
    const unsubscribeEvaluations = onSnapshot(evaluationsQuery, (snapshot) => {
      const evaluationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Evaluation));
      setEvaluations(evaluationsData);
    });
    unsubscribes.push(unsubscribeEvaluations);

    // Incompatibilities listener
    const incompatibilitiesQuery = query(collection(db, 'incompatibilities'), orderBy('createdAt', 'desc'));
    const unsubscribeIncompatibilities = onSnapshot(incompatibilitiesQuery, (snapshot) => {
      const incompatibilitiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Incompatibility));
      setIncompatibilities(incompatibilitiesData);
    });
    unsubscribes.push(unsubscribeIncompatibilities);

    // Payment Settings listener
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'payments'), (snapshot) => {
      if (snapshot.exists()) {
        setPaymentSettings(snapshot.data() as PaymentSettings);
      }
      setLoading(false);
    });
    unsubscribes.push(unsubscribeSettings);

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  // Student operations
  const addStudent = async (student: Omit<StudentProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date().toISOString();
      await addDoc(collection(db, 'students'), {
        ...student,
        createdAt: now,
        updatedAt: now,
      });
      toast({
        title: "Success",
        description: "Student added successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateStudent = async (id: string, student: Partial<StudentProfile>) => {
    try {
      await updateDoc(doc(db, 'students', id), {
        ...student,
        updatedAt: new Date().toISOString(),
      });
      toast({
        title: "Success",
        description: "Student updated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      const batch = writeBatch(db);
      
      // Delete student
      batch.delete(doc(db, 'students', id));
      
      // Delete related grades
      const studentGrades = grades.filter(grade => grade.studentId === id);
      studentGrades.forEach(grade => {
        if (grade.id) {
          batch.delete(doc(db, 'grades', grade.id));
        }
      });
      
      // Delete related evaluations
      const studentEvaluations = evaluations.filter(evaluation => 
        evaluation.criteria.some(c => c.name.includes(id)) // This might need adjustment based on your evaluation structure
      );
      studentEvaluations.forEach(evaluation => {
        if (evaluation.id) {
          batch.delete(doc(db, 'evaluations', evaluation.id));
        }
      });
      
      await batch.commit();
      
      toast({
        title: "Success",
        description: "Student and related data deleted successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const enrollStudent = async (studentId: string, enrollment: { semesterId: string; teacher: string; sessionId: string }) => {
    try {
      const studentRef = doc(db, 'students', studentId);
      const studentSnap = await getDoc(studentRef);
      
      if (studentSnap.exists()) {
        const studentData = studentSnap.data() as StudentProfile;
        const updatedEnrollments = [...(studentData.enrolledIn || []), enrollment];
        
        await updateDoc(studentRef, {
          enrolledIn: updatedEnrollments,
          updatedAt: new Date().toISOString(),
        });
        
        toast({
          title: "Success",
          description: "Student enrolled successfully!",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const getStudentsByLevel = useCallback((level: string) => {
    return students.filter(student => student.level === level && student.status !== 'deleted');
  }, [students]);

  const getStudentsByTeacher = useCallback((teacherName: string) => {
    return students.filter(student => 
      student.enrolledIn.some(enrollment => enrollment.teacher === teacherName) && 
      student.status !== 'deleted'
    );
  }, [students]);

  // Applicant operations
  const addApplicant = async (applicant: Omit<Applicant, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date().toISOString();
      await addDoc(collection(db, 'applicants'), {
        ...applicant,
        createdAt: now,
        updatedAt: now,
      });
      toast({
        title: "Success",
        description: "Applicant added successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateApplicant = async (id: string, applicant: Partial<Applicant>) => {
    try {
      await updateDoc(doc(db, 'applicants', id), {
        ...applicant,
        updatedAt: new Date().toISOString(),
      });
      toast({
        title: "Success",
        description: "Applicant updated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteApplicant = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'applicants', id));
      toast({
        title: "Success",
        description: "Applicant deleted successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const scheduleInterview = async (applicantId: string, interviewData: { interviewDate: string; interviewTime: string; interviewer: string }) => {
    try {
      await updateDoc(doc(db, 'applicants', applicantId), {
        ...interviewData,
        status: 'interview-scheduled',
        updatedAt: new Date().toISOString(),
      });
      toast({
        title: "Success",
        description: "Interview scheduled successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Semester operations
  const addSemester = async (semester: Omit<Semester, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date().toISOString();
      await addDoc(collection(db, 'semesters'), {
        ...semester,
        createdAt: now,
        updatedAt: now,
      });
      toast({
        title: "Success",
        description: "Semester added successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateSemester = async (id: string, semester: Partial<Semester>) => {
    try {
      await updateDoc(doc(db, 'semesters', id), {
        ...semester,
        updatedAt: new Date().toISOString(),
      });
      toast({
        title: "Success",
        description: "Semester updated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteSemester = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'semesters', id));
      toast({
        title: "Success",
        description: "Semester deleted successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const setActiveSemester = async (semesterId: string) => {
    try {
      const batch = writeBatch(db);
      
      // Set all semesters to inactive
      semesters.forEach(semester => {
        if (semester.id) {
          batch.update(doc(db, 'semesters', semester.id), { isActive: false });
        }
      });
      
      // Set selected semester to active
      batch.update(doc(db, 'semesters', semesterId), { 
        isActive: true,
        updatedAt: new Date().toISOString(),
      });
      
      await batch.commit();
      
      toast({
        title: "Success",
        description: "Active semester updated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Teacher Request operations
  const addTeacherRequest = async (request: Omit<TeacherRequest, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date().toISOString();
      await addDoc(collection(db, 'teacherRequests'), {
        ...request,
        createdAt: now,
        updatedAt: now,
      });
      toast({
        title: "Success",
        description: "Teacher request submitted successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateTeacherRequest = async (id: string, request: Partial<TeacherRequest>) => {
    try {
      await updateDoc(doc(db, 'teacherRequests', id), {
        ...request,
        updatedAt: new Date().toISOString(),
      });
      toast({
        title: "Success",
        description: "Teacher request updated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteTeacherRequest = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'teacherRequests', id));
      toast({
        title: "Success",
        description: "Teacher request deleted successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Leave operations
  const addLeave = async (leave: Omit<Leave, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date().toISOString();
      await addDoc(collection(db, 'leaves'), {
        ...leave,
        createdAt: now,
        updatedAt: now,
      });
      toast({
        title: "Success",
        description: "Leave request submitted successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateLeave = async (id: string, leave: Partial<Leave>) => {
    try {
      await updateDoc(doc(db, 'leaves', id), {
        ...leave,
        updatedAt: new Date().toISOString(),
      });
      toast({
        title: "Success",
        description: "Leave updated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteLeave = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'leaves', id));
      toast({
        title: "Success",
        description: "Leave deleted successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Grade operations
  const addGrade = async (grade: Omit<Grade, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, 'grades'), {
        ...grade,
        createdAt: new Date().toISOString(),
      });
      toast({
        title: "Success",
        description: "Grade added successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateGrade = async (id: string, grade: Partial<Grade>) => {
    try {
      await updateDoc(doc(db, 'grades', id), grade);
      toast({
        title: "Success",
        description: "Grade updated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteGrade = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'grades', id));
      toast({
        title: "Success",
        description: "Grade deleted successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const getGradesByStudent = useCallback((studentId: string) => {
    return grades.filter(grade => grade.studentId === studentId);
  }, [grades]);

  // Evaluation operations
  const addEvaluation = async (evaluation: Omit<Evaluation, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, 'evaluations'), {
        ...evaluation,
        createdAt: new Date().toISOString(),
      });
      toast({
        title: "Success",
        description: "Evaluation added successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateEvaluation = async (id: string, evaluation: Partial<Evaluation>) => {
    try {
      await updateDoc(doc(db, 'evaluations', id), evaluation);
      toast({
        title: "Success",
        description: "Evaluation updated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteEvaluation = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'evaluations', id));
      toast({
        title: "Success",
        description: "Evaluation deleted successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Incompatibility operations
  const addIncompatibility = async (incompatibility: Omit<Incompatibility, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, 'incompatibilities'), {
        ...incompatibility,
        createdAt: new Date().toISOString(),
      });
      toast({
        title: "Success",
        description: "Incompatibility added successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateIncompatibility = async (id: string, incompatibility: Partial<Incompatibility>) => {
    try {
      await updateDoc(doc(db, 'incompatibilities', id), incompatibility);
      toast({
        title: "Success",
        description: "Incompatibility updated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteIncompatibility = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'incompatibilities', id));
      toast({
        title: "Success",
        description: "Incompatibility deleted successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Payment Settings operations
  const updatePaymentSettings = async (settings: Omit<PaymentSettings, 'updatedAt'>) => {
    try {
      await updateDoc(doc(db, 'settings', 'payments'), {
        ...settings,
        updatedAt: new Date().toISOString(),
      });
      toast({
        title: "Success",
        description: "Payment settings updated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Utility functions
  const refreshData = async () => {
    setLoading(true);
    // Data will be refreshed automatically by the listeners
    setTimeout(() => setLoading(false), 1000);
  };

  const migrateInitialData = async () => {
    try {
      // Import the migration function
      const { migrateDataToFirebase } = await import('@/lib/data');
      await migrateDataToFirebase();
      toast({
        title: "Success",
        description: "Initial data migrated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Migration failed: ${error.message}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  const value: DatabaseContextType = {
    // Students
    students,
    addStudent,
    updateStudent,
    deleteStudent,
    getStudentsByLevel,
    getStudentsByTeacher,
    enrollStudent,
    
    // Applicants
    applicants,
    addApplicant,
    updateApplicant,
    deleteApplicant,
    scheduleInterview,
    
    // Semesters
    semesters,
    activeSemester,
    addSemester,
    updateSemester,
    deleteSemester,
    setActiveSemester,
    
    // Teacher Requests
    teacherRequests,
    addTeacherRequest,
    updateTeacherRequest,
    deleteTeacherRequest,
    
    // Leaves
    leaves,
    addLeave,
    updateLeave,
    deleteLeave,
    
    // Grades
    grades,
    addGrade,
    updateGrade,
    deleteGrade,
    getGradesByStudent,
    
    // Evaluations
    evaluations,
    addEvaluation,
    updateEvaluation,
    deleteEvaluation,
    
    // Incompatibilities
    incompatibilities,
    addIncompatibility,
    updateIncompatibility,
    deleteIncompatibility,
    
    // Settings
    paymentSettings,
    updatePaymentSettings,
    
    // Utility
    loading,
    refreshData,
    migrateInitialData,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}
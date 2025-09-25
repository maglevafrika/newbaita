// src/lib/types.ts
export type Role = "admin" | "teacher" | "upper-management" | "high-level-dashboard";

export interface User {
  id: string;
  username: string;
  name: string;
  roles: Role[];
  activeRole: Role;
}

// Firebase-compatible user profile (stored in Firestore users collection)
export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  name: string; // Keep for backward compatibility
  roles: Role[];
  createdAt: string;
  lastLogin: string;
  updatedAt: string;
}

// Legacy interface for backward compatibility
export interface UserInDb {
  id: string;
  username: string;
  name: string;
  password?: string; // Not stored in Firebase
  roles: Role[];
}

export interface InterviewEvaluation {
    notes: string;
    decision: 'approved' | 'rejected' | 'pending';
    criteria: {
        musicalNote: number;
        playingTechniques: number;
        musicalKnowledge: number;
        tuningLevel: number;
        generalTalent: number;
        psychologicalBalance: number;
    };
    generalScore: number;
}

export interface Applicant {
    id?: string; // Optional for Firestore auto-generated IDs
    name: string;
    gender: 'male' | 'female' | 'other';
    dob: string; // YYYY-MM-DD
    nationality: string;
    contact: {
        phone: string;
        email: string;
    };
    instrumentInterest: string;
    previousExperience: string;
    status: 'pending-review' | 'interview-scheduled' | 'evaluated' | 're-evaluation' | 'approved' | 'rejected' | 'cancelled' | 'archived';
    applicationDate: string; // ISO String
    lastUpdated: string; // ISO String
    interviewDate?: string; // YYYY-MM-DD
    interviewTime?: string; // HH:MM
    interviewer?: string;
    evaluation?: InterviewEvaluation;
    evaluationNotes?: string; // Deprecated
    cancellationReason?: string;
    createdAt: string; // For Firebase
    updatedAt: string; // For Firebase
}

export interface StudentProfile {
  phoneNumber: string;
  id?: string; // Optional for Firestore auto-generated IDs
  idPrefix?: string;
  name: string;
  gender?: 'male' | 'female';
  username?: string;
  dob?: string;
  nationality?: string;
  instrumentInterest?: string;
  enrollmentDate?: string;
  level: string;
  levelHistory?: LevelChange[];
  evaluations?: Evaluation[];
  grades?: Grade[];
  paymentPlan: 'monthly' | 'quarterly' | 'yearly' | 'none';
  installments?: Installment[];
  subscriptionStartDate?: string;
  preferredPayDay?: number;
  dueDateChangeHistory?: DueDateChange[];
  avatar?: string;
  contact?: {
    phone: string;
    email: string;
  };
  enrolledIn: {
    semesterId: string;
    teacher: string;
    sessionId: string;
  }[];
  status?: 'active' | 'inactive' | 'deleted';
  deletionInfo?: {
    date: string;
    reason: string;
  };
  createdAt: string; // For Firebase
  updatedAt: string; // For Firebase
}

export interface LevelChange {
  date: string;
  level: string;
  review: string;
}

export interface Evaluation {
  id?: string;
  date: string;
  evaluator: string;
  criteria: { name: string; score: number }[];
  notes: string;
  createdAt: string;
}

export interface Grade {
  id?: string;
  studentId: string; // Reference to student
  subject: string;
  type: 'test' | 'assignment' | 'quiz';
  title: string;
  score: number;
  maxScore: number;
  date: string;
  attachment?: {
    name: string;
    type: string;
    url: string; // Firebase Storage URL instead of dataUrl
  };
  notes?: string;
  teacherId: string; // Who assigned the grade
  semesterId: string; // Which semester
  createdAt: string;
}

export type PaymentPlanType = 'monthly' | 'quarterly' | 'yearly';
export type PaymentMethod = 'visa' | 'mada' | 'cash' | 'transfer';

export interface PaymentSettings {
  monthly: number;
  quarterly: number;
  yearly: number;
  updatedAt: string;
}

export interface Installment {
  id?: string;
  studentId: string; // Reference to student
  dueDate: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'overdue';
  paymentDate?: string;
  gracePeriodUntil?: string;
  invoiceNumber?: string;
  paymentMethod?: PaymentMethod;
  createdAt: string;
  updatedAt: string;
}

export interface DueDateChange {
  date: string;
  oldDay: number;
  newDay: number;
}

export interface SessionStudent {
    id: string;
    name: string;
    attendance: 'present' | 'absent' | 'late' | 'excused' | null;
    note?: string;
    pendingRemoval?: boolean;
}

export interface Session {
  id: string;
  time: string;
  endTime?: string;
  duration: number;
  students: SessionStudent[];
  specialization: string;
  type: 'practical' | 'theory';
  note?: string;
}

export interface ProcessedSession extends Session {
  day: string;
  startRow: number;
}

export interface WeeklyAttendance {
  [sessionId: string]: {
    [studentId: string]: {
      status: 'present' | 'absent' | 'late' | 'excused';
      note?: string;
    };
  };
}

export interface Incompatibility {
    id?: string;
    type: 'teacher-student' | 'student-student';
    person1Id: string;
    person1Name: string;
    person2Id: string;
    person2Name: string;
    reason: string;
    semesterId: string;
    createdAt: string;
}

export interface Leave {
    id?: string;
    type: 'student' | 'teacher';
    personId: string;
    personName: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: 'pending' | 'approved' | 'denied';
    createdAt: string;
    updatedAt: string;
}

export interface TeacherSchedule {
  [day: string]: Session[];
}

export interface Semester {
  id?: string;
  name: string;
  startDate: string;
  endDate: string;
  teachers: string[];
  masterSchedule: {
    [teacherName: string]: TeacherSchedule;
  };
  weeklyAttendance: {
    [weekStartDate: string]: {
      [teacherName: string]: WeeklyAttendance;
    };
  };
  incompatibilities?: Incompatibility[];
  createdAt: string;
  updatedAt: string;
  isActive?: boolean; // To mark current semester
}

export type TeacherRequestType = 'remove-student' | 'change-time' | 'add-student';

export interface TeacherRequest {
  id?: string;
  type: TeacherRequestType;
  status: 'pending' | 'approved' | 'denied';
  date: string;
  teacherId: string;
  teacherName: string;
  details: {
    studentId: string;
    studentName: string;
    sessionId: string;
    sessionTime: string;
    day: string;
    reason: string;
    semesterId: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Firebase-specific types
export interface FirebaseTimestamp {
  seconds: number;
  nanoseconds: number;
}

// For data migration and seeding
export interface AppData {
  semesters: Semester[];
  students: StudentProfile[];
}
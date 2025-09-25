// src/lib/data.ts
import { 
  UserProfile, 
  Semester, 
  StudentProfile, 
  TeacherRequest, 
  Applicant, 
  Leave, 
  SessionStudent, 
  PaymentSettings 
} from "./types";
import { collection, addDoc, writeBatch, doc, getDocs } from 'firebase/firestore';
import { db } from './firebase';

// Legacy data for migration purposes
export const getLegacyUsers = () => {
    return [
        { id: '1', username: 'admin1', name: 'Admin One', roles: ['admin'], password: 'Rs!2325' },
        { id: '2', username: 'رغد', name: 'Raghad', roles: ['admin'], password: 'Rs!2325' },
        { id: '3', username: 'عبدالرحمن', name: 'Abdulrahman', roles: ['admin'], password: 'Rs!2325' },
        { id: '4', username: 'manar', name: 'Manar', roles: ['admin', 'high-level-dashboard'], password: 'Rs!2325' },
        { id: '5', username: 'MC', name: 'MC', roles: ['upper-management'], password: 'Rs!2325' },
        { id: '6', username: 'نهاد', name: 'Nahad', roles: ['teacher'], password: 'Rs!2325' },
        { id: '7', username: 'حازم', name: 'Hazem', roles: ['teacher'], password: 'Rs!2325' },
        { id: '8', username: 'هاني', name: 'Hani', roles: ['teacher'], password: 'Rs!2325' },
        { id: '9', username: 'نبيل', name: 'Nabil', roles: ['teacher'], password: 'Rs!2325' },
        { id: '10', username: 'باسم', name: 'Basem', roles: ['teacher'], password: 'Rs!2325' },
        { id: '11', username: 'بسام', name: 'Bassam', roles: ['teacher'], password: 'Rs!2325' },
        { id: '12', username: 'ناجي', name: 'Naji', roles: ['teacher'], password: 'Rs!2325' },
        { id: '13', username: 'يعرب', name: 'Yarob', roles: ['teacher'], password: 'Rs!2325' },
        { id: '14', username: 'إسلام', name: 'Islam', roles: ['teacher'], password: 'Rs!2325' },
        { id: '15', username: 'nancy', name: 'Nancy', roles: ['teacher'], password: 'Rs!2325' },
    ];
};

export const getInitialApplicants = (): Applicant[] => {
    const now = new Date().toISOString();
    return [
        {
            name: 'سليمان الأحمد',
            gender: 'male',
            dob: '1995-03-12',
            nationality: 'Saudi Arabian',
            contact: { phone: '0512345678', email: 'sulaiman.a@example.com' },
            instrumentInterest: 'Oud',
            previousExperience: 'Played guitar for 5 years, basic knowledge of music theory.',
            status: 'pending-review',
            applicationDate: '2024-05-10T10:00:00Z',
            lastUpdated: '2024-05-10T10:00:00Z',
            createdAt: now,
            updatedAt: now,
        },
        {
            name: 'لمى الخالدي',
            gender: 'female',
            dob: '2001-11-25',
            nationality: 'Kuwaiti',
            contact: { phone: '0587654321', email: 'lama.k@example.com' },
            instrumentInterest: 'Qanun',
            previousExperience: 'No formal training, but a strong passion for traditional music.',
            status: 'interview-scheduled',
            applicationDate: '2024-05-12T14:30:00Z',
            lastUpdated: '2024-05-15T11:00:00Z',
            interviewDate: '2024-05-28',
            interviewTime: '14:00',
            interviewer: 'Hani',
            createdAt: now,
            updatedAt: now,
        },
        {
            name: 'Tariq Al-Farsi',
            gender: 'male',
            dob: '1988-08-01',
            nationality: 'Omani',
            contact: { phone: '0555555555', email: 'tariq.f@example.com' },
            instrumentInterest: 'Ney',
            previousExperience: 'Advanced flutist, looking to learn a new instrument.',
            status: 'approved',
            applicationDate: '2024-04-20T09:00:00Z',
            lastUpdated: '2024-05-18T16:00:00Z',
            interviewDate: '2024-05-15',
            interviewTime: '11:00',
            interviewer: 'Nahad',
            evaluation: {
                notes: 'Excellent musical ear and a quick learner. Strong potential.',
                decision: 'approved',
                generalScore: 88,
                criteria: {
                  musicalNote: 90,
                  playingTechniques: 80,
                  musicalKnowledge: 85,
                  tuningLevel: 95,
                  generalTalent: 90,
                  psychologicalBalance: 90,
                },
            },
            createdAt: now,
            updatedAt: now,
        },
    ];
};

export const getInitialLeaves = (): Leave[] => {
    const now = new Date().toISOString();
    return [
        {
            type: 'student',
            personId: 'STU001',
            personName: 'أحمد الفلاني',
            startDate: '2024-10-01',
            endDate: '2024-10-07',
            reason: 'Family vacation',
            status: 'approved',
            createdAt: now,
            updatedAt: now,
        },
        {
            type: 'teacher',
            personId: '6',
            personName: 'نهاد',
            startDate: '2024-11-15',
            endDate: '2024-11-22',
            reason: 'Attending a music conference',
            status: 'pending',
            createdAt: now,
            updatedAt: now,
        }
    ];
};

export const getInitialPaymentSettings = (): PaymentSettings => ({
    monthly: 500,
    quarterly: 1500,
    yearly: 5500,
    updatedAt: new Date().toISOString(),
});

/**
 * Recursively removes undefined values from an object
 * Firebase doesn't accept undefined values, so we need to clean the data
 */
function removeUndefinedValues(obj: any): any {
    if (obj === null || obj === undefined) {
        return null;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(removeUndefinedValues).filter(item => item !== undefined);
    }
    
    if (typeof obj === 'object') {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined) {
                cleaned[key] = removeUndefinedValues(value);
            }
        }
        return cleaned;
    }
    
    return obj;
}

// Schedule parsing remains the same
const scheduleData = `
اسم الطالب,رقم الجوال,اليوم,اسم المدرس,الوقت
سهل الرويلي,503817620,السبت,استاذ حازم,2:00-3:00
عبدالعزيز الجويعد,541777034,السبت,استاذ حازم,3:00-4:00
عصام احمد الحجار,508495126,الاحد,استاذ حازم,2:00-3:00
هذلول جميل,563332682,الاحد,استاذ حازم,3:00-4:00
فارس خالد كمال,599612353,الاحد,استاذ حازم,6:00-7:00
ريناد السنوسي,533689233,الاحد,استاذ حازم,7:00-8:00
تهاني احمد,536399101,الاحد,استاذ حازم,8:00-9:00
نايف الشوشان,555686459,الاثنين,استاذ حازم,2:00-3:00
محمد علي سالم,504715076,الاثنين,استاذ حازم,3:00-4:00
محمد صالح,,الاثنين,استاذ حازم,6:00-7:00
ريم علي,547833513,الاثنين,استاذ حازم,7:00-8:00
سعود عبدالعزيز,591000980,الاثنين,استاذ حازم,8:00-9:00
ريان صالح,596115587,الثلاثاء,استاذ حازم,2:00-3:00
تغريد الشهراني,591503888,الثلاثاء,استاذ حازم,3:00-4:00
منصور العتيبي,500006248,الثلاثاء,استاذ حازم,6:00-7:00
احمد هاشم,558067468,الثلاثاء,استاذ حازم,7:00-8:00
عبدالاله الصقير,560000697,الثلاثاء,استاذ حازم,8:00-9:00
عادل منسي,537518888,الاربعاء,استاذ حازم,2:00-3:00
غلا الدوسري,594471555,الاربعاء,استاذ حازم,3:00-4:00
وسام القرني,557055675,الاربعاء,استاذ حازم,6:00-7:00
نواف الشدوخي,560711170,الاربعاء,استاذ حازم,7:00-8:00
سلطان عبدالمجيد,555464604,الاربعاء,استاذ حازم,8:00-9:00
`;

function parseSchedule() {
    const studentMap = new Map<string, StudentProfile>();
    const masterSchedule: Semester['masterSchedule'] = {};
    const allUsers = getLegacyUsers();
    const now = new Date().toISOString();

    const lines = scheduleData.trim().split('\n').slice(1);

    lines.forEach((line, index) => {
        const [studentName, phone, day, teacherRaw, time] = line.split(',');
        if (!studentName || !day || !teacherRaw || !time) return;

        const teacherNameClean = teacherRaw.replace(/"/g, '').replace(/^استاذة?\s*/, '').split(' ')[0];
        const teacher = allUsers.find(u => u.name === teacherNameClean || u.username === teacherNameClean);
        
        if (!teacher) {
            console.warn(`Teacher not found for: ${teacherRaw}`);
            return;
        }
        const teacherKey = teacher.name;

        if (!masterSchedule[teacherKey]) {
            masterSchedule[teacherKey] = {};
        }
        if (!masterSchedule[teacherKey][day]) {
            masterSchedule[teacherKey][day] = [];
        }

        let student = studentMap.get(studentName);
        if (!student) {
            const studentId = `STU${(studentMap.size + 1).toString().padStart(3, '0')}`;
            
            // Fix: Handle undefined contact properly
            let contactInfo = null;
            if (phone && phone.trim() !== '') {
                contactInfo = { 
                    phone: phone.trim(), 
                    email: '' 
                };
            }
            
            student = {
                id: studentId,
                name: studentName,
                level: "Beginner",
                enrollmentDate: new Date().toISOString().split('T')[0],
                enrolledIn: [],
                paymentPlan: 'none',
                // Use conditional spreading to only include contact if it exists
                ...(contactInfo && { contact: contactInfo }),
                createdAt: now,
                updatedAt: now,
            };
            studentMap.set(studentName, student);
        }
        
        const timeParts = time.match(/(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);
        if (!timeParts) return;
        
        const formatTo12Hour = (timeStr: string) => {
            let [hour, minute] = timeStr.split(':').map(Number);
            
            if (hour < 12) {
                hour += 12;
            }
            
            const ampm = 'PM';
            let displayHour = hour > 12 ? hour - 12 : hour;
            if (displayHour === 0) displayHour = 12;
            
            return `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
        };

        const startTime24Str = timeParts[1];
        const endTime24Str = timeParts[2];
        const startTime12 = formatTo12Hour(startTime24Str);
        const endTime12 = formatTo12Hour(endTime24Str);
        
        const [startH, startM] = startTime24Str.split(':').map(Number);
        const [endH, endM] = endTime24Str.split(':').map(Number);

        let startHour24 = startH < 12 ? startH + 12 : startH;
        let endHour24 = endH < 12 ? endH + 12 : endH;

        const duration = (endHour24 * 60 + endM) - (startHour24 * 60 + startM);
        const durationHours = duration / 60;

        const sessionId = `${day}-${teacherKey}-${startTime12.replace(/[\s:]/g, '')}`;

        let session = masterSchedule[teacherKey][day].find(s => s.id === sessionId);
        
        const studentToAdd: SessionStudent = { 
            id: student.id!, 
            name: student.name, 
            attendance: null, 
            pendingRemoval: false 
        };

        if (session) {
            if (!session.students.find(s => s.id === student!.id)) {
                session.students.push(studentToAdd);
            }
        } else {
            session = {
                id: sessionId,
                time: startTime12,
                endTime: endTime12,
                duration: durationHours,
                students: [studentToAdd],
                specialization: "Oud",
                type: 'practical'
            };
            masterSchedule[teacherKey][day].push(session);
        }
        
        if (!student.enrolledIn.some(e => e.sessionId === sessionId)) {
            student.enrolledIn.push({
                semesterId: "fall-2024",
                teacher: teacherKey,
                sessionId: sessionId,
            });
        }
    });

    return { students: Array.from(studentMap.values()), masterSchedule };
}

const parsedData = parseSchedule();

export const getInitialStudents = (): StudentProfile[] => {
    return parsedData.students;
};

export const getInitialRequests = (): TeacherRequest[] => {
    const now = new Date().toISOString();
    return [
        {
            type: 'remove-student',
            status: 'pending',
            date: '2024-05-20',
            teacherId: '7',
            teacherName: 'Hazem',
            details: {
                studentId: 'STU001',
                studentName: 'سهل الرويلي',
                sessionId: 'Saturday-Hazem-2:00PM',
                sessionTime: '2:00 PM',
                day: 'Saturday',
                reason: 'Test request.',
                semesterId: 'fall-2024'
            },
            createdAt: now,
            updatedAt: now,
        },
    ];
};

export const getInitialSemesters = (): Semester[] => {
    const teacherList = [...new Set(Object.keys(parsedData.masterSchedule))];
    const now = new Date().toISOString();
    
    return [
        {
            name: "Fall 2024",
            startDate: "2024-09-01",
            endDate: "2024-12-20",
            teachers: teacherList,
            masterSchedule: parsedData.masterSchedule,
            weeklyAttendance: {},
            incompatibilities: [],
            createdAt: now,
            updatedAt: now,
            isActive: true,
        },
    ];
};

// Updated Firebase migration utilities with data cleaning
export async function migrateDataToFirebase() {
    try {
        console.log('Starting data migration to Firebase...');
        
        const batch = writeBatch(db);
        let batchCount = 0;
        
        // Helper function to handle batch commits
        const commitBatch = async () => {
            if (batchCount > 0) {
                await batch.commit();
                console.log(`Committed batch of ${batchCount} operations`);
                batchCount = 0;
            }
        };

        // Migrate Students
        const students = getInitialStudents();
        console.log(`Migrating ${students.length} students...`);
        
        for (const student of students) {
            const studentRef = doc(collection(db, 'students'));
            // Clean the data before setting it to remove undefined values
            const cleanStudent = removeUndefinedValues(student);
            batch.set(studentRef, cleanStudent);
            batchCount++;
            
            if (batchCount >= 500) { // Firestore batch limit
                await commitBatch();
            }
        }

        // Migrate Applicants
        const applicants = getInitialApplicants();
        console.log(`Migrating ${applicants.length} applicants...`);
        
        for (const applicant of applicants) {
            const applicantRef = doc(collection(db, 'applicants'));
            const cleanApplicant = removeUndefinedValues(applicant);
            batch.set(applicantRef, cleanApplicant);
            batchCount++;
            
            if (batchCount >= 500) {
                await commitBatch();
            }
        }

        // Migrate Semesters
        const semesters = getInitialSemesters();
        console.log(`Migrating ${semesters.length} semesters...`);
        
        for (const semester of semesters) {
            const semesterRef = doc(collection(db, 'semesters'));
            const cleanSemester = removeUndefinedValues(semester);
            batch.set(semesterRef, cleanSemester);
            batchCount++;
            
            if (batchCount >= 500) {
                await commitBatch();
            }
        }

        // Migrate Teacher Requests
        const requests = getInitialRequests();
        console.log(`Migrating ${requests.length} teacher requests...`);
        
        for (const request of requests) {
            const requestRef = doc(collection(db, 'teacherRequests'));
            const cleanRequest = removeUndefinedValues(request);
            batch.set(requestRef, cleanRequest);
            batchCount++;
            
            if (batchCount >= 500) {
                await commitBatch();
            }
        }

        // Migrate Leaves
        const leaves = getInitialLeaves();
        console.log(`Migrating ${leaves.length} leaves...`);
        
        for (const leave of leaves) {
            const leaveRef = doc(collection(db, 'leaves'));
            const cleanLeave = removeUndefinedValues(leave);
            batch.set(leaveRef, cleanLeave);
            batchCount++;
            
            if (batchCount >= 500) {
                await commitBatch();
            }
        }

        // Migrate Payment Settings
        const paymentSettings = getInitialPaymentSettings();
        console.log('Migrating payment settings...');
        
        const settingsRef = doc(collection(db, 'settings'), 'payments');
        const cleanSettings = removeUndefinedValues(paymentSettings);
        batch.set(settingsRef, cleanSettings);
        batchCount++;

        // Commit final batch
        await commitBatch();
        
        console.log('Data migration completed successfully!');
        
    } catch (error) {
        console.error('Error migrating data to Firebase:', error);
        throw error;
    }
}

// Initialize app data (for development/testing)
export async function initializeAppData() {
    try {
        // Check if data already exists
        const studentsSnapshot = await getDocs(collection(db, 'students'));
        
        if (studentsSnapshot.empty) {
            console.log('No existing data found. Starting migration...');
            await migrateDataToFirebase();
        } else {
            console.log('Data already exists in Firebase.');
        }
    } catch (error) {
        console.error('Error initializing app data:', error);
    }
}

// Utility functions for data conversion
export function convertLegacyStudent(legacyStudent: any): StudentProfile {
    const now = new Date().toISOString();
    return {
        ...legacyStudent,
        createdAt: legacyStudent.createdAt || now,
        updatedAt: legacyStudent.updatedAt || now,
    };
}

export function convertLegacyApplicant(legacyApplicant: any): Applicant {
    const now = new Date().toISOString();
    return {
        ...legacyApplicant,
        createdAt: legacyApplicant.createdAt || now,
        updatedAt: legacyApplicant.updatedAt || now,
    };
}

// Export for backward compatibility
export const getInitialUsers = getLegacyUsers;
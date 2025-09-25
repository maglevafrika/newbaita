"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from "next/navigation";
import { Loader2, User, GraduationCap, ClipboardCheck, ArrowLeft, PlusCircle, Star, TrendingUp, BookOpen, Edit, Wallet, ExternalLink, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import type { StudentProfile, Grade, Evaluation } from "@/lib/types";
import { StudentProfileProvider, useStudentProfile } from '@/context/student-profile-context';
import { AddGradeDialog } from '@/components/add-grade-dialog';
import { StudentEvaluationDialog } from '@/components/student-evaluation-dialog';
import { UpdateLevelDialog } from '@/components/update-level-dialog';
import { EditStudentDialog } from '@/components/edit-student-dialog'; // Add this import
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import Link from 'next/link';
import { DeleteStudentDialog } from '@/components/delete-student-dialog';

// Custom Sunflower Icon as an inline SVG component
const SunflowerIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2.5a9.5 9.5 0 0 1 9.5 9.5 9.5 9.5 0 0 1-9.5 9.5A9.5 9.5 0 0 1 2.5 12 9.5 9.5 0 0 1 12 2.5z" fillRule="evenodd" clipRule="evenodd" fill="#FFD700" />
    <path d="M12 5.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z" fillRule="evenodd" clipRule="evenodd" fill="#A0522D" />
    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L6.06 5.354a.5.5 0 0 1-.707.707L4.646 5.354a.5.5 0 0 1 0-.708z" />
    <path d="M17.939 6.061a.5.5 0 0 1 .707-.707l.707.707a.5.5 0 0 1-.707.707l-.707-.707z" />
    <path d="M4.646 19.354a.5.5 0 0 1 0-.708l.707-.707a.5.5 0 1 1-.707.707l-.707.707a.5.5 0 0 1 .707 0z" />
    <path d="M19.354 19.354a.5.5 0 0 1-.708 0l-.707-.707a.5.5 0 0 1 .708-.707l.707.707a.5.5 0 0 1 0 .708z" />
    <path d="M12 2a.5.5 0 0 1 .5.5v1.5a.5.5 0 0 1-1 0V2.5A.5.5 0 0 1 12 2z" />
    <path d="M12 20a.5.5 0 0 1 .5.5v1.5a.5.5 0 0 1-1 0V20.5a.5.5 0 0 1 .5-.5z" />
    <path d="M2 12a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 1 0 1H2.5a.5.5 0 0 1-.5-.5z" />
    <path d="M20 12a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 1 0 1H20.5a.5.5 0 0 1-.5-.5z" />
  </svg>
);


function StudentProfileContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { student, loading } = useStudentProfile();
  
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);
  const [isEvaluationDialogOpen, setIsEvaluationDialogOpen] = useState(false);
  const [isLevelDialogOpen, setIsLevelDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // Add this state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const isManarHLD = user?.username === 'manar' && user?.activeRole === 'high-level-dashboard';

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Student Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The student could not be found.</p>
            <Button onClick={() => router.back()} className="mt-4">
              <ArrowLeft className="mr-2" /> Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("");

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold font-headline">Student Profile</h1>
          <Button variant="outline" onClick={() => router.push('/dashboard/students')}>
              <ArrowLeft className="mr-2" /> Back to Student List
          </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={student.avatar || `https://placehold.co/100x100.png`} data-ai-hint="student avatar" />
                <AvatarFallback className="text-3xl">{getInitials(student.name)}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">{student.name}</CardTitle>
              <CardDescription>ID: {student.id}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="flex justify-between py-2 border-b">
                  <span className="font-medium text-muted-foreground">Level</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{student.level}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsLevelDialogOpen(true)}><Edit className="h-3 w-3" /></Button>
                  </div>
              </div>
              <div className="flex justify-between py-2 border-b">
                  <span className="font-medium text-muted-foreground">Enrolled In</span>
                  <span>{student.enrolledIn?.length || 0} Session(s)</span>
              </div>
              <div className="flex justify-between py-2">
                  <span className="font-medium text-muted-foreground">Enrollment Date</span>
                  <span>{student.enrollmentDate ? format(new Date(student.enrollmentDate), 'PPP') : 'N/A'}</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
                <Button variant="secondary" className="w-full" onClick={() => setIsEditDialogOpen(true)}>
                    <Edit className="mr-2"/> Edit Profile
                </Button>
                <Button variant="destructive" className="w-full" onClick={() => setIsDeleteDialogOpen(true)}>
                    <Trash2 className="mr-2"/> Delete Student
                </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-primary" />
                    Level History
                </CardTitle>
            </CardHeader>
            <CardContent>
                {student.levelHistory && student.levelHistory.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                    {student.levelHistory.map((entry, index) => (
                        <li key={index} className="flex justify-between border-b pb-1">
                        <span>{entry.level}</span>
                        <span className="text-muted-foreground">{format(new Date(entry.date), 'yyyy-MM-dd')}</span>
                        </li>
                    ))}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground">No level history recorded.</p>
                )}
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Wallet className="w-6 h-6 text-primary" />
                    Financials
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 text-sm">
                    <p><strong>Plan:</strong> <span className="capitalize">{student.paymentPlan || 'Not Set'}</span></p>
                    <p><strong>Start Date:</strong> {student.subscriptionStartDate ? format(new Date(student.subscriptionStartDate), 'PPP') : 'N/A'}</p>
                </div>
            </CardContent>
            <CardFooter>
                <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={`/dashboard/payments?studentId=${student.id}`}>
                        Manage Payments <ExternalLink className="ml-2 h-3 w-3" />
                    </Link>
                </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {isManarHLD ? <SunflowerIcon className="w-6 h-6 text-yellow-500" /> : <User className="w-6 h-6 text-primary" />}
                    Personal Information
                </CardTitle>
            </CardHeader>
            <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1"><p className="text-muted-foreground">Gender</p><p>{student.gender || 'Not specified'}</p></div>
                <div className="space-y-1"><p className="text-muted-foreground">Date of Birth</p><p>{student.dob ? format(new Date(student.dob), 'PPP') : 'Not specified'}</p></div>
                <div className="space-y-1"><p className="text-muted-foreground">Nationality</p><p>{student.nationality || 'Not specified'}</p></div>
                <div className="space-y-1"><p className="text-muted-foreground">Instrument</p><p>{student.instrumentInterest || 'Not specified'}</p></div>
                <div className="space-y-1"><p className="text-muted-foreground">Instrument</p><p>{student.instrumentInterest || 'Not specified'}</p></div>
                {student.contact?.phone && (
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Phone Number</p>
                    <p>{student.contact.phone}</p>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                    {isManarHLD ? <SunflowerIcon className="w-6 h-6 text-yellow-500" /> : <BookOpen className="w-6 h-6 text-primary" />}
                    Grades
                </CardTitle>
                <CardDescription>Assignments, quizzes, and test scores.</CardDescription>
              </div>
              <Button onClick={() => setIsGradeDialogOpen(true)}><PlusCircle /> Add Grade</Button>
            </CardHeader>
            <CardContent>
              {student.grades && student.grades.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {student.grades.map(grade => (
                            <TableRow key={grade.id}>
                                <TableCell>{grade.title}</TableCell>
                                <TableCell><Badge variant="secondary" className="capitalize">{grade.type}</Badge></TableCell>
                                <TableCell>{grade.score}/{grade.maxScore}</TableCell>
                                <TableCell>{format(new Date(grade.date), 'yyyy-MM-dd')}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm">No grades recorded for this student.</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                    {isManarHLD ? <SunflowerIcon className="w-6 h-6 text-yellow-500" /> : <ClipboardCheck className="w-6 h-6 text-primary" />}
                    Evaluations
                </CardTitle>
                <CardDescription>Periodic performance evaluations from teachers.</CardDescription>
              </div>
              <Button onClick={() => setIsEvaluationDialogOpen(true)}><PlusCircle /> Add Evaluation</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {student.evaluations && student.evaluations.length > 0 ? (
                student.evaluations.map(evalItem => (
                    <div key={evalItem.id} className="border p-4 rounded-md">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold">Evaluation by {evalItem.evaluator}</h4>
                            <p className="text-sm text-muted-foreground">{format(new Date(evalItem.date), 'PPP')}</p>
                        </div>
                        <p className="text-sm italic text-muted-foreground mb-3">"{evalItem.notes}"</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {evalItem.criteria.map(crit => (
                                <div key={crit.name} className="flex items-center gap-2 text-sm">
                                    <Star className="w-4 h-4 text-amber-500" />
                                    <span>{crit.name}: <strong>{crit.score}/10</strong></span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">A list of evaluations will be displayed here.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <AddGradeDialog 
        isOpen={isGradeDialogOpen} 
        onOpenChange={setIsGradeDialogOpen} 
      />
      <StudentEvaluationDialog
        isOpen={isEvaluationDialogOpen}
        onOpenChange={setIsEvaluationDialogOpen}
      />
      <UpdateLevelDialog 
        isOpen={isLevelDialogOpen}
        onOpenChange={setIsLevelDialogOpen}
        currentLevel={student.level}
      />
      <EditStudentDialog
        student={student}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={() => {
          // Optionally refresh the student data here
          // You might want to call a refresh function from your context
        }}
      />
      {student && (
        <DeleteStudentDialog 
            student={student}
            isOpen={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onSuccess={() => router.push('/dashboard/students')}
        />
      )}
    </div>
  );
}


export default function StudentProfilePage() {
  const { id } = useParams();
  
  if (typeof id !== 'string') {
      // Handle cases where ID is not a string, maybe show an error or redirect.
      // For now, returning a loader is a safe fallback.
      return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <StudentProfileProvider studentId={id}>
      <StudentProfileContent />
    </StudentProfileProvider>
  )
}
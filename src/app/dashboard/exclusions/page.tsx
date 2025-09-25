"use client";

import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Trash2, Loader2, CircleSlash, Users, User, ArrowRight } from "lucide-react";
import { useDatabase } from '@/context/database-context';
import { useAuth } from '@/context/auth-context';
import { Semester, Incompatibility, StudentProfile, UserInDb } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

// Add Exclusion Dialog Component
function AddExclusionDialog({ semester, onExclusionAdded }: { semester: Semester, onExclusionAdded: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { addIncompatibility, students } = useDatabase();
  const { users } = useAuth();
  const { t } = useTranslation();
  
  const teachers = users.filter(u => u.roles.includes('teacher'));

  // Define schema with translated error messages
  const exclusionSchema = z.object({
    type: z.enum(['teacher-student', 'student-student'], { required_error: t('exclusionsPage.selectRuleType') }),
    person1Id: z.string().min(1, t('exclusionsPage.selectFirstPerson')),
    person2Id: z.string().min(1, t('exclusionsPage.selectSecondPerson')),
    reason: z.string().min(10, t('exclusionsPage.reasonMinLength')),
  }).refine(data => data.person1Id !== data.person2Id, {
      message: t('exclusionsPage.cannotSelectSamePerson'),
      path: ["person2Id"],
  });

  type ExclusionFormValues = z.infer<typeof exclusionSchema>;

  const form = useForm<ExclusionFormValues>({
    resolver: zodResolver(exclusionSchema),
  });
  
  const ruleType = form.watch('type');
  const person1Id = form.watch('person1Id');

  const getPersonName = (id: string) => {
    const student = students.find(s => s.id === id);
    if(student) return student.name;
    const teacher = teachers.find(t => t.id === id);
    if(teacher) return teacher.name;
    return t('common.unknown');
  }

  const onSubmit = async (data: ExclusionFormValues) => {
    if (!semester.id) {
      toast({
        title: t('common.error'),
        description: t('exclusionsPage.semesterIdMissing'),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const newIncompatibility: Omit<Incompatibility, 'id' | 'createdAt'> = {
        type: data.type,
        person1Id: data.person1Id,
        person1Name: getPersonName(data.person1Id),
        person2Id: data.person2Id,
        person2Name: getPersonName(data.person2Id),
        reason: data.reason,
        semesterId: semester.id,
      };

      await addIncompatibility(newIncompatibility);
      
      toast({ 
        title: t('exclusionsPage.ruleAdded'), 
        description: t('exclusionsPage.ruleAddedDescription') 
      });
      onExclusionAdded();
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error adding incompatibility:', error);
      toast({
        title: t('common.error'),
        description: t('exclusionsPage.addRuleError'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const person1Options = ruleType === 'teacher-student' ? teachers : students.filter(s => s.status !== 'deleted');
  const person2Options = students.filter(s => s.status !== 'deleted');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2" /> {t('exclusionsPage.addNew')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('exclusionsPage.addNewTitle')}</DialogTitle>
          <DialogDescription>
            {t('exclusionsPage.addNewDescription')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('exclusionsPage.ruleType')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('exclusionsPage.selectRuleType')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="teacher-student">{t('exclusionsPage.teacherStudent')}</SelectItem>
                        <SelectItem value="student-student">{t('exclusionsPage.studentStudent')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
            )} />
            
            {ruleType && (
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="person1Id" render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {ruleType === 'teacher-student' ? t('requests.labels.teacher') : t('exclusionsPage.student1')}
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('exclusionsPage.select')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <ScrollArea className="h-48">
                                {person1Options.map(p => (
                                  <SelectItem key={p.id} value={p.id!}>{p.name}</SelectItem>
                                ))}
                              </ScrollArea>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="person2Id" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('exclusionsPage.student2')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('exclusionsPage.select')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <ScrollArea className="h-48">
                                {person2Options.filter(s => s.id !== person1Id).map(p => (
                                  <SelectItem key={p.id} value={p.id!}>{p.name}</SelectItem>
                                ))}
                              </ScrollArea>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                    )} />
                </div>
            )}
            
            <FormField control={form.control} name="reason" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('exclusionsPage.reason')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t('exclusionsPage.reasonPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
            )} />

            <DialogFooter>
              <Button type="submit" disabled={isLoading || !ruleType}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('exclusionsPage.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Main Page Component
export default function ExclusionsPage() {
  const { semesters, incompatibilities, loading: dbLoading, deleteIncompatibility } = useDatabase();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
  
  const selectedSemester = useMemo(() => {
    return semesters.find(s => s.id === selectedSemesterId);
  }, [semesters, selectedSemesterId]);

  // Get incompatibilities for the selected semester
  const selectedSemesterIncompatibilities = useMemo(() => {
    if (!selectedSemesterId) return [];
    return incompatibilities.filter(inc => inc.semesterId === selectedSemesterId);
  }, [incompatibilities, selectedSemesterId]);

  useEffect(() => {
    if (!selectedSemesterId && semesters.length > 0) {
      setSelectedSemesterId(semesters[0].id || null);
    }
  }, [semesters, selectedSemesterId]);

  const handleDeleteExclusion = async (exclusionId: string) => {
    try {
      await deleteIncompatibility(exclusionId);
      toast({ 
        title: t('exclusionsPage.ruleRemoved'), 
        description: t('exclusionsPage.ruleRemovedDescription') 
      });
    } catch (error) {
      console.error('Error deleting incompatibility:', error);
      toast({
        title: t('common.error'),
        description: t('exclusionsPage.deleteRuleError'),
        variant: "destructive",
      });
    }
  };

  const onExclusionAdded = () => {
    // The real-time listener will automatically update the incompatibilities
  };
  
  const getIcon = (type: Incompatibility['type']) => {
    return type === 'teacher-student' ? <User className="h-4 w-4 text-muted-foreground" /> : <Users className="h-4 w-4 text-muted-foreground" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <CircleSlash className="w-8 h-8" />
          {t('exclusionsPage.title')}
        </h1>
        {selectedSemester && <AddExclusionDialog semester={selectedSemester} onExclusionAdded={onExclusionAdded}/>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('exclusionsPage.manageExclusions')}</CardTitle>
          <CardDescription>{t('exclusionsPage.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {dbLoading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Select value={selectedSemesterId ?? ""} onValueChange={setSelectedSemesterId}>
              <SelectTrigger className="w-full md:w-1/3">
                <SelectValue placeholder={t('dashboard.selectSemester')} />
              </SelectTrigger>
              <SelectContent>
                {semesters.map(s => <SelectItem key={s.id} value={s.id!}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>
      
      {selectedSemester && (
        <Card>
          <CardHeader>
            <CardTitle>{t('exclusionsPage.exclusionListFor')} {selectedSemester.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedSemesterIncompatibilities && selectedSemesterIncompatibilities.length > 0 ? (
                <ul className="space-y-3">
                    {selectedSemesterIncompatibilities.map(ex => (
                        <li key={ex.id} className="flex justify-between items-center p-3 border rounded-md bg-muted/50">
                           <div className="flex-grow">
                             <div className="flex items-center gap-4 mb-2">
                                {getIcon(ex.type)}
                                <span className="font-semibold">{ex.person1Name}</span>
                                <ArrowRight className="h-4 w-4 text-destructive" />
                                <span className="font-semibold">{ex.person2Name}</span>
                             </div>
                             <p className="text-sm text-muted-foreground pl-8">{ex.reason}</p>
                           </div>
                           <Button variant="destructive" size="icon" onClick={() => handleDeleteExclusion(ex.id!)}>
                               <Trash2 className="h-4 w-4" />
                           </Button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-muted-foreground py-8">{t('exclusionsPage.noRules')}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
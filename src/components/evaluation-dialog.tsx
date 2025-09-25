
"use client";

import { useEffect, useState } from 'react';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useApplicants } from "@/context/applicants-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Slider } from './ui/slider';
import type { Applicant } from '@/lib/types';
import { Separator } from './ui/separator';

const evaluationSchema = z.object({
  notes: z.string().optional(),
  criteria: z.object({
    musicalNote: z.number().min(0).max(100),
    playingTechniques: z.number().min(0).max(100),
    musicalKnowledge: z.number().min(0).max(100),
    tuningLevel: z.number().min(0).max(100),
    generalTalent: z.number().min(0).max(100),
    psychologicalBalance: z.number().min(0).max(100),
  }),
});

type EvaluationFormValues = z.infer<typeof evaluationSchema>;

interface EvaluationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  applicant?: Applicant | null;
}

const defaultValues = {
    notes: '',
    criteria: {
        musicalNote: 50,
        playingTechniques: 50,
        musicalKnowledge: 50,
        tuningLevel: 50,
        generalTalent: 50,
        psychologicalBalance: 50,
    }
};

export function EvaluationDialog({ isOpen, onOpenChange, applicant }: EvaluationDialogProps) {
  const { evaluateApplication } = useApplicants();
  const [isLoading, setIsLoading] = useState<false | 'accept' | 'enroll' | 'reject'>(false);
  const [generalScore, setGeneralScore] = useState(50);

  const form = useForm<EvaluationFormValues>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: defaultValues,
  });

  useEffect(() => {
    if (isOpen) {
        if (applicant?.evaluation) {
            form.reset({
                notes: applicant.evaluation.notes,
                criteria: applicant.evaluation.criteria
            });
        } else {
            form.reset(defaultValues);
        }
    }
  }, [isOpen, applicant, form]);

  const criteria = form.watch('criteria');

  useEffect(() => {
    const scores = Object.values(criteria);
    const total = scores.reduce((sum, score) => sum + score, 0);
    const average = Math.round(total / scores.length);
    setGeneralScore(average);
  }, [criteria]);
  
  const handleAction = async (action: 'accept' | 'enroll' | 'reject') => {
      setIsLoading(action);
      if (!applicant) return;

      const values = form.getValues();
      const evaluationData = {
          ...values,
          decision: action === 'reject' ? 'rejected' : 'approved',
          generalScore,
      }
      
      const success = await evaluateApplication(applicant.id, evaluationData, action === 'enroll');
      
      setIsLoading(false);
      if (success) {
        onOpenChange(false);
      }
  }

  const renderSlider = (name: keyof EvaluationFormValues['criteria'], label: string) => (
    <FormField
        control={form.control}
        name={`criteria.${name}`}
        render={({ field }) => (
            <div className="grid grid-cols-5 items-center gap-4">
                <FormLabel className="col-span-1">{label}</FormLabel>
                <FormControl className="col-span-3">
                     <Slider
                        defaultValue={[field.value]}
                        max={100}
                        step={1}
                        onValueChange={(value) => field.onChange(value[0])}
                        value={[field.value]}
                     />
                </FormControl>
                <span className="col-span-1 text-lg font-bold">{field.value}%</span>
            </div>
        )}
    />
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Evaluate Applicant: {applicant?.name}</DialogTitle>
          <DialogDescription>
            Use the sliders to grade the applicant on various criteria.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-6">
            <div className="space-y-4">
                {renderSlider('musicalNote', 'Musical Note')}
                {renderSlider('playingTechniques', 'Playing Techniques')}
                {renderSlider('musicalKnowledge', 'Musical Knowledge')}
                {renderSlider('tuningLevel', 'Tuning Level')}
                {renderSlider('generalTalent', 'General Talent')}
                {renderSlider('psychologicalBalance', 'Psychological Balance')}
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-5 items-center gap-4">
                <h3 className="col-span-1 text-lg font-semibold">General</h3>
                <div className="col-span-3"></div>
                <span className="col-span-1 text-xl font-bold text-primary">{generalScore}%</span>
            </div>

            <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl><Textarea rows={4} placeholder="Provide a summary of the interview and justification for the decision..." {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            
            <DialogFooter className="gap-2">
              <Button type="button" variant="destructive" onClick={() => handleAction('reject')} disabled={!!isLoading}>
                {isLoading === 'reject' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reject
              </Button>
              <Button type="button" onClick={() => handleAction('accept')} disabled={!!isLoading}>
                {isLoading === 'accept' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Accept
              </Button>
              <Button type="button" onClick={() => handleAction('enroll')} disabled={!!isLoading}>
                 {isLoading === 'enroll' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Accept & Enroll
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

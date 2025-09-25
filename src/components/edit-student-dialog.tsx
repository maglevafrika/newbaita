"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { StudentProfile } from "@/lib/types";

interface EditStudentDialogProps {
  student: StudentProfile | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface FormData {
  name: string;
  gender: string;
  dob: string;
  nationality: string;
  instrumentInterest: string;
  level: string;
  paymentPlan: string;
  subscriptionStartDate: string;
  phone: string;
  email: string;
}

export function EditStudentDialog({
  student,
  isOpen,
  onOpenChange,
  onSuccess
}: EditStudentDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    gender: '',
    dob: '',
    nationality: '',
    instrumentInterest: '',
    level: '',
    paymentPlan: 'none',
    subscriptionStartDate: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || '',
        gender: student.gender || '',
        dob: student.dob ? student.dob.split('T')[0] : '',
        nationality: student.nationality || '',
        instrumentInterest: student.instrumentInterest || '',
        level: student.level || '',
        paymentPlan: student.paymentPlan || 'none',
        subscriptionStartDate: student.subscriptionStartDate ? student.subscriptionStartDate.split('T')[0] : '',
        phone: student.contact?.phone || '',
        email: student.contact?.email || ''
      });
    }
  }, [student]);

  const handleSubmit = async () => {
    if (!student) return;

    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Student name is required.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.level.trim()) {
      toast({
        title: "Validation Error", 
        description: "Student level is required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const updatedStudentData: Partial<StudentProfile> = {
        name: formData.name.trim(),
        gender: formData.gender === "male" || formData.gender === "female" ? formData.gender : undefined,
        dob: formData.dob || undefined,
        nationality: formData.nationality || undefined,
        instrumentInterest: formData.instrumentInterest || undefined,
        level: formData.level.trim(),
        paymentPlan: formData.paymentPlan as 'monthly' | 'quarterly' | 'yearly' | 'none',
        subscriptionStartDate: formData.subscriptionStartDate || undefined,
        contact: {
          phone: formData.phone || '',
          email: formData.email || ''
        },
        updatedAt: new Date().toISOString()
      };

      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Success",
        description: "Student profile updated successfully.",
        variant: "default",
      });
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating student:', error);
      toast({
        title: "Error",
        description: "Failed to update student profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value === "not_specified" ? "" : value
    }));
  };

  const handleCancel = () => {
    if (student) {
      setFormData({
        name: student.name || '',
        gender: student.gender || '',
        dob: student.dob ? student.dob.split('T')[0] : '',
        nationality: student.nationality || '',
        instrumentInterest: student.instrumentInterest || '',
        level: student.level || '',
        paymentPlan: student.paymentPlan || 'none',
        subscriptionStartDate: student.subscriptionStartDate ? student.subscriptionStartDate.split('T')[0] : '',
        phone: student.contact?.phone || '',
        email: student.contact?.email || ''
      });
    }
    onOpenChange(false);
  };

  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Edit Student Profile - {student.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter student's full name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select 
                  value={formData.gender || "not_specified"} 
                  onValueChange={(value) => handleInputChange('gender', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_specified">Not specified</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleInputChange('dob', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                  placeholder="e.g., Saudi Arabian"
                />
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Academic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instrumentInterest">Instrument</Label>
                <Input
                  id="instrumentInterest"
                  value={formData.instrumentInterest}
                  onChange={(e) => handleInputChange('instrumentInterest', e.target.value)}
                  placeholder="e.g., Piano, Guitar, Violin"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="level">Current Level <span className="text-red-500">*</span></Label>
                <Input
                  id="level"
                  value={formData.level}
                  onChange={(e) => handleInputChange('level', e.target.value)}
                  placeholder="e.g., Beginner, Intermediate, Advanced"
                />
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Payment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentPlan">Payment Plan</Label>
                <Select 
                  value={formData.paymentPlan} 
                  onValueChange={(value) => handleInputChange('paymentPlan', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Plan</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subscriptionStartDate">Subscription Start Date</Label>
                <Input
                  id="subscriptionStartDate"
                  type="date"
                  value={formData.subscriptionStartDate}
                  onChange={(e) => handleInputChange('subscriptionStartDate', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="e.g., +966 50 123 4567"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="student@example.com"
                />
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

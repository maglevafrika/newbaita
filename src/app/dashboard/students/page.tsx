"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, ExternalLink, Loader2, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { StudentProfile } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AddStudentForm } from "@/components/add-student-form";
import { useDatabase } from "@/context/database-context";
import { DeleteStudentDialog } from "@/components/delete-student-dialog";
import { ImportStudentsDialog } from "@/components/import-students-dialog";
import { useTranslation } from "react-i18next"; // ✅ Added

export default function StudentsPage() {
  const { t } = useTranslation(); // ✅ Added
  const { students, loading } = useDatabase();
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [isAddStudentOpen, setAddStudentOpen] = useState(false);
  const [isImportStudentOpen, setIsImportStudentOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<StudentProfile | null>(null);

  const filteredStudents = useMemo(() => {
    let filtered = students.filter(s => s.status !== 'deleted');

    if (searchTerm) {
      filtered = filtered.filter((student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (levelFilter !== "all") {
      filtered = filtered.filter((student) => student.level === levelFilter);
    }

    return filtered;
  }, [students, searchTerm, levelFilter]);

  const uniqueLevels = useMemo(() => {
    const levels = new Set(students.map(s => s.level));
    return Array.from(levels);
  }, [students]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <Users className="w-8 h-8" />
          {t("nav.students")}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportStudentOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> {t("actions.importStudents")}
          </Button>
          <Dialog open={isAddStudentOpen} onOpenChange={setAddStudentOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> {t("actions.addNewStudent")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("studentsPage.addStudentTitle")}</DialogTitle>
                <DialogDescription>
                  {t("studentsPage.addStudentDescription")}
                </DialogDescription>
              </DialogHeader>
              <AddStudentForm onSuccess={() => setAddStudentOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("studentsPage.allStudentsTitle")}</CardTitle>
          <div className="pt-4 flex flex-col md:flex-row gap-4">
            <Input
              placeholder={t("studentsPage.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t("studentsPage.filterByLevel")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("studentsPage.allLevels")}</SelectItem>
                {uniqueLevels.map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("studentsPage.name")}</TableHead>
                    <TableHead>{t("studentsPage.level")}</TableHead>
                    <TableHead>{t("studentsPage.enrolledIn")}</TableHead>
                    <TableHead className="text-right">{t("studentsPage.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student: StudentProfile) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.level}</TableCell>
                        <TableCell>
                          {t("studentsPage.sessions", { count: student.enrolledIn.length })}
                        </TableCell>
                        <TableCell className="text-right flex items-center justify-end gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/dashboard/students/${student.id}`}>
                              {t("studentsPage.viewProfile")} <ExternalLink className="ml-2 h-3 w-3" />
                            </Link>
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setStudentToDelete(student)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        {t("studentsPage.noStudentsFound")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {studentToDelete && (
        <DeleteStudentDialog
          student={studentToDelete}
          isOpen={!!studentToDelete}
          onOpenChange={() => setStudentToDelete(null)}
        />
      )}

      <ImportStudentsDialog isOpen={isImportStudentOpen} onOpenChange={setIsImportStudentOpen} />
    </div>
  );
}

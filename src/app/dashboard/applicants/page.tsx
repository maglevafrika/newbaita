"use client";

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, UserCheck, ChevronDown, Upload, CalendarPlus, XCircle, CheckCircle } from 'lucide-react';
import { useApplicants, ApplicantsProvider } from '@/context/applicants-context';
import type { Applicant } from '@/lib/types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ApplicantDialog } from '@/components/applicant-dialog';
import { ScheduleInterviewDialog } from '@/components/schedule-interview-dialog';
import { EvaluationDialog } from '@/components/evaluation-dialog';
import { ImportApplicantsDialog } from '@/components/import-applicants-dialog';


// --- Dialog Components (Placeholders for now, will be implemented) ---
const CancelApplicationDialog = ({ isOpen, onOpenChange, applicant }: { isOpen: boolean, onOpenChange: (open: boolean) => void, applicant: Applicant | null }) => <div>Cancel Dialog</div>;


// --- Main Page Component ---

function ApplicantsPageContent() {
  const { t } = useTranslation();
  const { applicants, loading } = useApplicants();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  // Dialog States
  const [isApplicantDialogOpen, setIsApplicantDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isEvaluationDialogOpen, setIsEvaluationDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  
  const handleAddNew = () => {
    setSelectedApplicant(null);
    setIsApplicantDialogOpen(true);
  };

  const handleEdit = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setIsApplicantDialogOpen(true);
  };

  const handleEvaluate = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setIsEvaluationDialogOpen(true);
  };

  const handleCancel = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setIsCancelDialogOpen(true);
  };

  const statusVariant = (status: Applicant['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected':
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  }

  const columns: ColumnDef<Applicant>[] = [
    // Select Checkbox Column
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(value) => table.toggleAllPageRowsSelected(!!value.target.checked)}
          aria-label={t('applicants.selectAll')}
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(value) => row.toggleSelected(!!value.target.checked)}
          aria-label={t('applicants.selectRow')}
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    // Main Columns
    { accessorKey: "name", header: t('applicants.name') },
    { accessorKey: "instrumentInterest", header: t('applicants.instrument') },
    { 
      accessorKey: "status", 
      header: t('applicants.status'),
      cell: ({ row }) => {
        const status = row.original.status;
        return <Badge variant={statusVariant(status)} className="capitalize">{t(`applicants.statusTypes.${status.replace(/-/g, '_')}`)}</Badge>
      }
    },
    { 
      accessorKey: "applicationDate", 
      header: t('applicants.appliedOn'),
      cell: ({ row }) => format(new Date(row.original.applicationDate), "PPP")
    },
    {
      id: "interview",
      header: t('applicants.interview'),
      cell: ({ row }) => {
        const { interviewDate, interviewTime, interviewer } = row.original;
        if (!interviewDate) return <span className="text-muted-foreground">{t('applicants.notScheduled')}</span>;
        return (
          <div>
            <p>{format(new Date(interviewDate), "PPP")} {t('applicants.at')} {interviewTime}</p>
            <p className="text-sm text-muted-foreground">{t('applicants.with')} {interviewer}</p>
          </div>
        )
      }
    },
    // Actions Column
    {
      id: "actions",
      cell: ({ row }) => {
        const applicant = row.original;
        const canBeScheduled = ['pending-review', 'evaluated'].includes(applicant.status);
        const canBeEvaluated = ['interview-scheduled', 're-evaluation'].includes(applicant.status);

        return (
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{t('applicants.openMenu')}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem onClick={() => handleEdit(applicant)}>{t('applicants.actions.editApplicant')}</DropdownMenuCheckboxItem>
              {canBeScheduled && <DropdownMenuCheckboxItem onClick={() => setIsScheduleDialogOpen(true)}>{t('applicants.actions.scheduleInterview')}</DropdownMenuCheckboxItem>}
              {canBeEvaluated && <DropdownMenuCheckboxItem onClick={() => handleEvaluate(applicant)}>{t('applicants.actions.evaluate')}</DropdownMenuCheckboxItem>}
              <DropdownMenuCheckboxItem onClick={() => handleCancel(applicant)} className="text-destructive focus:text-destructive">{t('applicants.actions.cancelApplication')}</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: applicants,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });
  
  const selectedApplicants = useMemo(() => {
    return table.getFilteredSelectedRowModel().rows.map(row => row.original);
  }, [rowSelection, table]);


  if (loading) {
    return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
     <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <UserCheck className="w-8 h-8" />
          {t('applicants.title')}
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="mr-2"/> {t('actions.import')}
          </Button>
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2" /> {t('applicants.addNew')}
          </Button>
        </div>
      </div>
      
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Input
          placeholder={t('applicants.filterByName')}
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          {selectedApplicants.length > 0 && (
            <Button variant="outline" onClick={() => setIsScheduleDialogOpen(true)}>
              <CalendarPlus className="mr-2" />
              {t('applicants.scheduleInterviewCount', { count: selectedApplicants.length })}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                {t('applicants.columns')} <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table.getAllColumns().filter((column) => column.getCanHide()).map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {t(`applicants.${column.id}`) || column.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t('applicants.noResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

       {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {t('applicants.rowsSelected', {
            selected: table.getFilteredSelectedRowModel().rows.length,
            total: table.getFilteredRowModel().rows.length
          })}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {t('applicants.previous')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {t('applicants.next')}
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <ApplicantDialog isOpen={isApplicantDialogOpen} onOpenChange={setIsApplicantDialogOpen} applicant={selectedApplicant} />
      <ImportApplicantsDialog isOpen={isImportDialogOpen} onOpenChange={setIsImportDialogOpen} />
      <ScheduleInterviewDialog isOpen={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen} selectedApplicants={selectedApplicants} />
      <EvaluationDialog isOpen={isEvaluationDialogOpen} onOpenChange={setIsEvaluationDialogOpen} applicant={selectedApplicant} />
      <CancelApplicationDialog isOpen={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen} applicant={selectedApplicant} />
    </div>
  )
}


export default function ApplicantsPage() {
  return (
    <ApplicantsProvider>
      <ApplicantsPageContent />
    </ApplicantsProvider>
  )
}

"use client";

import { useState, useEffect, useMemo } from 'react';
import type { StudentProfile, Installment, PaymentPlanType, PaymentMethod, PaymentSettings } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as TableFooterComponent } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Wallet, FileText, CalendarClock, FileDown, Calendar as CalendarIcon, Edit, Printer, FileClock, Settings } from "lucide-react";
import { format, isPast, isToday, addMonths, addQuarters, addYears, setDate, startOfDay } from 'date-fns';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { AppLogo } from '@/components/app-logo';
import { useDatabase } from '@/context/database-context';
import { Input } from '@/components/ui/input';


// --- Dialog Components ---

// 1. AssignPlanDialog
const assignPlanSchema = z.object({
  plan: z.enum(['monthly', 'quarterly', 'yearly']),
  startDate: z.date({ required_error: "A start date is required." }),
});

function AssignPlanDialog({ student, onPlanAssigned }: { student: StudentProfile, onPlanAssigned: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();
    const { updateStudent, paymentSettings } = useDatabase();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof assignPlanSchema>>({
        resolver: zodResolver(assignPlanSchema),
        defaultValues: {
            plan: student.paymentPlan || undefined,
            startDate: student.subscriptionStartDate ? new Date(student.subscriptionStartDate) : new Date(),
        }
    });

    const assignPaymentPlan = async (values: z.infer<typeof assignPlanSchema>) => {
        setIsLoading(true);
        const { plan, startDate } = values;
        const installments: Installment[] = [];
        const planDetails = {
            monthly: { count: 12, addPeriod: addMonths, amount: paymentSettings.monthly },
            quarterly: { count: 4, addPeriod: addQuarters, amount: paymentSettings.quarterly },
            yearly: { count: 1, addPeriod: addYears, amount: paymentSettings.yearly },
        };
        const { count, addPeriod, amount } = planDetails[plan as PaymentPlanType];

        for (let i = 0; i < count; i++) {
            installments.push({
                id: `${student.id}-inst-${i}`,
                dueDate: format(addPeriod(startDate, i), 'yyyy-MM-dd'),
                amount,
                status: 'unpaid',
            });
        }
        
        const success = await updateStudent(student.id, {
            paymentPlan: plan as PaymentPlanType,
            subscriptionStartDate: format(startDate, 'yyyy-MM-dd'),
            installments: installments
        });

        setIsLoading(false);
        if(success) {
            toast({ title: "Success", description: `Payment plan assigned to ${student.name}.` });
            onPlanAssigned();
            setIsOpen(false);
            form.reset();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button><Edit className="mr-2" /> Assign / Change Plan</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Assign Payment Plan to {student.name}</DialogTitle>
                    <DialogDescription>Select a plan and start date. This will generate installments for one year.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(assignPaymentPlan)} className="space-y-4">
                        <FormField control={form.control} name="plan" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Payment Plan</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select a plan" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="monthly">Monthly (SAR {paymentSettings.monthly})</SelectItem>
                                        <SelectItem value="quarterly">Quarterly (SAR {paymentSettings.quarterly})</SelectItem>
                                        <SelectItem value="yearly">Yearly (SAR {paymentSettings.yearly})</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="startDate" render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Subscription Start Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <CalendarComponent mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <DialogFooter>
                            <Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Plan</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// 2. MarkAsPaidDialog
const markAsPaidSchema = z.object({
  paymentMethod: z.enum(['visa', 'mada', 'cash', 'transfer'], { required_error: "Payment method is required." }),
});

function MarkAsPaidDialog({ student, installment, onUpdate }: { student: StudentProfile, installment: Installment, onUpdate: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();
    const { updateStudent } = useDatabase();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof markAsPaidSchema>>({
        resolver: zodResolver(markAsPaidSchema),
    });

    const handleMarkAsPaid = async (values: z.infer<typeof markAsPaidSchema>) => {
        setIsLoading(true);
        
        const updatedInstallments = (student.installments || []).map(inst => {
            if (inst.id === installment.id) {
                return {
                    ...inst,
                    status: 'paid' as const,
                    paymentDate: format(new Date(), 'yyyy-MM-dd'),
                    paymentMethod: values.paymentMethod as PaymentMethod,
                    invoiceNumber: `INV-${Date.now()}`
                };
            }
            return inst;
        });
        
        const success = await updateStudent(student.id, { installments: updatedInstallments });
        setIsLoading(false);

        if (success) {
            toast({ title: "Success", description: "Payment recorded." });
            onUpdate();
            setIsOpen(false);
            form.reset();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm">Mark as Paid</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Record Payment for Installment</DialogTitle>
                    <DialogDescription>Amount: SAR {installment.amount.toFixed(2)}. Due: {format(new Date(installment.dueDate), 'PPP')}</DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleMarkAsPaid)} className="space-y-4">
                        <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Payment Method</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select a payment method" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="visa">Visa</SelectItem>
                                        <SelectItem value="mada">Mada</SelectItem>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="transfer">Bank Transfer</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <DialogFooter>
                            <Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirm Payment</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// 3. SetGracePeriodDialog
function SetGracePeriodDialog({ student, installment, onUpdate }: { student: StudentProfile, installment: Installment, onUpdate: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [date, setDate] = useState<Date | undefined>();
    const { toast } = useToast();
    const { updateStudent } = useDatabase();
    const [isLoading, setIsLoading] = useState(false);
    const originalDueDate = startOfDay(new Date(installment.dueDate));

    const handleSetGracePeriod = async () => {
        if (!date) {
            toast({ title: "Error", description: "Please select a new date.", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        const updatedInstallments = student.installments!.map(inst => 
            inst.id === installment.id ? { ...inst, gracePeriodUntil: format(date, 'yyyy-MM-dd') } : inst
        );

        const success = await updateStudent(student.id, { installments: updatedInstallments });
        setIsLoading(false);

        if (success) {
            toast({ title: "Success", description: "Grace period has been set." });
            onUpdate();
            setIsOpen(false);
            setDate(undefined);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm"><CalendarClock className="mr-2 h-3 w-3" /> Grace Period</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Set Grace Period</DialogTitle>
                    <DialogDescription>Select a new due date for this installment.</DialogDescription>
                </DialogHeader>
                <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(day) => day < originalDueDate}
                    initialFocus
                />
                <DialogFooter>
                    <Button onClick={handleSetGracePeriod} disabled={!date || isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save New Date</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// 4. ChangeAllDueDatesDialog
function ChangeAllDueDatesDialog({ student, onUpdate }: { student: StudentProfile, onUpdate: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [day, setDay] = useState<string | undefined>(student.preferredPayDay?.toString());
    const { toast } = useToast();
    const { updateStudent } = useDatabase();
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdateDueDates = async () => {
        if (!day) {
            toast({ title: "Error", description: "Please select a day.", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        const preferredDay = parseInt(day, 10);
        const today = new Date();
        const updatedInstallments = student.installments!.map(inst => {
            const dueDate = new Date(inst.dueDate);
            if (inst.status === 'unpaid' && startOfDay(dueDate) >= startOfDay(today)) {
                return { ...inst, dueDate: format(setDate(dueDate, preferredDay), 'yyyy-MM-dd') };
            }
            return inst;
        });

        const success = await updateStudent(student.id, { installments: updatedInstallments, preferredPayDay: preferredDay });
        setIsLoading(false);
        if (success) {
            toast({ title: "Success", description: "Future due dates have been updated." });
            onUpdate();
            setIsOpen(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline"><CalendarClock className="mr-2 h-4 w-4" /> Change All Due Dates</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Change All Future Due Dates</DialogTitle>
                    <DialogDescription>Set a preferred day of the month for all future unpaid installments.</DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-2 py-4">
                    <Label htmlFor="day-select" className="shrink-0">Preferred Day of Month</Label>
                    <Select onValueChange={setDay} defaultValue={day}>
                        <SelectTrigger id="day-select" className="w-full"><SelectValue placeholder="Select a day" /></SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                                <SelectItem key={d} value={d.toString()}>{d}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button onClick={handleUpdateDueDates} disabled={!day || isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Update Dates</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// 5. InvoiceDialog
function InvoiceDialog({ student, installment, summary, isOpen, onOpenChange }: { student: StudentProfile, installment: Installment, summary: { paid: number, due: number }, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    
    const handlePrint = () => {
        const printContent = document.getElementById('invoice-content');
        if (printContent) {
            const printWindow = window.open('', '', 'height=800,width=800');
            printWindow?.document.write('<html><head><title>Invoice</title>');
            printWindow?.document.write('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">'); // Basic tailwind for printing
            printWindow?.document.write('<style>@media print { body { -webkit-print-color-adjust: exact; } .no-print { display: none; } }</style>');
            printWindow?.document.write('</head><body>');
            printWindow?.document.write(printContent.innerHTML);
            printWindow?.document.write('</body></html>');
            printWindow?.document.close();
            printWindow?.focus();
            setTimeout(() => { printWindow?.print(); }, 500);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl p-0">
                <div id="invoice-content" className="p-8">
                    <header className="flex justify-between items-center pb-4 border-b">
                        <AppLogo />
                        <div className="text-right">
                            <h2 className="text-2xl font-bold">فاتورة / Invoice</h2>
                            <p className="text-muted-foreground">#{installment.invoiceNumber}</p>
                        </div>
                    </header>
                    <section className="grid grid-cols-2 gap-8 my-8">
                        <div>
                            <h3 className="font-semibold mb-2">الفاتورة إلى / Billed To:</h3>
                            <p>{student.name}</p>
                            <p>Student ID: {student.id}</p>
                        </div>
                        <div className="text-right">
                             <p><span className="font-semibold">تاريخ الفاتورة / Invoice Date:</span> {installment.paymentDate ? format(new Date(installment.paymentDate), 'yyyy-MM-dd') : 'N/A'}</p>
                             <p><span className="font-semibold">تاريخ الاستحقاق / Due Date:</span> {format(new Date(installment.dueDate), 'yyyy-MM-dd')}</p>
                        </div>
                    </section>
                    <section>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>الوصف / Description</TableHead>
                                    <TableHead className="text-right">المبلغ / Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell>Installment for {student.paymentPlan} plan</TableCell>
                                    <TableCell className="text-right">SAR {installment.amount.toFixed(2)}</TableCell>
                                </TableRow>
                            </TableBody>
                            <TableFooterComponent>
                                 <TableRow>
                                    <TableCell>طريقة الدفع / Payment Method</TableCell>
                                    <TableCell className="text-right uppercase">{installment.paymentMethod}</TableCell>
                                </TableRow>
                                <TableRow className="font-bold text-lg">
                                    <TableCell>المجموع / Total</TableCell>
                                    <TableCell className="text-right">SAR {installment.amount.toFixed(2)}</TableCell>
                                </TableRow>
                            </TableFooterComponent>
                        </Table>
                    </section>
                    <section className="mt-8 border-t pt-4 text-sm">
                         <h4 className="font-semibold mb-2">ملخص الحساب / Account Summary</h4>
                         <div className="flex justify-between">
                            <p>إجمالي المدفوع / Total Paid:</p>
                            <p>SAR {summary.paid.toFixed(2)}</p>
                         </div>
                         <div className="flex justify-between">
                            <p>إجمالي المستحق / Total Due:</p>
                            <p>SAR {summary.due.toFixed(2)}</p>
                         </div>
                    </section>
                    <footer className="text-center text-xs text-muted-foreground mt-8">
                        <p>شكراً لتعاملكم معنا. / Thank you for your business.</p>
                        <p>Bait Al Oud</p>
                    </footer>
                </div>
                <DialogFooter className="p-4 border-t no-print bg-muted">
                    <Button onClick={handlePrint}><Printer className="mr-2"/> Print Invoice</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// 6. EOD Report Dialog
function EodReportDialog({ isOpen, onOpenChange, students }: { isOpen: boolean, onOpenChange: (open: boolean) => void, students: StudentProfile[] }) {
    const eodReportData = useMemo(() => {
        if (!isOpen) return null;

        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const report = {
            visa: 0,
            mada: 0,
            cash: 0,
            transfer: 0,
            total: 0,
            transactions: [] as { studentName: string; amount: number; method?: PaymentMethod, invoice?: string }[],
        };

        students.forEach(student => {
            student.installments?.forEach(inst => {
                if (inst.status === 'paid' && inst.paymentDate === todayStr) {
                    const amount = inst.amount;
                    if (inst.paymentMethod) {
                        report[inst.paymentMethod] += amount;
                    }
                    report.total += amount;
                    report.transactions.push({
                        studentName: student.name,
                        amount: inst.amount,
                        method: inst.paymentMethod,
                        invoice: inst.invoiceNumber,
                    });
                }
            });
        });
        return report;
    }, [isOpen, students]);

    if (!eodReportData) return null;
    
    const handlePrint = () => {
        const printContent = document.getElementById('eod-report-content');
        if (printContent) {
            const printWindow = window.open('', '', 'height=800,width=800');
            printWindow?.document.write('<html><head><title>EOD Report</title>');
            printWindow?.document.write('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">');
            printWindow?.document.write('<style>@media print { .no-print { display: none; } }</style>');
            printWindow?.document.write('</head><body>');
            printWindow?.document.write(printContent.innerHTML);
            printWindow?.document.write('</body></html>');
            printWindow?.document.close();
            printWindow?.focus();
            setTimeout(() => { printWindow?.print(); }, 500);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <div id="eod-report-content" className="space-y-6 p-2">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">End of Day Report</DialogTitle>
                        <DialogDescription>
                            Summary of all payments collected on {format(new Date(), 'PPP')}.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <Card>
                        <CardHeader><CardTitle>Summary by Payment Method</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="bg-muted p-4 rounded-lg text-center">
                                <p className="text-sm text-muted-foreground">Visa</p>
                                <p className="text-xl font-bold">SAR {eodReportData.visa.toFixed(2)}</p>
                            </div>
                            <div className="bg-muted p-4 rounded-lg text-center">
                                <p className="text-sm text-muted-foreground">Mada</p>
                                <p className="text-xl font-bold">SAR {eodReportData.mada.toFixed(2)}</p>
                            </div>
                            <div className="bg-muted p-4 rounded-lg text-center">
                                <p className="text-sm text-muted-foreground">Cash</p>
                                <p className="text-xl font-bold">SAR {eodReportData.cash.toFixed(2)}</p>
                            </div>
                            <div className="bg-muted p-4 rounded-lg text-center">
                                <p className="text-sm text-muted-foreground">Transfer</p>
                                <p className="text-xl font-bold">SAR {eodReportData.transfer.toFixed(2)}</p>
                            </div>
                             <div className="bg-primary text-primary-foreground p-4 rounded-lg text-center col-span-2 md:col-span-1">
                                <p className="text-sm">Grand Total</p>
                                <p className="text-xl font-bold">SAR {eodReportData.total.toFixed(2)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Transaction Details</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice #</TableHead>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {eodReportData.transactions.length > 0 ? eodReportData.transactions.map((tx, i) => (
                                        <TableRow key={tx.invoice || i}>
                                            <TableCell>{tx.invoice || 'N/A'}</TableCell>
                                            <TableCell>{tx.studentName}</TableCell>
                                            <TableCell className="uppercase">{tx.method || 'N/A'}</TableCell>
                                            <TableCell className="text-right">SAR {tx.amount.toFixed(2)}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={4} className="text-center">No transactions recorded today.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                <DialogFooter className="p-4 border-t no-print bg-muted">
                    <Button onClick={handlePrint}><Printer className="mr-2"/> Print Report</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// 7. EditPricesDialog
const pricesSchema = z.object({
  monthly: z.coerce.number().min(0, "Price cannot be negative."),
  quarterly: z.coerce.number().min(0, "Price cannot be negative."),
  yearly: z.coerce.number().min(0, "Price cannot be negative."),
});

type PricesFormValues = z.infer<typeof pricesSchema>;

function EditPricesDialog({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    const { paymentSettings, updatePaymentSettings } = useDatabase();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    
    const form = useForm<PricesFormValues>({
        resolver: zodResolver(pricesSchema),
        defaultValues: paymentSettings,
    });
    
    useEffect(() => {
        form.reset(paymentSettings);
    }, [paymentSettings, isOpen, form]);

    const onSubmit = async (data: PricesFormValues) => {
        setIsLoading(true);
        const success = await updatePaymentSettings(data);
        setIsLoading(false);
        if (success) {
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Subscription Prices</DialogTitle>
                    <DialogDescription>Update the prices for the subscription plans. Changes will only affect new plans.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="monthly" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Monthly Plan Price (SAR)</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="quarterly" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Quarterly Plan Price (SAR)</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="yearly" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Yearly Plan Price (SAR)</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Prices
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// --- Main Page Component ---
export default function PaymentsPage() {
    const { students: allStudents, loading, paymentSettings } = useDatabase();
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [today, setToday] = useState<Date | null>(null);
    const [forceUpdate, setForceUpdate] = useState(0);

    const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
    const [isEodReportOpen, setIsEodReportOpen] = useState(false);
    const [isEditPricesOpen, setIsEditPricesOpen] = useState(false);


    useEffect(() => {
        setToday(new Date()); // Avoid hydration mismatch
    }, [forceUpdate]);
    
    const getStatus = (installment: Installment): { text: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
        if (installment.status === 'paid') return { text: 'Paid', variant: 'default' };
        if (!today) return { text: 'Unpaid', variant: 'secondary' }; // Default before hydration
        const dueDate = new Date(installment.gracePeriodUntil || installment.dueDate);
        if (isPast(dueDate) && !isToday(dueDate)) return { text: 'Overdue', variant: 'destructive' };
        return { text: 'Unpaid', variant: 'secondary' };
    };
    
    const categorizedStudents = useMemo(() => {
        const lists: { [key: string]: StudentProfile[] } = { overdue: [], upToDate: [], planNotSet: [], cancelled: [] };
        if (!today) return lists;

        allStudents.forEach(student => {
            const isActive = student.enrolledIn && student.enrolledIn.length > 0;
            if (!isActive && student.installments && student.installments.length > 0) {
                 lists.cancelled.push(student);
            } else if (!student.paymentPlan || student.paymentPlan === 'none' || !student.installments) {
                if (isActive) {
                    lists.planNotSet.push(student);
                }
            } else {
                const isOverdue = student.installments.some(inst => getStatus(inst).text === 'Overdue');
                if (isOverdue) {
                    lists.overdue.push(student);
                } else {
                    lists.upToDate.push(student);
                }
            }
        });
        return lists;
    }, [allStudents, today]);

    const selectedStudent = useMemo(() => {
        return allStudents.find(s => s.id === selectedStudentId);
    }, [allStudents, selectedStudentId]);

    const paymentSummary = useMemo(() => {
        if (!selectedStudent || !selectedStudent.installments) return { paid: 0, due: 0, nextDueDate: null };
        const summary = selectedStudent.installments.reduce((acc, inst) => {
            if (inst.status === 'paid') acc.paid += inst.amount;
            else acc.due += inst.amount;
            return acc;
        }, { paid: 0, due: 0 });
        
        const nextDueDate = selectedStudent.installments
            .filter(i => i.status === 'unpaid')
            .map(i => new Date(i.dueDate))
            .sort((a,b) => a.getTime() - b.getTime())[0];

        return { ...summary, nextDueDate };
    }, [selectedStudent]);
    
    const handleForceUpdate = () => setForceUpdate(v => v + 1);

    const openInvoice = (installment: Installment) => {
        setSelectedInstallment(installment);
        setIsInvoiceOpen(true);
    };

    if (loading || !today) {
        return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h1 className="text-3xl font-bold font-headline flex items-center gap-2 self-start"><Wallet className="w-8 h-8" />Financial Management</h1>
                <div className="flex items-center gap-2">
                    <Button onClick={() => setIsEditPricesOpen(true)} variant="outline"><Settings className="mr-2" /> Manage Prices</Button>
                    <Button onClick={() => setIsEodReportOpen(true)} variant="outline"><FileClock className="mr-2" /> EOD Report</Button>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader><CardTitle>Student Selection</CardTitle></CardHeader>
                        <CardContent>
                            <Accordion type="multiple" defaultValue={['overdue', 'upToDate', 'planNotSet']} className="w-full">
                                {(['overdue', 'upToDate', 'planNotSet', 'cancelled'] as const).map(category => {
                                    const categoryMap = {
                                        overdue: { title: "Overdue", students: categorizedStudents.overdue, badge: "destructive" as const },
                                        upToDate: { title: "Up to Date", students: categorizedStudents.upToDate, badge: "secondary" as const },
                                        planNotSet: { title: "Plan Not Set", students: categorizedStudents.planNotSet, badge: "outline" as const },
                                        cancelled: { title: "Cancelled", students: categorizedStudents.cancelled, badge: "outline" as const }
                                    };
                                    const { title, students, badge } = categoryMap[category];
                                    return (
                                        <AccordionItem value={category} key={category}>
                                            <AccordionTrigger className="text-base hover:no-underline">
                                                <div className="flex items-center gap-2">
                                                    {title} <Badge variant={badge}>{students.length}</Badge>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="flex flex-col gap-1 pt-2">
                                                    {students.length > 0 ? students.map(s => (
                                                        <Button key={s.id} variant="ghost" onClick={() => setSelectedStudentId(s.id)} className={cn("justify-start", selectedStudentId === s.id && "bg-accent text-accent-foreground")}>
                                                            {s.name}
                                                        </Button>
                                                    )) : <p className="text-sm text-muted-foreground px-4">No students in this category.</p>}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    )
                                })}
                            </Accordion>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-3">
                    {!selectedStudent ? (
                        <Card className="flex items-center justify-center h-96">
                            <CardContent className="text-center p-6">
                                <p className="text-muted-foreground">Select a student from the list to view their financial details.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold">{selectedStudent.name}'s Financials</h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader><CardTitle>Plan Details</CardTitle></CardHeader>
                                    <CardContent>
                                        <p><strong>Current Plan:</strong> <span className="capitalize">{selectedStudent.paymentPlan || 'Not Set'}</span></p>
                                        <p><strong>Subscription Start:</strong> {selectedStudent.subscriptionStartDate ? format(new Date(selectedStudent.subscriptionStartDate), 'PPP') : 'N/A'}</p>
                                    </CardContent>
                                    <CardFooter>
                                        <AssignPlanDialog student={selectedStudent} onPlanAssigned={handleForceUpdate} />
                                    </CardFooter>
                                </Card>
                                <Card>
                                    <CardHeader><CardTitle>Financial Overview</CardTitle></CardHeader>
                                    <CardContent>
                                        <p><strong>Total Paid:</strong> SAR {paymentSummary.paid.toFixed(2)}</p>
                                        <p><strong>Total Due:</strong> SAR {paymentSummary.due.toFixed(2)}</p>
                                        <p><strong>Next Payment Due:</strong> {paymentSummary.nextDueDate ? format(paymentSummary.nextDueDate, 'PPP') : 'N/A'}</p>
                                    </CardContent>
                                </Card>
                            </div>
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle>Payment Schedule</CardTitle>
                                        {selectedStudent.installments && selectedStudent.installments.length > 0 && (
                                            <ChangeAllDueDatesDialog student={selectedStudent} onUpdate={handleForceUpdate} />
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Due Date</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Payment Date</TableHead>
                                                <TableHead>Method</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedStudent.installments && selectedStudent.installments.length > 0 ? (
                                                selectedStudent.installments.map(inst => (
                                                    <TableRow key={inst.id}>
                                                        <TableCell>{format(new Date(inst.dueDate), "PPP")}{inst.gracePeriodUntil && <p className="text-xs text-muted-foreground">Grace until {format(new Date(inst.gracePeriodUntil), "PPP")}</p>}</TableCell>
                                                        <TableCell>SAR {inst.amount.toFixed(2)}</TableCell>
                                                        <TableCell><Badge variant={getStatus(inst).variant}>{getStatus(inst).text}</Badge></TableCell>
                                                        <TableCell>{inst.paymentDate ? format(new Date(inst.paymentDate), "PPP") : 'N/A'}</TableCell>
                                                        <TableCell className="uppercase">{inst.paymentMethod || 'N/A'}</TableCell>
                                                        <TableCell className="text-right">
                                                            {getStatus(inst).text !== 'Paid' ? (
                                                                <div className="flex gap-2 justify-end">
                                                                    <MarkAsPaidDialog student={selectedStudent} installment={inst} onUpdate={handleForceUpdate} />
                                                                    {getStatus(inst).text === 'Overdue' && 
                                                                        <SetGracePeriodDialog student={selectedStudent} installment={inst} onUpdate={handleForceUpdate} />
                                                                    }
                                                                </div>
                                                            ) : (
                                                                <Button variant="outline" size="sm" onClick={() => openInvoice(inst)}><FileText className="mr-2 h-3 w-3" /> Invoice</Button>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow><TableCell colSpan={6} className="text-center">No payment plan assigned.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
            {selectedStudent && selectedInstallment && (
                <InvoiceDialog student={selectedStudent} installment={selectedInstallment} summary={paymentSummary} isOpen={isInvoiceOpen} onOpenChange={setIsInvoiceOpen} />
            )}
             <EodReportDialog 
                isOpen={isEodReportOpen}
                onOpenChange={setIsEodReportOpen}
                students={allStudents}
            />
             <EditPricesDialog 
                isOpen={isEditPricesOpen}
                onOpenChange={setIsEditPricesOpen}
             />
        </div>
    );
}

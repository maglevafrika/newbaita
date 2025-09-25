"use client";

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, Pie, PieChart, Cell, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import { useDatabase } from '@/context/database-context';
import { useApplicants } from '@/context/applicants-context';
import type { Installment } from '@/lib/types';
import { format, parseISO, startOfDay, differenceInYears } from 'date-fns';
import { LineChart as LineChartIcon, Users, DollarSign, UserCheck, Loader2, UserRound, Cake, BarChartHorizontal, TrendingUp } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip } from '@radix-ui/react-tooltip';

const chartConfig = {
  students: { label: "Students", color: "hsl(var(--primary))" },
  paid: { label: "Paid", color: "hsl(var(--chart-1))" },
  unpaid: { label: "Unpaid", color: "hsl(var(--chart-2))" },
  overdue: { label: "Overdue", color: "hsl(var(--destructive))" },
  applicants: { label: "Applicants", color: "hsl(var(--secondary))" },
  male: { label: "Male", color: "hsl(var(--chart-1))" },
  female: { label: "Female", color: "hsl(var(--chart-2))" },
  age: { label: "Students", color: "hsl(var(--primary))" },
  saturday: { label: 'Saturday', color: '#8884d8' },
  sunday: { label: 'Sunday', color: '#82ca9d' },
  monday: { label: 'Monday', color: '#ffc658' },
  tuesday: { label: 'Tuesday', color: '#ff8042' },
  wednesday: { label: 'Wednesday', color: '#0088FE' },
  thursday: { label: 'Thursday', color: '#00C49F' },
  friday: { label: 'Friday', color: '#FFBB28' },
  expected: { label: 'Expected', color: 'hsl(var(--chart-1))' },
  collected: { label: 'Collected', color: 'hsl(var(--chart-3))' },
};

export default function ReportsPage() {
    const { students, semesters, loading: dbLoading } = useDatabase();
    const { applicants, loading: appLoading } = useApplicants();
    const { t } = useTranslation();

    // 1. Enrollment Data
    const enrollmentData = useMemo(() => {
        const countsByMonth: { [key: string]: number } = {};
        students.forEach(student => {
            if (student.enrollmentDate) {
                try {
                    const month = format(parseISO(student.enrollmentDate), 'MMM yyyy');
                    countsByMonth[month] = (countsByMonth[month] || 0) + 1;
                } catch {}
            }
        });
        
        const sortedMonths = Object.keys(countsByMonth).sort((a,b) => {
            const [monA, yearA] = a.split(' ');
            const [monB, yearB] = b.split(' ');
            const dateA = new Date(`${monA} 1 ${yearA}`);
            const dateB = new Date(`${monB} 1 ${yearB}`);
            return dateA.getTime() - dateB.getTime();
        });

        return sortedMonths.map(month => ({
            name: month,
            students: countsByMonth[month]
        }));
    }, [students]);
    
    // 2. Financial Data
    const financialData = useMemo(() => {
        const stats = { paid: 0, unpaid: 0, overdue: 0 };
        const today = startOfDay(new Date());

        students.forEach(student => {
            student.installments?.forEach((inst: Installment) => {
                if(inst.status === 'paid') {
                    stats.paid += inst.amount;
                } else {
                    const dueDate = startOfDay(parseISO(inst.dueDate));
                    if(dueDate < today) stats.overdue += inst.amount;
                    else stats.unpaid += inst.amount;
                }
            })
        });
        
        return [
            { name: t('reports.paid'), value: stats.paid, fill: 'var(--color-paid)' },
            { name: t('reports.unpaid'), value: stats.unpaid, fill: 'var(--color-unpaid)' },
            { name: t('reports.overdue'), value: stats.overdue, fill: 'var(--color-overdue)' },
        ];
    }, [students, t]);

    // 3. Applicant Data
    const applicantData = useMemo(() => {
        const counts = applicants.reduce((acc, applicant) => {
            acc[applicant.status] = (acc[applicant.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value]) => ({
            name,
            count: value
        }));
    }, [applicants]);

    // 4. Gender Data
    const genderData = useMemo(() => {
        const counts = students.reduce((acc, student) => {
            const gender = student.gender || 'unknown';
            acc[gender] = (acc[gender] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return [
            { name: t('reports.male'), value: counts.male || 0, fill: 'var(--color-male)' },
            { name: t('reports.female'), value: counts.female || 0, fill: 'var(--color-female)' },
        ];
    }, [students, t]);

    // 5. Age Group Data
    const ageGroupData = useMemo(() => {
        const ageGroups: { [key: string]: number } = {
            [t('reports.under18')]: 0,
            [t('reports.18_24')]: 0,
            [t('reports.25_34')]: 0,
            [t('reports.35_44')]: 0,
            [t('reports.45plus')]: 0,
        };

        const today = new Date();
        students.forEach(student => {
            if (student.dob) {
                const age = differenceInYears(today, parseISO(student.dob));
                if (age < 18) ageGroups[t('reports.under18')]++;
                else if (age <= 24) ageGroups[t('reports.18_24')]++;
                else if (age <= 34) ageGroups[t('reports.25_34')]++;
                else if (age <= 44) ageGroups[t('reports.35_44')]++;
                else ageGroups[t('reports.45plus')]++;
            }
        });

        return Object.entries(ageGroups).map(([name, count]) => ({ name, students: count }));
    }, [students, t]);

    // 6. Teacher Workload Data
    const teacherWorkloadData = useMemo(() => {
        if (!semesters.length || !semesters[0]?.masterSchedule) return [];
        const { masterSchedule } = semesters[0];
        return Object.entries(masterSchedule).map(([teacherName, schedule]) => {
            const workload: { [day: string]: number } = {
                saturday: 0, sunday: 0, monday: 0, tuesday: 0, wednesday: 0, thursday: 0
            };
            Object.entries(schedule || {}).forEach(([day, sessions]) => {
                const totalHours = Array.isArray(sessions)
                    ? sessions.reduce((acc, session) => acc + session.duration, 0)
                    : 0;
                if (day.toLowerCase() in workload) workload[day.toLowerCase()] = totalHours;
            });
            return { name: teacherName, ...workload };
        });
    }, [semesters]);

    // 7. Expected Revenue
    const expectedRevenueData = useMemo(() => {
        const stats = { expected: 0, collected: 0 };
        students.forEach(student => {
            student.installments?.forEach((inst: Installment) => {
                stats.expected += inst.amount;
                if(inst.status === 'paid') stats.collected += inst.amount;
            });
        });
        return [
            { name: t('reports.revenue'), expected: stats.expected, collected: stats.collected }
        ];
    }, [students, t]);

    const loading = dbLoading || appLoading;

    if (loading) {
        return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <LineChartIcon className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">{t('reports.title')}</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Enrollment Trends */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Users /> {t('reports.enrollmentTrends')}</CardTitle>
                        <CardDescription>{t('reports.enrollmentTrendsDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-64 w-full">
                            <BarChart data={enrollmentData}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="students" fill="var(--color-students)" />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Financial Overview */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><DollarSign /> {t('reports.financialOverview')}</CardTitle>
                        <CardDescription>{t('reports.financialOverviewDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-64 w-full">
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent nameKey="value" />} />
                                <Pie data={financialData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                                    {financialData.map((entry) => (
                                        <Cell key={entry.name} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <ChartLegend content={<ChartLegendContent />} />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Applicant Funnel */}
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><UserCheck /> {t('reports.applicantFunnel')}</CardTitle>
                        <CardDescription>{t('reports.applicantFunnelDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-64 w-full">
                            <BarChart data={applicantData} layout="vertical">
                                <CartesianGrid horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="count" fill="var(--color-applicants)" />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Gender Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><UserRound /> {t('reports.genderDistribution')}</CardTitle>
                        <CardDescription>{t('reports.genderDistributionDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-64 w-full">
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent nameKey="value" />} />
                                <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                                    {genderData.map((entry) => (
                                        <Cell key={entry.name} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <ChartLegend content={<ChartLegendContent />} />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Age Groups */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Cake /> {t('reports.ageGroups')}</CardTitle>
                        <CardDescription>{t('reports.ageGroupsDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-64 w-full">
                            <BarChart data={ageGroupData}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="students" fill="var(--color-age)" />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Expected Revenue */}
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><TrendingUp /> {t('reports.expectedRevenue')}</CardTitle>
                        <CardDescription>{t('reports.expectedRevenueDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-64 w-full">
                            <BarChart data={expectedRevenueData}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <ChartLegend content={<ChartLegendContent />} />
                                <Bar dataKey="expected" fill="var(--color-expected)" />
                                <Bar dataKey="collected" fill="var(--color-collected)" />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Teacher Workload */}
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BarChartHorizontal /> {t('reports.teacherWorkload')}</CardTitle>
                        <CardDescription>{t('reports.teacherWorkloadDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[400px] w-full">
                            <BarChart data={teacherWorkloadData} layout="vertical">
                                <CartesianGrid horizontal={false} />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="name" />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Legend />
                                <Bar dataKey="saturday" stackId="a" fill="var(--color-saturday)" name={t('reports.saturday')} />
                                <Bar dataKey="sunday" stackId="a" fill="var(--color-sunday')" name={t('reports.sunday')} />
                                <Bar dataKey="monday" stackId="a" fill="var(--color-monday')" name={t('reports.monday')} />
                                <Bar dataKey="tuesday" stackId="a" fill="var(--color-tuesday')" name={t('reports.tuesday')} />
                                <Bar dataKey="wednesday" stackId="a" fill="var(--color-wednesday')" name={t('reports.wednesday')} />
                                <Bar dataKey="thursday" stackId="a" fill="var(--color-thursday')" name={t('reports.thursday')} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

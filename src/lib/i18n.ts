import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      nav: {
        dashboard: "Dashboard",
        requests: "Requests",
        students: "Students",
        applicants: "Applicants",
        users: "Users",
        semesters: "Semesters",
        leaves: "Leaves",
        exclusions: "Exclusions",
        payments: "Payments",
        reports: "Reports",
        settings: "Settings",
        print: "Print",
        languages: "Languages",
        selectLanguage: "Select Language",
        switchTheme: "Switch to {{mode}} mode",
        profile: "Profile",
        changePassword: "Change Password",
        switchRole: "Switch Role",
        activeAs: "Active as: {{role}}",
        logout: "Log out",
        languageChanged: "Language Changed",
        languageSwitched: "Language switched to {{language}}",
        accessDenied: "Access Denied",
        noPermission: "You don't have permission to access settings."
      },
      common: {
        light: "light",
        dark: "dark",
        english: "English",
        arabic: "العربية",
        error: "Error",
        success: "Success",
        loading: "Loading...",
        na: "N/A",
        edit: "Edit"
      },
      days: {
        all: "All",
        saturday: "Saturday",
        sunday: "Sunday",
        monday: "Monday",
        tuesday: "Tuesday",
        wednesday: "Wednesday",
        thursday: "Thursday",
        satShort: "Sat",
        sunShort: "Sun",
        monShort: "Mon",
        tueShort: "Tue",
        wedShort: "Wed",
        thuShort: "Thu"
      },
      dashboard: {
        title: "Admin Dashboard",
        welcome: "Welcome back!",
        students: "Students",
        applicants: "Applicants",
        payments: "Payments",
        reports: "Reports",
        leaves: "Leaves",
        requests: "Requests",
        exclusions: "Exclusions",
        semesters: "Semesters",
        users: "Users",
        selectSemester: "Select a semester",
        selectTeacher: "Select a teacher",
        selectTeacherToView: "Please select a teacher to view their schedule.",
        teacherOnLeave: "You are on leave for this period. No classes to display.",
        selectDayToView: "Please select a day to view the schedule",
        noScheduleAvailable: "No schedule available for the selected teacher/day",
        noStudentsEnrolled: "No students enrolled"
      },
      actions: {
        enrollStudent: "Enroll Student",
        import: "Import",
        exportPDF: "Export PDF",
        exportCSV: "Export CSV",
        addNewUser: "Add New User",
        importStudents: "Import Students",
        addNewStudent: "Add New Student",
        removeStudent: "Remove Student",
        requestRemoval: "Remove Request"
      },
      applicants: {
        title: "Applicant Management",
        addNew: "Add New Applicant",
        name: "Name",
        instrument: "Instrument",
        status: "Status",
        appliedOn: "Applied On",
        interview: "Interview",
        notScheduled: "Not Scheduled",
        at: "at",
        with: "with",
        selectAll: "Select all",
        selectRow: "Select row",
        openMenu: "Open menu",
        filterByName: "Filter by name...",
        scheduleInterviewCount: "Schedule Interview ({{count}})",
        columns: "Columns",
        noResults: "No results.",
        rowsSelected: "{{selected}} of {{total}} row(s) selected.",
        previous: "Previous",
        next: "Next",
        statusTypes: {
          pending_review: "Pending Review",
          interview_scheduled: "Interview Scheduled",
          evaluated: "Evaluated",
          approved: "Approved",
          rejected: "Rejected",
          cancelled: "Cancelled",
          re_evaluation: "Re-evaluation"
        },
        actions: {
          editApplicant: "Edit Applicant",
          scheduleInterview: "Schedule Interview",
          evaluate: "Evaluate",
          cancelApplication: "Cancel Application"
        }
      },
      schedule: {
        selectDayToView: "Please select a day to view the schedule",
        noScheduleAvailable: "No schedule available for the selected teacher/day",
        noStudentsEnrolled: "No students enrolled",
        onLeaveMessage: "You are on leave for this period. No classes to display",
        selectTeacherMessage: "Please select a teacher to view their schedule"
      },
      attendance: {
        updated: "Attendance updated",
        markedAs: "Marked as {{status}}",
        updateFailed: "Failed to update attendance",
        present: "Present",
        absent: "Absent",
        late: "Late",
        excused: "Excused"
      },
      removal: {
        teacherReason: "Teacher requested removal from schedule view",
        requested: "Removal Requested",
        requestSent: "Request to remove {{studentName}} has been sent for approval",
        studentRemoved: "Student Removed",
        removedFromSession: "{{studentName}} has been removed from the session",
        processFailed: "Failed to process removal. {{message}}"
      },
      importSchedule: {
        title: "Import Schedule",
        description: "Functionality to bulk-import students from a CSV file coming soon",
        placeholder: "Import form will be here"
      },
      csv: {
        day: "Day",
        time: "Time",
        specialization: "Specialization",
        type: "Type",
        studentName: "Student Name",
        attendance: "Attendance"
      },
      errors: {
        daySessionsNotFound: "Could not find day sessions for this teacher",
        sessionNotFound: "Could not find the session",
        studentProfileNotFound: "Student profile not found to update enrollment"
      },
      requests: {
        title: "Teacher Requests",
        submittedOn: "Submitted on",
        noPending: {
          title: "No Pending Requests",
          description: "There are no pending requests from teachers at this time."
        },
        types: {
          addStudent: "Add Student",
          removeStudent: "Remove Student",
          changeTime: "Change Time",
          addStudentTitle: "Request to Add Student",
          removeStudentTitle: "Request to Remove Student",
          changeTimeTitle: "Request to Change Time",
          newRequest: "New Request"
        },
        labels: {
          student: "Student",
          teacher: "Teacher",
          classDay: "Class Day",
          classTime: "Class Time",
          reason: "Reason"
        },
        actions: {
          approve: "Approve",
          deny: "Deny"
        },
        status: {
          approved: "Request approved",
          approvedDescription: "The request has been successfully approved.",
          denied: "Request denied",
          deniedDescription: "The request has been successfully denied.",
          failedApproved: "Failed to approve request",
          failedDenied: "Failed to deny request",
          updateError: "There was a problem updating the request. {{message}}"
        },
        errors: {
          missingRequestId: "Request ID is missing.",
          semesterOrStudentNotFound: "Could not find semester or student for this request.",
          missingSemesterId: "Semester ID is missing.",
          missingStudentId: "Student ID is missing.",
          teacherNotFound: "Teacher {{teacherName}} not found in schedule.",
          noSessionsFound: "No sessions found for {{teacherName}} on {{day}}.",
          sessionNotFound: "Session {{sessionId}} not found in schedule."
        }
      },
      leavesPage: {
        title: "Leave Management",
        description: "View and manage all leave requests for students and teachers.",
        newRequest: "New Leave Request",
        requestFor: "Request For",
        student: "Student",
        teacher: "Teacher",
        selectType: "Select type...",
        selectStudent: "Select a student...",
        selectTeacher: "Select a teacher...",
        leaveDates: "Leave Dates",
        pickDateRange: "Pick a date range",
        reason: "Reason",
        reasonPlaceholder: "Reason for leave...",
        submit: "Submit Request",
        approve: "Approve",
        deny: "Deny",
        leaveApproved: "Leave Approved",
        leaveDenied: "Leave Denied",
        noRequests: "No leave requests found.",
        studentsTransferred: "Students Transferred",
        studentsTransferredDescription: "The students have been moved to their new schedules.",
        transferTitle: "Transfer Students for {{name}}",
        transferDescription: "The following students are affected by this leave. Please reassign them to a new teacher for the duration.",
        confirmTransfers: "Confirm Transfers & Approve",
        cancel: "Cancel"
      },
      reports: {
        title: "Reports & Analytics",
        enrollmentTrends: "Student Enrollment Trends",
        enrollmentDescription: "New student enrollments per month.",
        enrollmentTrendsDesc: "New student enrollments per month.",
        financialOverview: "Financial Overview",
        financialDescription: "Breakdown of all installment payments.",
        financialOverviewDesc: "Breakdown of all installment payments.",
        applicantFunnel: "Applicant Funnel",
        applicantDescription: "Current status of all applications.",
        applicantFunnelDesc: "Current status of all applications.",
        genderDistribution: "Gender Distribution",
        genderDescription: "Breakdown of student gender.",
        genderDistributionDesc: "Breakdown of student gender.",
        ageGroups: "Age Groups",
        ageGroupsDescription: "Distribution of students by age group.",
        ageGroupsDesc: "Distribution of students by age group.",
        expectedRevenue: "Expected Revenue",
        expectedRevenueDescription: "Comparison of expected revenue from subscriptions versus collected payments.",
        expectedRevenueDesc: "Comparison of expected revenue from subscriptions versus collected payments.",
        teacherWorkload: "Teacher Workload",
        teacherWorkloadDescription: "Weekly scheduled hours per teacher, broken down by day.",
        teacherWorkloadDesc: "Weekly scheduled hours per teacher, broken down by day.",
        paid: "Paid",
        unpaid: "Unpaid",
        overdue: "Overdue",
        male: "Male",
        female: "Female",
        under18: "Under 18",
        "18_24": "18–24",
        "25_34": "25–34",
        "35_44": "35–44",
        "45plus": "45+",
        revenue: "Revenue"
      },
      exclusionsPage: {
        title: "Exclusion Rules",
        description: "Select a semester to view or modify its scheduling exclusion rules.",
        addNew: "Add Exclusion Rule",
        addNewTitle: "Add New Exclusion Rule",
        addNewDescription: "Prevent two individuals from being scheduled in the same class.",
        manageExclusions: "Manage Exclusions",
        exclusionListFor: "Exclusion List for",
        ruleType: "Rule Type",
        selectRuleType: "Select a rule type...",
        teacherStudent: "Teacher vs. Student",
        studentStudent: "Student vs. Student",
        select: "Select...",
        student1: "Student 1",
        student2: "Student",
        reason: "Reason",
        reasonPlaceholder: "Provide a reason for this exclusion rule...",
        save: "Save Rule",
        noRules: "No exclusion rules have been set for this semester.",
        ruleAdded: "Exclusion Rule Added",
        ruleAddedDescription: "The new rule has been saved.",
        ruleRemoved: "Exclusion Removed",
        ruleRemovedDescription: "The rule has been successfully deleted.",
        selectFirstPerson: "Please select the first person.",
        selectSecondPerson: "Please select the second person.",
        reasonMinLength: "Reason must be at least 10 characters.",
        cannotSelectSamePerson: "You cannot select the same person twice.",
        semesterIdMissing: "Semester ID is missing.",
        addRuleError: "Failed to add exclusion rule. Please try again.",
        deleteRuleError: "Failed to delete exclusion rule. Please try again."
      },
      usersPage: {
        title: "User Management",
        addNewUser: "Add New User",
        editUser: "Edit User",
        deleteUser: "Delete User",
        noUsers: "No users found. Add one to get started.",
        allUsersTitle: "All Users",
        allUsersDescription: "Manage system users and their permissions.",
        name: "Name",
        username: "Username",
        rolesLabel: "Roles",
        actions: "Actions",
        roles: {
          admin: "Admin",
          teacher: "Teacher",
          student: "Student",
          staff: "Staff"
        }
      },
      studentsPage: {
        title: "Student Management",
        addNewStudent: "Add New Student",
        editStudent: "Edit Student",
        deleteStudent: "Delete Student",
        noStudents: "No students found. Add one to get started.",
        enrolledIn: "Enrolled in {{count}} course(s)",
        addStudentTitle: "Add New Student",
        addStudentDescription: "Add a new student to the system with their details.",
        allStudentsTitle: "All Students",
        searchPlaceholder: "Search students...",
        filterByLevel: "Filter by level",
        allLevels: "All Levels",
        name: "Name",
        level: "Level",
        actions: "Actions",
        sessions: "{{count}} session(s)",
        viewProfile: "View Profile",
        noStudentsFound: "No students found."
      },
      semestersPage: {
        title: "Semester Management",
        addNewSemester: "Add New Semester",
        editSemester: "Edit Semester",
        noSemesters: "No semesters found. Add one to get started.",
        teachersCount: "{{count}} Teachers"
      },
      
    }
  },
  ar: {
    translation: {
      nav: {
        dashboard: "لوحة التحكم",
        requests: "الطلبات",
        students: "الطلاب",
        applicants: "المتقدمين",
        users: "المستخدمين",
        semesters: "الفصول الدراسية",
        leaves: "الإجازات",
        exclusions: "الاستثناءات",
        payments: "المدفوعات",
        reports: "التقارير",
        settings: "الإعدادات",
        print: "طباعة",
        languages: "اللغات",
        selectLanguage: "اختر اللغة",
        switchTheme: "التبديل إلى وضع {{mode}}",
        profile: "الملف الشخصي",
        changePassword: "تغيير كلمة المرور",
        switchRole: "تبديل الدور",
        activeAs: "نشط كـ: {{role}}",
        logout: "تسجيل الخروج",
        languageChanged: "تم تغيير اللغة",
        languageSwitched: "تم التبديل إلى {{language}}",
        accessDenied: "تم رفض الوصول",
        noPermission: "ليس لديك صلاحية للوصول إلى الإعدادات."
      },
      common: {
        light: "فاتح",
        dark: "داكن",
        english: "English",
        arabic: "العربية",
        error: "خطأ",
        success: "نجح",
        loading: "جارٍ التحميل...",
        na: "غير متاح",
        edit: "تعديل"
      },
      days: {
        all: "الكل",
        saturday: "السبت",
        sunday: "الأحد",
        monday: "الاثنين",
        tuesday: "الثلاثاء",
        wednesday: "الأربعاء",
        thursday: "الخميس",
        satShort: "سبت",
        sunShort: "أحد",
        monShort: "اثنين",
        tueShort: "ثلاثاء",
        wedShort: "أربعاء",
        thuShort: "خميس"
      },
      dashboard: {
        title: "لوحة الإدارة",
        welcome: "مرحباً بعودتك!",
        students: "الطلاب",
        applicants: "المتقدمين",
        payments: "المدفوعات",
        reports: "التقارير",
        leaves: "الإجازات",
        requests: "الطلبات",
        exclusions: "الاستثناءات",
        semesters: "الفصول الدراسية",
        users: "المستخدمين",
        selectSemester: "اختر فصل دراسي",
        selectTeacher: "اختر مدرس",
        selectTeacherToView: "يرجى اختيار مدرس لعرض جدوله",
        teacherOnLeave: "أنت في إجازة خلال هذه الفترة. لا توجد فصول للعرض",
        selectDayToView: "يرجى اختيار يوم لعرض الجدول",
        noScheduleAvailable: "لا يوجد جدول متاح للمدرس/اليوم المحدد",
        noStudentsEnrolled: "لا يوجد طلاب مسجلين"
      },
      actions: {
        enrollStudent: "تسجيل طالب",
        import: "استيراد",
        exportPDF: "تصدير PDF",
        exportCSV: "تصدير CSV",
        addNewUser: "إضافة مستخدم جديد", 
        importStudents: "استيراد الطلاب", 
        addNewStudent: "إضافة طالب جديد",
        removeStudent: "إزالة طالب",
        requestRemoval: " إزالة الطلب"
      },
      applicants: {
        title: "إدارة المتقدمين",
        addNew: "إضافة متقدم جديد",
        name: "الاسم",
        instrument: "الآلة الموسيقية",
        status: "الحالة",
        appliedOn: "تاريخ التقدم",
        interview: "المقابلة",
        notScheduled: "غير مجدولة",
        at: "في",
        with: "مع",
        selectAll: "اختر الكل",
        selectRow: "اختر الصف",
        openMenu: "فتح القائمة",
        filterByName: "البحث بالاسم...",
        scheduleInterviewCount: "جدولة مقابلة ({{count}})",
        columns: "الأعمدة",
        noResults: "لا توجد نتائج.",
        rowsSelected: "تم اختيار {{selected}} من {{total}} صف.",
        previous: "السابق",
        next: "التالي",
        statusTypes: {
          pending_review: "في انتظار المراجعة",
          interview_scheduled: "تم جدولة المقابلة",
          evaluated: "تم التقييم",
          approved: "مقبول",
          rejected: "مرفوض",
          cancelled: "ملغي",
          re_evaluation: "إعادة تقييم"
        },
        actions: {
          editApplicant: "تعديل المتقدم",
          scheduleInterview: "جدولة مقابلة",
          evaluate: "تقييم",
          cancelApplication: "إلغاء الطلب"
        }
      },
      schedule: {
        selectDayToView: "يرجى اختيار يوم لعرض الجدول",
        noScheduleAvailable: "لا يوجد جدول متاح للمدرس/اليوم المحدد",
        noStudentsEnrolled: "لا يوجد طلاب مسجلين",
        onLeaveMessage: "أنت في إجازة خلال هذه الفترة. لا توجد فصول لعرضها",
        selectTeacherMessage: "يرجى اختيار مدرس لعرض جدوله"
      },
      attendance: {
        updated: "تم تحديث الحضور",
        markedAs: "تم التسجيل كـ {{status}}",
        updateFailed: "فشل في تحديث الحضور",
        present: "حاضر",
        absent: "غائب",
        late: "متأخر",
        excused: "معذور"
      },
      removal: {
        teacherReason: "طلب المدرس إزالة من عرض الجدول",
        requested: "تم طلب الإزالة",
        requestSent: "تم إرسال طلب إزالة {{studentName}} للموافقة",
        studentRemoved: "تم إزالة الطالب",
        removedFromSession: "تم إزالة {{studentName}} من الجلسة",
        processFailed: "فشل في معالجة الإزالة. {{message}}"
      },
      importSchedule: {
        title: "استيراد الجدول",
        description: "وظيفة الاستيراد المجمع للطلاب من ملف CSV قريباً",
        placeholder: "نموذج الاستيراد سيكون هنا"
      },
      csv: {
        day: "اليوم",
        time: "الوقت",
        specialization: "التخصص",
        type: "النوع",
        studentName: "اسم الطالب",
        attendance: "الحضور"
      },
      errors: {
        daySessionsNotFound: "لا يمكن العثور على جلسات اليوم لهذا المدرس",
        sessionNotFound: "لا يمكن العثور على الجلسة",
        studentProfileNotFound: "لم يتم العثور على ملف الطالب الشخصي لتحديث التسجيل"
      },
      requests: {
        title: "طلبات المدرسين",
        submittedOn: "تم الإرسال في",
        noPending: {
          title: "لا توجد طلبات معلقة",
          description: "لا توجد طلبات معلقة من المدرسين في هذا الوقت."
        },
        types: {
          addStudent: "إضافة طالب",
          removeStudent: "إزالة طالب",
          changeTime: "تغيير الوقت",
          addStudentTitle: "طلب إضافة طالب",
          removeStudentTitle: "طلب إزالة طالب",
          changeTimeTitle: "طلب تغيير الوقت",
          newRequest: "طلب جديد"
        },
        labels: {
          student: "طالب",
          teacher: "مدرس",
          classDay: "يوم الفصل",
          classTime: "وقت الفصل",
          reason: "السبب"
        },
        actions: {
          approve: "الموافقة",
          deny: "الرفض"
        },
        status: {
          approved: "تم قبول الطلب",
          approvedDescription: "تم قبول الطلب بنجاح.",
          denied: "تم رفض الطلب",
          deniedDescription: "تم رفض الطلب بنجاح.",
          failedApproved: "فشل في قبول الطلب",
          failedDenied: "فشل في رفض الطلب",
          updateError: "حدثت مشكلة في تحديث الطلب. {{message}}"
        },
        errors: {
          missingRequestId: "معرف الطلب مفقود.",
          semesterOrStudentNotFound: "لا يمكن العثور على الفصل الدراسي أو الطالب لهذا الطلب.",
          missingSemesterId: "معرف الفصل الدراسي مفقود.",
          missingStudentId: "معرف الطالب مفقود.",
          teacherNotFound: "المدرس {{teacherName}} غير موجود في الجدول.",
          noSessionsFound: "لا توجد جلسات لـ {{teacherName}} في {{day}}.",
          sessionNotFound: "الجلسة {{sessionId}} غير موجودة في الجدول."
        }
      },
      leavesPage: {
        title: "إدارة الإجازات",
        description: "عرض وإدارة جميع طلبات الإجازات للطلاب والمدرسين.",
        newRequest: "طلب إجازة جديد",
        requestFor: "طلب لـ",
        student: "طالب",
        teacher: "مدرس",
        selectType: "اختر النوع...",
        selectStudent: "اختر الطالب...",
        selectTeacher: "اختر المدرس...",
        leaveDates: "تواريخ الإجازة",
        pickDateRange: "اختر نطاق التواريخ",
        reason: "السبب",
        reasonPlaceholder: "سبب الإجازة...",
        submit: "إرسال الطلب",
        approve: "الموافقة",
        deny: "الرفض",
        leaveApproved: "تمت الموافقة على الإجازة",
        leaveDenied: "تم رفض الإجازة",
        noRequests: "لا توجد طلبات إجازة.",
        studentsTransferred: "تم نقل الطلاب",
        studentsTransferredDescription: "تم نقل الطلاب إلى جداولهم الجديدة.",
        transferTitle: "نقل الطلاب لـ {{name}}",
        transferDescription: "الطلاب التاليون متأثرون بهذه الإجازة. يرجى إعادة تعيينهم إلى مدرس جديد للفترة.",
        confirmTransfers: "تأكيد النقل والموافقة",
        cancel: "إلغاء"
      },
      reports: {
        title: "التقارير والتحليلات",
        enrollmentTrends: "اتجاهات تسجيل الطلاب",
        enrollmentDescription: "عدد الطلاب الجدد المسجلين شهرياً.",
        enrollmentTrendsDesc: "عدد الطلاب الجدد المسجلين شهرياً.",
        financialOverview: "نظرة مالية عامة",
        financialDescription: "تفصيل جميع المدفوعات بالتقسيط.",
        financialOverviewDesc: "تفصيل جميع المدفوعات بالتقسيط.",
        applicantFunnel: "مراحل المتقدمين",
        applicantDescription: "الحالة الحالية لجميع الطلبات.",
        applicantFunnelDesc: "الحالة الحالية لجميع الطلبات.",
        genderDistribution: "توزيع الجنس",
        genderDescription: "تفصيل الطلاب حسب الجنس.",
        genderDistributionDesc: "تفصيل الطلاب حسب الجنس.",
        ageGroups: "الفئات العمرية",
        ageGroupsDescription: "توزيع الطلاب حسب الفئة العمرية.",
        ageGroupsDesc: "توزيع الطلاب حسب الفئة العمرية.",
        expectedRevenue: "الإيرادات المتوقعة",
        expectedRevenueDescription: "مقارنة الإيرادات المتوقعة من الاشتراكات مقابل المدفوعات المحصلة.",
        expectedRevenueDesc: "مقارنة الإيرادات المتوقعة من الاشتراكات مقابل المدفوعات المحصلة.",
        teacherWorkload: "عبء عمل المدرسين",
        teacherWorkloadDescription: "ساعات العمل الأسبوعية لكل مدرس، مفصلة حسب اليوم.",
        teacherWorkloadDesc: "ساعات العمل الأسبوعية لكل مدرس، مفصلة حسب اليوم.",
        paid: "مدفوع",
        unpaid: "غير مدفوع",
        overdue: "متأخر",
        male: "ذكر",
        female: "أنثى",
        under18: "أقل من 18",
        "18_24": "18–24",
        "25_34": "25–34",
        "35_44": "35–44",
        "45plus": "45+",
        revenue: "الإيرادات"
      },
      exclusionsPage: {
  title: "قواعد الاستثناء",
  description: "اختر فصل دراسي لعرض أو تعديل قواعد الاستثناء الخاصة به.",
  addNew: "إضافة قاعدة استثناء",
  addNewTitle: "إضافة قاعدة استثناء جديدة",
  addNewDescription: "منع شخصين من الجدولة في نفس الصف.",
  manageExclusions: "إدارة الاستثناءات",
  exclusionListFor: "قائمة الاستثناءات لـ",
  ruleType: "نوع القاعدة",
  selectRuleType: "اختر نوع القاعدة...",
  teacherStudent: "مدرس ضد طالب",
  studentStudent: "طالب ضد طالب",
  select: "اختر...",
  student1: "طالب 1",
  student2: "طالب",
  reason: "السبب",
  reasonPlaceholder: "أدخل سبب هذه القاعدة...",
  save: "حفظ القاعدة",
  noRules: "لم يتم تعيين قواعد استثناء لهذا الفصل.",
  ruleAdded: "تمت إضافة القاعدة",
  ruleAddedDescription: "تم حفظ القاعدة الجديدة.",
  ruleRemoved: "تمت إزالة القاعدة",
  ruleRemovedDescription: "تم حذف القاعدة بنجاح.",
  // Error messages
  selectFirstPerson: "يرجى اختيار الشخص الأول.",
  selectSecondPerson: "يرجى اختيار الشخص الثاني.",
  reasonMinLength: "يجب أن يكون السبب 10 أحرف على الأقل.",
  cannotSelectSamePerson: "لا يمكنك اختيار نفس الشخص مرتين.",
  semesterIdMissing: "معرف الفصل الدراسي مفقود.",
  addRuleError: "فشل في إضافة قاعدة الاستثناء. يرجى المحاولة مرة أخرى.",
  deleteRuleError: "فشل في حذف قاعدة الاستثناء. يرجى المحاولة مرة أخرى."
},
        usersPage: {
    title: "إدارة المستخدمين",
    addNewUser: "إضافة مستخدم جديد",
    editUser: "تعديل المستخدم",
    deleteUser: "حذف المستخدم",
    noUsers: "لا توجد مستخدمين. أضف واحداً للبدء.",
    allUsersTitle: "جميع المستخدمين", // ✅ Missing key
    allUsersDescription: "إدارة مستخدمي النظام وصلاحياتهم.", // ✅ Missing key
    name: "الاسم", // ✅ Missing key
    username: "اسم المستخدم", // ✅ Missing key
    rolesLabel: "الأدوار", // ✅ Missing key
    actions: "الإجراءات", // ✅ Missing key
    roles: {
      admin: "مدير",
      teacher: "مدرس",
      student: "طالب",
      staff: "موظف"
    }
  },
        studentsPage: {
    title: "إدارة الطلاب",
    addNewStudent: "إضافة طالب جديد",
    editStudent: "تعديل الطالب",
    deleteStudent: "حذف الطالب",
    noStudents: "لا توجد طلاب. أضف واحداً للبدء.",
    enrolledIn: "مسجل في {{count}} دورة(دورات)",
    addStudentTitle: "إضافة طالب جديد", // ✅ Missing key
    addStudentDescription: "إضافة طالب جديد إلى النظام مع تفاصيله.", // ✅ Missing key
    allStudentsTitle: "جميع الطلاب", // ✅ Missing key
    searchPlaceholder: "البحث في الطلاب...", // ✅ Missing key
    filterByLevel: "تصفية حسب المستوى", // ✅ Missing key
    allLevels: "جميع المستويات", // ✅ Missing key
    name: "الاسم", // ✅ Missing key
    level: "المستوى", // ✅ Missing key
    actions: "الإجراءات", // ✅ Missing key
    sessions: "{{count}} جلسة(جلسات)", // ✅ Missing key
    viewProfile: "عرض الملف الشخصي", // ✅ Missing key
    noStudentsFound: "لم يتم العثور على طلاب." // ✅ Missing key
  },
        semestersPage: {
            title: "إدارة الفصول الدراسية",
            addNewSemester: "إضافة فصل دراسي جديد",
            editSemester: "تعديل الفصل الدراسي",
            noSemesters: "لا توجد فصول دراسية. أضف واحداً للبدء.",
            teachersCount: "{{count}} مدرس(مدرسين)"
        },
        
        
        i18n: {
            title: "إدارة الترجمة",
            addNewTranslation: "إضافة ترجمة جديدة",
            editTranslation: "تعديل الترجمة",
            deleteTranslation: "حذف الترجمة",
            noTranslations: "لا توجد ترجمات. أضف واحدة للبدء."
        },
        
    }

  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    },
    interpolation: { escapeValue: false },
    react: {
      bindI18n: 'languageChanged',
      bindI18nStore: '',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i'],
      useSuspense: true
    }
  });

i18n.on('languageChanged', (lng) => {
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
});

export default i18n;

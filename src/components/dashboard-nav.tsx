"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Role } from "@/lib/types";
import { 
  Bot, 
  Calendar, 
  FileText, 
  GraduationCap, 
  Home, 
  LineChart, 
  Users, 
  Wallet, 
  Settings, 
  CircleSlash, 
  Plane, 
  UserCheck 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';

interface NavItem {
  href: string;
  labelKey: string; // Changed from label to labelKey for translation
  roles: Role[];
  icon: React.ComponentType<{ className?: string }>;
}

export function DashboardNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useTranslation();

  if (!user) return null;

  const navItems: NavItem[] = [
    { 
      href: "/dashboard", 
      labelKey: "nav.dashboard", 
      roles: ["admin", "teacher", "upper-management", "high-level-dashboard"] as Role[], 
      icon: Home 
    },
    { 
      href: "/dashboard/requests", 
      labelKey: "nav.requests", 
      roles: ["admin", "upper-management", "high-level-dashboard"] as Role[], 
      icon: FileText 
    },
    { 
      href: "/dashboard/students", 
      labelKey: "nav.students", 
      roles: ["admin", "teacher", "upper-management", "high-level-dashboard"] as Role[], 
      icon: GraduationCap 
    },
    { 
      href: "/dashboard/applicants", 
      labelKey: "nav.applicants", 
      roles: ["admin"] as Role[], 
      icon: UserCheck 
    },
    { 
      href: "/dashboard/users", 
      labelKey: "nav.users", 
      roles: ["admin", "high-level-dashboard"] as Role[], 
      icon: Users 
    },
    { 
      href: "/dashboard/semesters", 
      labelKey: "nav.semesters", 
      roles: ["admin"] as Role[], 
      icon: Calendar 
    },
    { 
      href: "/dashboard/leaves", 
      labelKey: "nav.leaves", 
      roles: ["admin"] as Role[], 
      icon: Plane 
    },
    { 
      href: "/dashboard/exclusions", 
      labelKey: "nav.exclusions", 
      roles: ["admin"] as Role[], 
      icon: CircleSlash 
    },
    { 
      href: "/dashboard/payments", 
      labelKey: "nav.payments", 
      roles: ["admin", "upper-management", "high-level-dashboard"] as Role[], 
      icon: Wallet 
    },
    { 
      href: "/dashboard/reports", 
      labelKey: "nav.reports", 
      roles: ["admin", "upper-management", "high-level-dashboard"] as Role[], 
      icon: LineChart 
    },
    { 
      href: "/dashboard/settings", 
      labelKey: "nav.settings", 
      roles: ["admin", "high-level-dashboard"] as Role[], 
      icon: Settings 
    },
  ];

  const userHasRole = (roles: Role[]): boolean => {
    return roles.includes(user.activeRole);
  };

  return (
    <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
      {navItems.map((item) =>
        userHasRole(item.roles) && (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === item.href ? "text-primary" : "text-muted-foreground"
            )}
          >
            {t(item.labelKey)}
          </Link>
        )
      )}
    </nav>
  );
}
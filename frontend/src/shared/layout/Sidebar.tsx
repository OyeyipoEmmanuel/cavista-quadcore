import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types";

interface NavItem {
    label: string;
    path: string;
    icon: string;
}

const roleNavItems: Record<UserRole, NavItem[]> = {
    PATIENT: [
        { label: "Overview", path: "/dashboard/patient", icon: "📊" },
        { label: "Find a Clinician", path: "/dashboard/patient/clinicians", icon: "👨‍⚕️" },
        { label: "Medical Records", path: "/dashboard/patient/records", icon: "📋" },
        { label: "Consents", path: "/dashboard/patient/consents", icon: "✅" },
        { label: "Trial Eligibility", path: "/dashboard/patient/trials", icon: "🔬" },
        { label: "Profile", path: "/dashboard/patient/profile", icon: "👤" },
    ],
    CLINICIAN: [
        { label: "Overview", path: "/dashboard/clinician", icon: "📊" },
        { label: "Patients", path: "/dashboard/clinician/patients", icon: "👥" },
        { label: "Triage Queue", path: "/dashboard/clinician/triage", icon: "🏥" },
        { label: "Reports", path: "/dashboard/clinician/reports", icon: "📑" },
        { label: "Profile", path: "/dashboard/clinician/profile", icon: "👤" },
    ],
    SPONSOR: [
        { label: "Overview", path: "/dashboard/sponsor", icon: "📊" },
        { label: "Active Trials", path: "/dashboard/sponsor/trials", icon: "🔬" },
        { label: "Recruitment", path: "/dashboard/sponsor/recruitment", icon: "📈" },
        { label: "Data Exports", path: "/dashboard/sponsor/exports", icon: "📤" },
        { label: "Profile", path: "/dashboard/sponsor/profile", icon: "👤" },
    ],
    ADMIN: [
        { label: "Overview", path: "/dashboard/admin", icon: "📊" },
        { label: "Users", path: "/dashboard/admin/users", icon: "👥" },
        { label: "Audit Logs", path: "/dashboard/admin/audit", icon: "📜" },
        { label: "Settings", path: "/dashboard/admin/settings", icon: "⚙️" },
    ],
};

export function Sidebar(): React.ReactNode {
    const { user } = useAuth();
    const location = useLocation();

    const navItems = user ? roleNavItems[user.role] || [] : [];

    return (
        <aside className="w-64 min-h-[calc(100vh-4rem)] bg-[var(--color-surface-alt)] border-r border-[var(--color-border)] py-6 px-4">
            <nav className="space-y-1">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${isActive
                                ? "bg-[var(--color-primary)] text-white"
                                : "text-[var(--color-text-secondary)] hover:bg-gray-100 hover:text-[var(--color-text)]"
                                }`}
                        >
                            <span className="text-base">{item.icon}</span>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}

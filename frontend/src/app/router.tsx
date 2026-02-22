import React, { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types";
import { LandingPage } from "@/features/landing/LandingPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { ForgotPasswordPage } from "@/features/auth/ForgotPasswordPage";
import { PatientDashboard } from "@/features/dashboard/PatientDashboard";
import { ClinicianDashboard } from "@/features/dashboard/ClinicianDashboard";
import { SponsorDashboard } from "@/features/dashboard/SponsorDashboard";
import { DashboardLayout } from "@/shared/layout/DashboardLayout";
import { ComingSoon } from "@/shared/ui/ComingSoon";

// Lazy-load heavy pages to keep the initial bundle small.
// TriagePage pulls in @mlc-ai/web-llm (~2MB) — only load when navigated to.
const LazyTriagePage = React.lazy(() =>
    import("@/features/triage/TriagePage").then((m) => ({ default: m.TriagePage }))
);
const LazyRecordsPage = React.lazy(() =>
    import("@/features/records/RecordsPage").then((m) => ({ default: m.RecordsPage }))
);
const LazyCliniciansPage = React.lazy(() =>
    import("@/features/clinicians/CliniciansPage").then((m) => ({ default: m.CliniciansPage }))
);

function LazyFallback(): React.ReactNode {
    return (
        <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--color-primary)] border-t-transparent mx-auto" />
                <p className="text-sm text-[var(--color-text-secondary)]">Loading…</p>
            </div>
        </div>
    );
}

function ProtectedRoute({
    children,
    allowedRoles,
}: {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}): React.ReactNode {
    const { isAuthenticated, user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

function DashboardRedirect(): React.ReactNode {
    const { user } = useAuth();

    switch (user?.role) {
        case "PATIENT":
            return <Navigate to="/dashboard/patient" replace />;
        case "CLINICIAN":
            return <Navigate to="/dashboard/clinician" replace />;
        case "SPONSOR":
            return <Navigate to="/dashboard/sponsor" replace />;
        default:
            return <Navigate to="/login" replace />;
    }
}

export function AppRouter(): React.ReactNode {
    return (
        <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Protected — Dashboard */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <DashboardRedirect />
                    </ProtectedRoute>
                }
            />

            {/* ── Patient Routes ── */}
            <Route
                path="/dashboard/patient"
                element={
                    <ProtectedRoute allowedRoles={["PATIENT"]}>
                        <DashboardLayout>
                            <PatientDashboard />
                        </DashboardLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/patient/records"
                element={
                    <ProtectedRoute allowedRoles={["PATIENT"]}>
                        <DashboardLayout>
                            <Suspense fallback={<LazyFallback />}>
                                <LazyRecordsPage />
                            </Suspense>
                        </DashboardLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/patient/triage"
                element={
                    <ProtectedRoute allowedRoles={["PATIENT"]}>
                        <DashboardLayout>
                            <Suspense fallback={<LazyFallback />}>
                                <LazyTriagePage />
                            </Suspense>
                        </DashboardLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/patient/clinicians"
                element={
                    <ProtectedRoute allowedRoles={["PATIENT"]}>
                        <DashboardLayout>
                            <Suspense fallback={<LazyFallback />}>
                                <LazyCliniciansPage />
                            </Suspense>
                        </DashboardLayout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/dashboard/patient/consents"
                element={
                    <ProtectedRoute allowedRoles={["PATIENT"]}>
                        <DashboardLayout>
                            <ComingSoon title="Consent Management" description="Manage your data sharing consents, grant or revoke access to your medical records, and view active consent agreements." />
                        </DashboardLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/patient/trials"
                element={
                    <ProtectedRoute allowedRoles={["PATIENT"]}>
                        <DashboardLayout>
                            <ComingSoon title="Trial Eligibility" description="Discover clinical trials you may be eligible for based on your medical profile, and manage your participation status." />
                        </DashboardLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/patient/profile"
                element={
                    <ProtectedRoute allowedRoles={["PATIENT"]}>
                        <DashboardLayout>
                            <ComingSoon title="Patient Profile" description="View and update your personal information, contact details, and notification preferences." />
                        </DashboardLayout>
                    </ProtectedRoute>
                }
            />

            {/* ── Clinician Routes ── */}
            <Route
                path="/dashboard/clinician"
                element={
                    <ProtectedRoute allowedRoles={["CLINICIAN"]}>
                        <DashboardLayout>
                            <ClinicianDashboard />
                        </DashboardLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/clinician/triage"
                element={
                    <ProtectedRoute allowedRoles={["CLINICIAN"]}>
                        <DashboardLayout>
                            <Suspense fallback={<LazyFallback />}>
                                <LazyTriagePage />
                            </Suspense>
                        </DashboardLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/clinician/patients"
                element={
                    <ProtectedRoute allowedRoles={["CLINICIAN"]}>
                        <DashboardLayout>
                            <ComingSoon title="Patient Management" description="View your assigned patients, access their medical records, and manage ongoing care plans." />
                        </DashboardLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/clinician/reports"
                element={
                    <ProtectedRoute allowedRoles={["CLINICIAN"]}>
                        <DashboardLayout>
                            <ComingSoon title="Clinical Reports" description="Generate and review clinical reports, triage summaries, and patient outcome analytics." />
                        </DashboardLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/clinician/profile"
                element={
                    <ProtectedRoute allowedRoles={["CLINICIAN"]}>
                        <DashboardLayout>
                            <ComingSoon title="Clinician Profile" description="Manage your professional profile, credentials, license information, and notification settings." />
                        </DashboardLayout>
                    </ProtectedRoute>
                }
            />

            {/* ── Sponsor Routes ── */}
            <Route
                path="/dashboard/sponsor"
                element={
                    <ProtectedRoute allowedRoles={["SPONSOR"]}>
                        <DashboardLayout>
                            <SponsorDashboard />
                        </DashboardLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/sponsor/trials"
                element={
                    <ProtectedRoute allowedRoles={["SPONSOR"]}>
                        <DashboardLayout>
                            <ComingSoon title="Active Trials" description="Monitor your sponsored clinical trials, view enrollment status, and track milestones." />
                        </DashboardLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/sponsor/recruitment"
                element={
                    <ProtectedRoute allowedRoles={["SPONSOR"]}>
                        <DashboardLayout>
                            <ComingSoon title="Recruitment Analytics" description="Track recruitment metrics, view eligible patient pools, and manage outreach campaigns." />
                        </DashboardLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/sponsor/exports"
                element={
                    <ProtectedRoute allowedRoles={["SPONSOR"]}>
                        <DashboardLayout>
                            <ComingSoon title="Data Exports" description="Export anonymized trial data in FHIR-compatible formats for analysis and regulatory submissions." />
                        </DashboardLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/sponsor/profile"
                element={
                    <ProtectedRoute allowedRoles={["SPONSOR"]}>
                        <DashboardLayout>
                            <ComingSoon title="Sponsor Profile" description="Manage your organization profile, team members, and account settings." />
                        </DashboardLayout>
                    </ProtectedRoute>
                }
            />

            {/* ── Admin Routes ── */}
            <Route
                path="/dashboard/admin"
                element={
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                        <DashboardLayout>
                            <ComingSoon title="Admin Overview" description="System-wide dashboard with user statistics, system health, and key operational metrics." />
                        </DashboardLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/admin/users"
                element={
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                        <DashboardLayout>
                            <ComingSoon title="User Management" description="Manage user accounts, roles, permissions, and access controls across the platform." />
                        </DashboardLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/admin/audit"
                element={
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                        <DashboardLayout>
                            <ComingSoon title="Audit Logs" description="View immutable audit trails for all system actions, data access events, and compliance records." />
                        </DashboardLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/admin/settings"
                element={
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                        <DashboardLayout>
                            <ComingSoon title="System Settings" description="Configure system-wide settings, security policies, and integration parameters." />
                        </DashboardLayout>
                    </ProtectedRoute>
                }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}


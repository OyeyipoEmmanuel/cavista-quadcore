import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { Badge } from "@/shared/ui/Badge";
import { clinicianService, Appointment } from "@/services/clinician.service";

export function PatientDashboard(): React.ReactNode {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const data = await clinicianService.getPatientAppointments();
                setAppointments(data);
            } catch (err) {
                console.error("Failed to load appointments", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAppointments();
    }, []);

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-[var(--color-text)]">
                    Welcome back, {user?.firstName}
                </h1>
                <p className="text-[var(--color-text-secondary)] mt-1">
                    Your health dashboard — manage your records, consents, and trial eligibility.
                </p>
            </div>

            {/* CTAs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200">
                    <div className="flex flex-col h-full justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold mb-1">🩺 AI-Powered Triage</h2>
                            <p className="text-blue-100 text-sm">
                                Describe your symptoms for instant, clinical AI analysis and follow-up booking.
                            </p>
                        </div>
                        <Link to="/dashboard/patient/triage">
                            <Button variant="secondary" className="w-full">
                                Start Assessment
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="p-6 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg shadow-slate-200">
                    <div className="flex flex-col h-full justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold mb-1">👨‍⚕️ Find a Clinician</h2>
                            <p className="text-slate-300 text-sm">
                                Browse our verified network of clinical specialists and book a priority consultation directly.
                            </p>
                        </div>
                        <Link to="/dashboard/patient/clinicians">
                            <Button variant="secondary" className="w-full bg-slate-700 text-white border-transparent hover:bg-slate-600">
                                Browse Directory
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">📋</span>
                        <h3 className="font-semibold text-[var(--color-text)]">Booked Sessions</h3>
                    </div>
                    <p className="text-3xl font-bold text-[var(--color-text)]">{appointments.length}</p>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">active appointments</p>
                </Card>

                <Card>
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">✅</span>
                        <h3 className="font-semibold text-[var(--color-text)]">Active Consents</h3>
                    </div>
                    <p className="text-3xl font-bold text-[var(--color-text)]">0</p>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">consent records</p>
                </Card>

                <Card>
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">🔬</span>
                        <h3 className="font-semibold text-[var(--color-text)]">Trial Matches</h3>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        Complete your profile to be matched with eligible clinical trials.
                    </p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h3 className="font-semibold text-[var(--color-text)] border-b border-[var(--color-border)] pb-3 mb-4">
                        Upcoming Appointments
                    </h3>
                    {isLoading ? (
                        <div className="text-center py-10">Loading...</div>
                    ) : appointments.length === 0 ? (
                        <div className="text-center py-10 space-y-3">
                            <p className="text-sm text-[var(--color-text-muted)]">No upcoming appointments.</p>
                            <Link to="/dashboard/patient/triage" className="text-sm text-[var(--color-primary)] font-medium hover:underline">
                                Start Triage to Book a Specialist →
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {appointments.length > 0 && appointments.map((apt) => (
                                <div key={apt.id} className="p-4 rounded-xl border border-[var(--color-border)] bg-gray-50/50">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-[var(--color-text)]">Dr. {apt.clinician.user.last_name}</p>
                                            <p className="text-xs text-[var(--color-primary)] font-medium uppercase">{apt.clinician.specialty}</p>
                                        </div>
                                        <Badge label={apt.status} variant={apt.status === 'CONFIRMED' ? 'success' : 'warning'} />
                                    </div>
                                    <div className="mt-3 flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                                        <div className="flex items-center gap-2">
                                            <span>📅 {new Date(apt.scheduled_at).toLocaleDateString()}</span>
                                            <span>⏰ {new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card>
                    <h3 className="font-semibold text-[var(--color-text)] border-b border-[var(--color-border)] pb-3 mb-4">
                        Health Checklist
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                            <span>📝</span>
                            <span className="text-sm text-[var(--color-text)]">Complete your medical profile</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50/50 border border-amber-100">
                            <span>🔒</span>
                            <span className="text-sm text-[var(--color-text)]">Grant HIPAA consent to enable AI triage</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

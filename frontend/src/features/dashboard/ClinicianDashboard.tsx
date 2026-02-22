import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/shared/ui/Card";
import { clinicianService, Appointment } from "@/services/clinician.service";

export function ClinicianDashboard(): React.ReactNode {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const data = await clinicianService.getClinicianBookings();
                setBookings(data);
            } catch (err) {
                console.error("Failed to load bookings", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchBookings();
    }, []);

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-[var(--color-text)]">
                    Welcome, Dr. {user?.lastName}
                </h1>
                <p className="text-[var(--color-text-secondary)] mt-1">
                    Clinical decision support — review triage results and manage patient care.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <p className="text-sm text-[var(--color-text-muted)] mb-1">Upcoming Bookings</p>
                    <p className="text-3xl font-bold text-[var(--color-text)]">{bookings.length}</p>
                </Card>
                <Card>
                    <p className="text-sm text-[var(--color-text-muted)] mb-1">Patients Today</p>
                    <p className="text-3xl font-bold text-[var(--color-text)]">0</p>
                </Card>
                <Card>
                    <p className="text-sm text-[var(--color-text-muted)] mb-1">Active Trials</p>
                    <p className="text-3xl font-bold text-[var(--color-text)]">0</p>
                </Card>
                <Card>
                    <p className="text-sm text-[var(--color-text-muted)] mb-1">AI Confidence Avg</p>
                    <p className="text-3xl font-bold text-[var(--color-text)]">92%</p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <h3 className="font-semibold text-[var(--color-text)] border-b border-[var(--color-border)] pb-3 mb-4">
                            Patient Appointments
                        </h3>
                        {isLoading ? (
                            <div className="text-center py-12">Loading bookings...</div>
                        ) : bookings.length === 0 ? (
                            <p className="text-sm text-[var(--color-text-muted)] text-center py-12">
                                No upcoming appointments scheduled.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {bookings.length > 0 && bookings.map((booking) => (
                                    <div
                                        key={booking.id}
                                        className="p-4 rounded-xl border border-[var(--color-border)] hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-bold text-[var(--color-text)]">
                                                    {booking.patient.full_name}
                                                </h4>
                                                <p className="text-xs text-[var(--color-text-secondary)]">
                                                    Scheduled for: {new Date(booking.scheduled_at).toLocaleDateString()} at {new Date(booking.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${booking.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {booking.status}
                                            </span>
                                        </div>
                                        <div className="mt-3 bg-white p-3 rounded-lg border border-gray-100 text-sm text-[var(--color-text-secondary)]">
                                            <p className="font-medium text-[var(--color-text)] text-xs mb-1">Follow-up Notes:</p>
                                            {booking.notes}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                <Card className="h-fit">
                    <h3 className="font-semibold text-[var(--color-text)] border-b border-[var(--color-border)] pb-3 mb-4">
                        Triage Queue
                    </h3>
                    <p className="text-sm text-[var(--color-text-muted)] text-center py-8">
                        No immediate triage alerts.
                    </p>
                </Card>
            </div>
        </div>
    );
}

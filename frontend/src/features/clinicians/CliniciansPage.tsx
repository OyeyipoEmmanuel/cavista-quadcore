import React, { useState } from "react";
import { ClinicianList } from "@/features/clinicians/components/ClinicianList";
import { clinicianService } from "@/services/clinician.service";
import { Card } from "@/shared/ui/Card";

export function CliniciansPage(): React.ReactNode {
    const [isBooking, setIsBooking] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [bookingError, setBookingError] = useState("");

    const handleBook = async (clinicianId: string): Promise<void> => {
        setIsBooking(true);
        setBookingError("");
        setBookingSuccess(false);
        try {
            await clinicianService.bookAppointment({
                clinician_id: clinicianId,
                scheduled_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
                notes: "Direct booking from Clinicians directory.",
            });
            setBookingSuccess(true);
            setTimeout(() => setBookingSuccess(false), 5000); // clear success msg after 5s
        } catch {
            setBookingError("Failed to book appointment. Please try again or contact support.");
        } finally {
            setIsBooking(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-[var(--color-text)]">
                    Find a Clinician
                </h1>
                <p className="text-[var(--color-text-secondary)] mt-1">
                    Browse our network of certified specialists and book a consultation.
                </p>
            </div>

            <Card className="relative overflow-hidden border-2 border-blue-100 shadow-xl shadow-blue-50/50">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <span className="text-8xl">🏥</span>
                </div>

                <div className="relative mb-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                        Our verified network
                    </h3>
                    <p className="text-sm text-slate-500">
                        Select a clinician below to schedule your appointment.
                    </p>
                </div>

                {bookingSuccess && (
                    <div className="mb-6 p-6 bg-emerald-50 border border-emerald-100 rounded-xl text-center space-y-3 animate-fade-in-up">
                        <div className="text-3xl">✅</div>
                        <h4 className="font-bold text-emerald-900">Appointment Booked!</h4>
                        <p className="text-sm text-emerald-700">
                            Your session has been scheduled successfully. You can view the details in your dashboard.
                        </p>
                    </div>
                )}

                {bookingError && (
                    <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">
                        {bookingError}
                    </div>
                )}

                <ClinicianList onBook={handleBook} bookingInProgress={isBooking} />
            </Card>
        </div>
    );
}

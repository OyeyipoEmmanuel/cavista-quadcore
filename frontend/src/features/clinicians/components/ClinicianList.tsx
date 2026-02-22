import { useState, useEffect } from "react";
import { clinicianService, ClinicianProfile } from "@/services/clinician.service";

interface ClinicianListProps {
    onBook: (clinicianId: string) => void;
    bookingInProgress?: boolean;
}

export function ClinicianList({ onBook, bookingInProgress }: ClinicianListProps) {
    const [clinicians, setClinicians] = useState<ClinicianProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchClinicians = async () => {
            try {
                const data = await clinicianService.getAvailableClinicians();
                setClinicians(data);
            } catch (err) {
                setError("Failed to load available clinicians");
            } finally {
                setIsLoading(false);
            }
        };
        fetchClinicians();
    }, []);

    if (isLoading) {
        return <div className="text-center py-6">Loading available clinicians...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center py-6">{error}</div>;
    }

    if (clinicians.length === 0) {
        return (
            <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                No clinicians are currently available for booking.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clinicians.length > 0 && clinicians.map((clinician) => (
                <div
                    key={clinician.id}
                    className="group relative bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-50/50 transition-all duration-300 overflow-hidden"
                >
                    {/* Background Decorative Element */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[100px] -mr-10 -mt-10 group-hover:bg-blue-100 transition-colors" />

                    <div className="relative flex items-start gap-4 mb-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl shadow-lg shadow-blue-200 shrink-0">
                            👨‍⚕️
                        </div>
                        <div className="pt-1">
                            <h4 className="font-bold text-slate-900 text-lg leading-tight group-hover:text-blue-600 transition-colors">
                                Dr. {clinician.user.last_name}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {clinician.specialty}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="relative mb-6">
                        <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 italic">
                            "{clinician.bio || "Specialist provider available for immediate clinical follow-up and treatment planning."}"
                        </p>
                    </div>

                    <div className="relative space-y-3">
                        <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400">
                            <span className="p-1 px-2 rounded-md bg-slate-50 border border-slate-100 italic">Available Tomorrow</span>
                            <span className="p-1 px-2 rounded-md bg-slate-50 border border-slate-100">Board Certified</span>
                        </div>

                        <button
                            onClick={() => onBook(clinician.id)}
                            disabled={bookingInProgress}
                            className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-bold transition-all hover:bg-blue-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-200 flex items-center justify-center gap-2"
                        >
                            {bookingInProgress ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Confirming...
                                </>
                            ) : (
                                <>Book Consultation</>
                            )}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

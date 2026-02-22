import React, { useState } from "react";
import type { TriageResultData } from "@/lib/ai/inferenceEngine";
import { Card } from "@/shared/ui/Card";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import api from "@/services/api";
import { PrescriptionCard, type PrescriptionData } from "./PrescriptionCard";
import { ClinicianList } from "@/features/clinicians/components/ClinicianList";
import { clinicianService } from "@/services/clinician.service";

interface TriageResultsProps {
    result: TriageResultData;
}

const severityConfig: Record<
    string,
    { color: "success" | "warning" | "error" | "info"; label: string; bg: string }
> = {
    LOW: { color: "success", label: "Low Severity", bg: "bg-emerald-50 border-emerald-200" },
    MEDIUM: { color: "warning", label: "Medium Severity", bg: "bg-amber-50 border-amber-200" },
    HIGH: { color: "error", label: "High Severity", bg: "bg-orange-50 border-orange-200" },
    CRITICAL: { color: "error", label: "Critical", bg: "bg-red-50 border-red-200" },
};

export function TriageResults({ result }: TriageResultsProps): React.ReactNode {
    const defaultSeverity = { color: "warning" as const, label: "Medium Severity", bg: "bg-amber-50 border-amber-200" };
    const severityKey = result.severity || "MEDIUM";
    const severity = (severityKey in severityConfig) ? severityConfig[severityKey]! : defaultSeverity;

    const [prescription, setPrescription] = useState<PrescriptionData | null>(null);
    const [isLoadingRx, setIsLoadingRx] = useState(false);
    const [rxError, setRxError] = useState("");

    const [isBooking, setIsBooking] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [bookingError, setBookingError] = useState("");

    const handleGetPrescription = async (): Promise<void> => {
        setIsLoadingRx(true);
        setRxError("");
        try {
            const symptomsText =
                result.diagnosis || "General symptoms requiring first aid";
            const res = await api.post<PrescriptionData>("/xai/prescriptions/", {
                symptoms_text: symptomsText,
                session_id: result.sessionId || null,
            });
            setPrescription(res.data);
        } catch {
            setRxError("Failed to generate first aid suggestions. Please try again.");
        } finally {
            setIsLoadingRx(false);
        }
    };

    const handleBook = async (clinicianId: string): Promise<void> => {
        setIsBooking(true);
        setBookingError("");
        try {
            await clinicianService.bookAppointment({
                clinician_id: clinicianId,
                scheduled_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
                triage_session_id: result.sessionId || undefined,
                notes: `Follow-up for diagnosis: ${result.diagnosis.substring(0, 100)}...`,
            });
            setBookingSuccess(true);
        } catch {
            setBookingError("Failed to book appointment. Please try again or contact support.");
        } finally {
            setIsBooking(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Severity Banner */}
            <div className={`p-4 rounded-xl border ${severity.bg}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Badge label={severity.label} variant={severity.color} />
                        <span className="text-sm text-[var(--color-text-secondary)]">
                            {result.inferenceMode === "CLIENT"
                                ? "🔒 Analyzed on your device"
                                : "☁️ Analyzed on server"}
                        </span>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-[var(--color-text)]">
                            {Math.round(result.confidenceScore * 100)}%
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">Confidence</p>
                    </div>
                </div>
            </div>

            {/* Diagnosis */}
            <Card>
                <h3 className="font-semibold text-[var(--color-text)] mb-3">
                    📋 Assessment
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {result.diagnosis}
                </p>
            </Card>

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
                <Card>
                    <h3 className="font-semibold text-[var(--color-text)] mb-3">
                        💡 Recommendations
                    </h3>
                    <ul className="space-y-2">
                        {result.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <span className="text-[var(--color-primary)] mt-0.5 text-sm">•</span>
                                <span className="text-sm text-[var(--color-text-secondary)]">
                                    {rec}
                                </span>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}

            {/* Differential Diagnoses */}
            {result.differentialDiagnoses.length > 0 && (
                <Card>
                    <h3 className="font-semibold text-[var(--color-text)] mb-3">
                        🔬 Differential Diagnoses
                    </h3>
                    <div className="space-y-3">
                        {result.differentialDiagnoses.map((dx, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <span className="text-sm text-[var(--color-text)]">
                                    {dx.condition}
                                </span>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[var(--color-primary)] rounded-full transition-all"
                                            style={{ width: `${dx.confidence * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-[var(--color-text-muted)] w-10">
                                        {Math.round(dx.confidence * 100)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Explainability */}
            {result.explainability &&
                Object.keys(result.explainability).length > 0 && (
                    <Card>
                        <h3 className="font-semibold text-[var(--color-text)] mb-3">
                            🧠 AI Explainability
                        </h3>
                        {(
                            result.explainability as {
                                contributing_factors?: string[];
                                reasoning?: string;
                            }
                        ).contributing_factors && (
                                <div className="mb-3">
                                    <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">
                                        Contributing Factors:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {(
                                            result.explainability as {
                                                contributing_factors: string[];
                                            }
                                        ).contributing_factors.map((factor, i) => (
                                            <span
                                                key={i}
                                                className="px-2 py-1 text-xs bg-gray-100 text-[var(--color-text-secondary)] rounded-md"
                                            >
                                                {factor}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        {(result.explainability as { reasoning?: string }).reasoning && (
                            <p className="text-sm text-[var(--color-text-secondary)]">
                                {(result.explainability as { reasoning: string }).reasoning}
                            </p>
                        )}
                    </Card>
                )}

            {/* First Aid Prescription Section */}
            <Card>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-[var(--color-text)]">
                        💊 First Aid — Temporary Relief
                    </h3>
                    {!prescription && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleGetPrescription}
                            isLoading={isLoadingRx}
                            disabled={isLoadingRx}
                        >
                            {isLoadingRx ? "Generating..." : "Get First Aid Suggestions"}
                        </Button>
                    )}
                </div>

                {!prescription && !isLoadingRx && !rxError && (
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        Based on your symptoms and medical records, we can suggest safe
                        over-the-counter medications for <strong>temporary</strong> symptom
                        relief while you arrange to see a doctor.
                    </p>
                )}

                {rxError && (
                    <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                        {rxError}
                    </div>
                )}

                {prescription && <PrescriptionCard prescription={prescription} />}
            </Card>

            {/* Book a Clinician Section */}
            <Card className="relative overflow-hidden border-2 border-blue-100 shadow-xl shadow-blue-50/50">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <span className="text-8xl">🩺</span>
                </div>

                <div className="flex items-start gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-xl shadow-lg shadow-blue-200 shrink-0">
                        🏥
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">
                            Clinical Consultation Network
                        </h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-lg leading-relaxed">
                            Connect with verified specialists to review your AI assessment and formulate a personalized treatment plan.
                        </p>
                    </div>
                </div>

                {bookingSuccess ? (
                    <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-xl text-center space-y-3">
                        <div className="text-3xl">✅</div>
                        <h4 className="font-bold text-emerald-900">Appointment Booked!</h4>
                        <p className="text-sm text-emerald-700">
                            Your follow-up has been scheduled. You can view details in your dashboard.
                        </p>
                    </div>
                ) : (
                    <>
                        {bookingError && (
                            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                                {bookingError}
                            </div>
                        )}
                    </>
                )}
                <ClinicianList onBook={handleBook} bookingInProgress={isBooking} />
            </Card>

            {/* Disclaimer */}
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-xs text-amber-800">
                    ⚠️ This AI assessment is <strong>not a medical diagnosis</strong>.
                    Always consult a qualified healthcare professional before making
                    medical decisions. If you are experiencing a medical emergency,
                    call your local emergency number immediately.
                </p>
            </div>
        </div>
    );
}


import React from "react";

interface Drug {
    name: string;
    dosage: string;
    max_daily: string;
    purpose: string;
    warnings: string[];
    category: string;
}

interface PrescriptionData {
    id: string;
    symptoms_text: string;
    urgency: "LOW" | "MODERATE" | "HIGH";
    drugs: Drug[];
    warnings: string[];
    disclaimer: string;
    medical_context_used: boolean;
    created_at: string;
}

interface PrescriptionCardProps {
    prescription: PrescriptionData;
}

const urgencyConfig: Record<string, { color: string; bg: string; label: string; icon: string }> = {
    LOW: { color: "text-green-700", bg: "bg-green-50 border-green-200", label: "Low Urgency", icon: "🟢" },
    MODERATE: { color: "text-amber-700", bg: "bg-amber-50 border-amber-200", label: "Moderate Urgency", icon: "🟡" },
    HIGH: { color: "text-red-700", bg: "bg-red-50 border-red-200", label: "High Urgency", icon: "🔴" },
};

export type { PrescriptionData };

export function PrescriptionCard({ prescription }: PrescriptionCardProps): React.ReactNode {
    const urgency = urgencyConfig[prescription.urgency] ?? { color: "text-amber-700", bg: "bg-amber-50 border-amber-200", label: "Moderate Urgency", icon: "🟡" };

    return (
        <div className="space-y-4">
            {/* Disclaimer Banner */}
            <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200">
                <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">⚠️</span>
                    <div>
                        <h3 className="font-bold text-red-800 text-sm mb-1">
                            TEMPORARY RELIEF ONLY — NOT A SUBSTITUTE FOR MEDICAL CARE
                        </h3>
                        <p className="text-xs text-red-700 leading-relaxed">
                            {prescription.disclaimer}
                        </p>
                    </div>
                </div>
            </div>

            {/* Urgency + Medical Context */}
            <div className="flex items-center gap-3">
                <span className={`px-3 py-1.5 text-xs font-semibold rounded-full border ${urgency.bg} ${urgency.color}`}>
                    {urgency.icon} {urgency.label}
                </span>
                {prescription.medical_context_used && (
                    <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                        📋 Your medical records were considered
                    </span>
                )}
            </div>

            {/* Warnings from medical history */}
            {prescription.warnings.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <h4 className="font-semibold text-amber-800 text-xs mb-2">
                        ⚠️ Important — Based on your medical records:
                    </h4>
                    <ul className="space-y-1">
                        {prescription.warnings.map((w, i) => (
                            <li key={i} className="text-xs text-amber-700">{w}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Drug Recommendations */}
            {prescription.drugs.length > 0 ? (
                <div className="space-y-3">
                    <h4 className="font-semibold text-[var(--color-text)] text-sm">
                        💊 Recommended for Temporary Relief
                    </h4>
                    {prescription.drugs.map((drug, i) => (
                        <div
                            key={i}
                            className="p-4 rounded-xl border border-[var(--color-border)] bg-white"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h5 className="font-semibold text-[var(--color-text)] text-sm">
                                        {drug.name}
                                    </h5>
                                    <span className="text-xs text-[var(--color-text-muted)] bg-gray-100 px-1.5 py-0.5 rounded">
                                        {drug.purpose}
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-3">
                                <div>
                                    <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Dosage</p>
                                    <p className="text-sm font-medium text-[var(--color-text)]">{drug.dosage}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Max Daily</p>
                                    <p className="text-sm font-medium text-[var(--color-text)]">{drug.max_daily}</p>
                                </div>
                            </div>
                            {drug.warnings.length > 0 && (
                                <div className="mt-3 pt-2 border-t border-gray-100">
                                    <p className="text-xs text-amber-600 font-medium mb-1">⚠️ Cautions:</p>
                                    <ul className="space-y-0.5">
                                        {drug.warnings.map((w, j) => (
                                            <li key={j} className="text-xs text-[var(--color-text-secondary)]">
                                                • {w}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center">
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        No safe OTC medications could be recommended based on your symptoms and medical history.
                        Please consult a healthcare professional directly.
                    </p>
                </div>
            )}

            {/* Final reminder */}
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-xs text-blue-800 font-medium text-center">
                    🏥 These suggestions are for TEMPORARY relief only.
                    Please visit a hospital or doctor as soon as possible.
                    Do NOT use these as a long-term solution.
                </p>
            </div>
        </div>
    );
}

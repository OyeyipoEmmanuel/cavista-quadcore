import React from "react";
import { Badge } from "@/shared/ui/Badge";
import type { MedicalRecordResponse } from "@/services/records.service";

interface RecordCardProps {
    record: MedicalRecordResponse;
    onDelete?: (id: string) => void;
}

const typeIcons: Record<string, string> = {
    CONDITION: "🩺",
    MEDICATION: "💊",
    ALLERGY: "⚠️",
    PROCEDURE: "🔪",
    VITAL: "❤️",
    LAB_RESULT: "🧪",
    IMMUNIZATION: "💉",
    FAMILY_HISTORY: "👨‍👩‍👧",
    OTHER: "📄",
};

const typeLabels: Record<string, string> = {
    CONDITION: "Condition",
    MEDICATION: "Medication",
    ALLERGY: "Allergy",
    PROCEDURE: "Procedure",
    VITAL: "Vital Sign",
    LAB_RESULT: "Lab Result",
    IMMUNIZATION: "Immunization",
    FAMILY_HISTORY: "Family History",
    OTHER: "Other",
};

const statusVariant: Record<string, "success" | "warning" | "error" | "info"> = {
    ACTIVE: "warning",
    RESOLVED: "success",
    CHRONIC: "error",
};

const severityVariant: Record<string, "success" | "warning" | "error" | "info"> = {
    MILD: "success",
    MODERATE: "warning",
    SEVERE: "error",
};

export function RecordCard({ record, onDelete }: RecordCardProps): React.ReactNode {
    const icon = typeIcons[record.record_type] || "📄";
    const typeLabel = typeLabels[record.record_type] || record.record_type;

    return (
        <div className="p-4 rounded-xl border border-[var(--color-border)] bg-white hover:border-gray-300 transition-colors">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-xl mt-0.5">{icon}</span>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-[var(--color-text)] text-sm">
                                {record.title}
                            </h3>
                            <span className="text-xs text-[var(--color-text-muted)] px-1.5 py-0.5 bg-gray-100 rounded">
                                {typeLabel}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                            {record.status && (
                                <Badge
                                    label={record.status}
                                    variant={statusVariant[record.status] || "info"}
                                />
                            )}
                            {record.severity && (
                                <Badge
                                    label={record.severity}
                                    variant={severityVariant[record.severity] || "info"}
                                />
                            )}
                            {record.date_recorded && (
                                <span className="text-xs text-[var(--color-text-muted)]">
                                    {new Date(record.date_recorded).toLocaleDateString()}
                                </span>
                            )}
                        </div>

                        {record.description && (
                            <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 mb-2">
                                {record.description}
                            </p>
                        )}

                        {record.provider && (
                            <p className="text-xs text-[var(--color-text-muted)]">
                                Provider: {record.provider}
                            </p>
                        )}

                        {record.data && Object.keys(record.data).length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {Object.entries(record.data).map(([k, v]) => (
                                    <span
                                        key={k}
                                        className="px-2 py-0.5 text-xs bg-gray-50 border border-gray-100 rounded text-[var(--color-text-secondary)]"
                                    >
                                        {k}: {String(v)}
                                    </span>
                                ))}
                            </div>
                        )}

                        {record.documents && record.documents.length > 0 && (
                            <div className="mt-2">
                                <p className="text-xs text-[var(--color-text-muted)]">
                                    📎 {record.documents.length} document{record.documents.length > 1 ? "s" : ""} attached
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {onDelete && (
                    <button
                        onClick={() => onDelete(record.id)}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-2 cursor-pointer"
                        title="Delete record"
                    >
                        🗑️
                    </button>
                )}
            </div>
        </div>
    );
}

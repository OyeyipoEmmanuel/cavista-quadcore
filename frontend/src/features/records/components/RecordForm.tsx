import React, { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";

interface RecordFormProps {
    onSubmit: (data: RecordFormData) => Promise<void>;
    isLoading?: boolean;
    onCancel?: () => void;
}

export interface RecordFormData {
    record_type: string;
    title: string;
    description: string;
    date_recorded: string;
    provider: string;
    status: string;
    severity: string;
    data: Record<string, string>;
}

const RECORD_TYPES = [
    { value: "CONDITION", label: "Condition / Diagnosis", icon: "🩺" },
    { value: "MEDICATION", label: "Medication", icon: "💊" },
    { value: "ALLERGY", label: "Allergy", icon: "⚠️" },
    { value: "PROCEDURE", label: "Procedure", icon: "🔪" },
    { value: "VITAL", label: "Vital Sign", icon: "❤️" },
    { value: "LAB_RESULT", label: "Lab Result", icon: "🧪" },
    { value: "IMMUNIZATION", label: "Immunization", icon: "💉" },
    { value: "FAMILY_HISTORY", label: "Family History", icon: "👨‍👩‍👧" },
    { value: "OTHER", label: "Other", icon: "📄" },
];

const STATUS_OPTIONS = [
    { value: "ACTIVE", label: "Active" },
    { value: "RESOLVED", label: "Resolved" },
    { value: "CHRONIC", label: "Chronic" },
];

const SEVERITY_OPTIONS = [
    { value: "", label: "Not specified" },
    { value: "MILD", label: "Mild" },
    { value: "MODERATE", label: "Moderate" },
    { value: "SEVERE", label: "Severe" },
];

export function RecordForm({
    onSubmit,
    isLoading = false,
    onCancel,
}: RecordFormProps): React.ReactNode {
    const [recordType, setRecordType] = useState("CONDITION");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dateRecorded, setDateRecorded] = useState("");
    const [provider, setProvider] = useState("");
    const [recordStatus, setRecordStatus] = useState("ACTIVE");
    const [severity, setSeverity] = useState("");
    const [dataKey, setDataKey] = useState("");
    const [dataValue, setDataValue] = useState("");
    const [extraData, setExtraData] = useState<Record<string, string>>({});

    const addDataField = (): void => {
        if (dataKey.trim() && dataValue.trim()) {
            setExtraData((prev) => ({ ...prev, [dataKey.trim()]: dataValue.trim() }));
            setDataKey("");
            setDataValue("");
        }
    };

    const removeDataField = (key: string): void => {
        setExtraData((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        await onSubmit({
            record_type: recordType,
            title,
            description,
            date_recorded: dateRecorded || "",
            provider,
            status: recordStatus,
            severity,
            data: extraData,
        });
    };

    const canSubmit = title.trim().length > 0 && !isLoading;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Record Type */}
            <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                    Record Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {RECORD_TYPES.map((t) => (
                        <button
                            key={t.value}
                            type="button"
                            onClick={() => setRecordType(t.value)}
                            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${recordType === t.value
                                    ? "border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]"
                                    : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-gray-300"
                                }`}
                        >
                            <span className="text-base mr-1.5">{t.icon}</span>
                            <span className="text-xs font-medium">{t.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Title */}
            <Input
                label="Title"
                type="text"
                placeholder="e.g., Type 2 Diabetes, Metformin 500mg, Penicillin Allergy"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
            />

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                    Description
                </label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Additional details about this record..."
                    className="w-full h-24 px-4 py-3 rounded-lg border border-[var(--color-border)] bg-white text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] resize-none transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                    rows={3}
                />
            </div>

            {/* Date + Provider */}
            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Date Recorded"
                    type="date"
                    value={dateRecorded}
                    onChange={(e) => setDateRecorded(e.target.value)}
                />
                <Input
                    label="Healthcare Provider"
                    type="text"
                    placeholder="e.g., Dr. Smith, City Hospital"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                />
            </div>

            {/* Status + Severity */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                        Status
                    </label>
                    <select
                        value={recordStatus}
                        onChange={(e) => setRecordStatus(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-white text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    >
                        {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                        Severity
                    </label>
                    <select
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-white text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    >
                        {SEVERITY_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Extra Data Fields */}
            <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                    Additional Data (optional)
                </label>
                {Object.entries(extraData).length > 0 && (
                    <div className="space-y-1 mb-2">
                        {Object.entries(extraData).map(([k, v]) => (
                            <div key={k} className="flex items-center gap-2 text-sm">
                                <span className="font-medium text-[var(--color-text)]">{k}:</span>
                                <span className="text-[var(--color-text-secondary)]">{v}</span>
                                <button
                                    type="button"
                                    onClick={() => removeDataField(k)}
                                    className="text-red-400 hover:text-red-600 text-xs cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Key (e.g., Dosage)"
                        value={dataKey}
                        onChange={(e) => setDataKey(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm bg-white text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                    <input
                        type="text"
                        placeholder="Value (e.g., 500mg)"
                        value={dataValue}
                        onChange={(e) => setDataValue(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm bg-white text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                    <button
                        type="button"
                        onClick={addDataField}
                        disabled={!dataKey.trim() || !dataValue.trim()}
                        className="px-3 py-2 text-sm rounded-lg bg-gray-100 text-[var(--color-text)] hover:bg-gray-200 disabled:opacity-50 cursor-pointer"
                    >
                        + Add
                    </button>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
                {onCancel && (
                    <Button type="button" variant="ghost" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" variant="primary" size="lg" isLoading={isLoading} disabled={!canSubmit}>
                    Save Record
                </Button>
            </div>
        </form>
    );
}

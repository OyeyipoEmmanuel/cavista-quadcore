import React, { useCallback, useEffect, useState } from "react";
import { Card } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import {
    recordsService,
    type MedicalRecordResponse,
    type MedicalDocumentResponse,
} from "@/services/records.service";
import { RecordForm, type RecordFormData } from "./components/RecordForm";
import { DocumentUpload } from "./components/DocumentUpload";
import { RecordCard } from "./components/RecordCard";

const TYPE_FILTERS = [
    { value: "", label: "All" },
    { value: "CONDITION", label: "Conditions" },
    { value: "MEDICATION", label: "Medications" },
    { value: "ALLERGY", label: "Allergies" },
    { value: "PROCEDURE", label: "Procedures" },
    { value: "VITAL", label: "Vitals" },
    { value: "LAB_RESULT", label: "Lab Results" },
    { value: "IMMUNIZATION", label: "Immunizations" },
    { value: "FAMILY_HISTORY", label: "Family History" },
];

const DOC_TYPE_LABELS: Record<string, string> = {
    LAB_REPORT: "Lab Report",
    DISCHARGE_SUMMARY: "Discharge Summary",
    PRESCRIPTION: "Prescription",
    IMAGING: "Imaging Report",
    REFERRAL: "Referral Letter",
    INSURANCE: "Insurance",
    OTHER: "Other",
};

type ViewMode = "list" | "add" | "upload";

export function RecordsPage(): React.ReactNode {
    const [records, setRecords] = useState<MedicalRecordResponse[]>([]);
    const [documents, setDocuments] = useState<MedicalDocumentResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("list");
    const [typeFilter, setTypeFilter] = useState("");
    const [error, setError] = useState("");

    const loadRecords = useCallback(async () => {
        setIsLoading(true);
        try {
            const [recordsRes, docsRes] = await Promise.all([
                recordsService.getRecords(typeFilter || undefined),
                recordsService.getDocuments(),
            ]);
            setRecords(recordsRes.data.results ?? (recordsRes.data as unknown as MedicalRecordResponse[]));
            setDocuments(docsRes.data.results ?? (docsRes.data as unknown as MedicalDocumentResponse[]));
        } catch {
            setError("Failed to load medical records.");
        } finally {
            setIsLoading(false);
        }
    }, [typeFilter]);

    useEffect(() => {
        void loadRecords();
    }, [loadRecords]);

    const handleCreate = async (data: RecordFormData): Promise<void> => {
        setIsSaving(true);
        setError("");
        try {
            await recordsService.createRecord({
                ...data,
                date_recorded: data.date_recorded || null,
            });
            setViewMode("list");
            await loadRecords();
        } catch {
            setError("Failed to save record.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpload = async (file: File, documentType: string): Promise<void> => {
        setIsUploading(true);
        setError("");
        try {
            await recordsService.uploadDocument(file, documentType);
            setViewMode("list");
            await loadRecords();
        } catch {
            setError("Failed to upload document.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id: string): Promise<void> => {
        if (!confirm("Are you sure you want to delete this record?")) return;
        try {
            await recordsService.deleteRecord(id);
            await loadRecords();
        } catch {
            setError("Failed to delete record.");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">
                        📋 Medical Records
                    </h1>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                        Your records inform AI triage for more personalized assessments.
                    </p>
                </div>
                {viewMode === "list" && (
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setViewMode("upload")}>
                            📎 Upload PDF
                        </Button>
                        <Button variant="primary" onClick={() => setViewMode("add")}>
                            + Add Record
                        </Button>
                    </div>
                )}
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
            )}

            {/* Add Record Form */}
            {viewMode === "add" && (
                <Card>
                    <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
                        New Medical Record
                    </h2>
                    <RecordForm
                        onSubmit={handleCreate}
                        isLoading={isSaving}
                        onCancel={() => setViewMode("list")}
                    />
                </Card>
            )}

            {/* Upload Document */}
            {viewMode === "upload" && (
                <Card>
                    <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
                        Upload Medical Document
                    </h2>
                    <DocumentUpload onUpload={handleUpload} isUploading={isUploading} />
                    <div className="mt-4">
                        <Button variant="ghost" onClick={() => setViewMode("list")}>
                            ← Back to Records
                        </Button>
                    </div>
                </Card>
            )}

            {/* Records List */}
            {viewMode === "list" && (
                <>
                    {/* Filter Tabs */}
                    <div className="flex gap-1 flex-wrap">
                        {TYPE_FILTERS.map((f) => (
                            <button
                                key={f.value}
                                onClick={() => setTypeFilter(f.value)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors cursor-pointer ${typeFilter === f.value
                                        ? "bg-[var(--color-primary)] text-white"
                                        : "bg-gray-100 text-[var(--color-text-secondary)] hover:bg-gray-200"
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--color-primary)] border-t-transparent" />
                        </div>
                    ) : records.length === 0 && documents.length === 0 ? (
                        <Card>
                            <div className="text-center py-12">
                                <div className="text-4xl mb-3">📋</div>
                                <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">
                                    No Medical Records Yet
                                </h3>
                                <p className="text-sm text-[var(--color-text-secondary)] mb-4 max-w-md mx-auto">
                                    Add your conditions, medications, allergies, and more. Your records
                                    help the AI provide more accurate, personalized triage assessments.
                                </p>
                                <div className="flex gap-2 justify-center">
                                    <Button variant="ghost" onClick={() => setViewMode("upload")}>
                                        📎 Upload PDF
                                    </Button>
                                    <Button variant="primary" onClick={() => setViewMode("add")}>
                                        + Add Your First Record
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <>
                            {/* Structured Records */}
                            {records.length > 0 && (
                                <div className="space-y-3">
                                    {records.map((record) => (
                                        <RecordCard
                                            key={record.id}
                                            record={record}
                                            onDelete={handleDelete}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Uploaded Documents */}
                            {documents.length > 0 && (
                                <div className="space-y-3 mt-6">
                                    <h2 className="text-lg font-semibold text-[var(--color-text)] flex items-center gap-2">
                                        📎 Uploaded Documents
                                        <span className="text-xs font-normal text-[var(--color-text-muted)] bg-gray-100 px-2 py-0.5 rounded-full">
                                            {documents.length}
                                        </span>
                                    </h2>
                                    {documents.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className="p-4 rounded-xl border border-[var(--color-border)] bg-white hover:border-gray-300 transition-colors"
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="text-xl mt-0.5">📄</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-semibold text-sm text-[var(--color-text)] truncate">
                                                            {doc.original_filename}
                                                        </h3>
                                                        <span className="text-xs text-[var(--color-text-muted)] bg-gray-100 px-1.5 py-0.5 rounded">
                                                            {DOC_TYPE_LABELS[doc.document_type] || doc.document_type}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] mb-2">
                                                        <span>{(doc.file_size / 1024).toFixed(0)} KB</span>
                                                        <span>Uploaded {new Date(doc.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    {doc.extracted_text ? (
                                                        <div className="mt-2 p-3 rounded-lg bg-green-50 border border-green-100">
                                                            <p className="text-xs font-medium text-green-700 mb-1">
                                                                ✅ Text extracted — AI can use this
                                                            </p>
                                                            <p className="text-xs text-green-600 line-clamp-3">
                                                                {doc.extracted_text.substring(0, 300)}
                                                                {doc.extracted_text.length > 300 ? "..." : ""}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                                            ⚠️ No text could be extracted from this document.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
}

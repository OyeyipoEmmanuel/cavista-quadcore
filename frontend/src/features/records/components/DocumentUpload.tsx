import React, { useRef, useState } from "react";

interface DocumentUploadProps {
    onUpload: (file: File, documentType: string) => Promise<void>;
    isUploading?: boolean;
}

const DOCUMENT_TYPES = [
    { value: "LAB_REPORT", label: "Lab Report" },
    { value: "DISCHARGE_SUMMARY", label: "Discharge Summary" },
    { value: "PRESCRIPTION", label: "Prescription" },
    { value: "IMAGING", label: "Imaging Report" },
    { value: "REFERRAL", label: "Referral Letter" },
    { value: "INSURANCE", label: "Insurance Document" },
    { value: "OTHER", label: "Other" },
];

export function DocumentUpload({
    onUpload,
    isUploading = false,
}: DocumentUploadProps): React.ReactNode {
    const [documentType, setDocumentType] = useState("OTHER");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File | null): void => {
        if (!file) {
            setSelectedFile(null);
            return;
        }
        if (file.size > 20 * 1024 * 1024) {
            alert("File must be smaller than 20MB.");
            return;
        }
        setSelectedFile(file);
    };

    const handleDrop = (e: React.DragEvent): void => {
        e.preventDefault();
        setIsDragging(false);
        handleFile(e.dataTransfer.files[0] || null);
    };

    const handleUpload = async (): Promise<void> => {
        if (!selectedFile) return;
        await onUpload(selectedFile, documentType);
        setSelectedFile(null);
    };

    return (
        <div className="space-y-4">
            {/* Document Type */}
            <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                    Document Type
                </label>
                <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-white text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                    {DOCUMENT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                </select>
            </div>

            {/* Drop Zone */}
            {selectedFile ? (
                <div className="p-4 rounded-lg border border-[var(--color-border)] bg-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">📄</span>
                            <div>
                                <p className="text-sm font-medium text-[var(--color-text)]">
                                    {selectedFile.name}
                                </p>
                                <p className="text-xs text-[var(--color-text-muted)]">
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedFile(null)}
                                className="px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-gray-50 cursor-pointer"
                            >
                                Remove
                            </button>
                            <button
                                type="button"
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="px-4 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] disabled:opacity-50 cursor-pointer"
                            >
                                {isUploading ? "Uploading..." : "Upload"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center py-10 px-6 rounded-lg border-2 border-dashed transition-colors cursor-pointer ${isDragging
                            ? "border-[var(--color-primary)] bg-blue-50"
                            : "border-[var(--color-border)] hover:border-gray-400 bg-[var(--color-surface-alt)]"
                        }`}
                >
                    <div className="text-3xl mb-3">📎</div>
                    <p className="text-sm font-medium text-[var(--color-text)]">
                        Drop a PDF here or click to browse
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        Medical records, lab reports, discharge summaries — PDF, max 20MB
                    </p>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
            />

            <p className="text-xs text-[var(--color-text-muted)]">
                📜 Text will be automatically extracted from PDFs to help the AI understand your medical history.
            </p>
        </div>
    );
}

import api from "@/services/api";

export interface MedicalRecordResponse {
    id: string;
    record_type: string;
    title: string;
    description: string;
    date_recorded: string | null;
    provider: string;
    status: string;
    severity: string;
    data: Record<string, unknown>;
    documents: MedicalDocumentResponse[];
    created_at: string;
    updated_at: string;
}

export interface MedicalDocumentResponse {
    id: string;
    document_type: string;
    original_filename: string;
    file_size: number;
    extracted_text: string;
    created_at: string;
}

export interface CreateRecordPayload {
    record_type: string;
    title: string;
    description?: string;
    date_recorded?: string | null;
    provider?: string;
    status?: string;
    severity?: string;
    data?: Record<string, unknown>;
}

export const recordsService = {
    getRecords: (type?: string): Promise<{ data: { results: MedicalRecordResponse[] } }> => {
        const params = type ? `?type=${type}` : "";
        return api.get(`/records/${params}`);
    },

    getRecord: (id: string): Promise<{ data: MedicalRecordResponse }> =>
        api.get(`/records/${id}/`),

    createRecord: (data: CreateRecordPayload): Promise<{ data: MedicalRecordResponse }> =>
        api.post("/records/", data),

    updateRecord: (
        id: string,
        data: Partial<CreateRecordPayload>
    ): Promise<{ data: MedicalRecordResponse }> =>
        api.patch(`/records/${id}/`, data),

    deleteRecord: (id: string): Promise<void> =>
        api.delete(`/records/${id}/`),

    getDocuments: (): Promise<{ data: { results: MedicalDocumentResponse[] } }> =>
        api.get("/records/documents/"),

    uploadDocument: (
        file: File,
        documentType: string = "OTHER",
        recordId?: string
    ): Promise<{ data: MedicalDocumentResponse }> => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("document_type", documentType);
        if (recordId) formData.append("record_id", recordId);
        return api.post("/records/documents/upload/", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },

    getMedicalContext: (): Promise<{ data: { context: string } }> =>
        api.get("/records/context/"),
};

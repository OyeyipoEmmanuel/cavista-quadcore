import api from "./api";

export interface ClinicianProfile {
    id: string;
    specialty: string;
    bio: string;
    is_available: boolean;
    user: {
        id: string;
        first_name: string;
        last_name: string;
        full_name: string;
        email: string;
    };
}

export interface Appointment {
    id: string;
    patient: any;
    clinician: ClinicianProfile;
    status: string;
    scheduled_at: string;
    notes: string;
    created_at: string;
}

export const clinicianService = {
    getAvailableClinicians: async (): Promise<ClinicianProfile[]> => {
        const response = await api.get("/clinicians/");
        return response.data;
    },

    bookAppointment: async (data: {
        clinician_id: string;
        scheduled_at: string;
        triage_session_id?: string;
        notes?: string;
    }): Promise<Appointment> => {
        const response = await api.post("/clinicians/appointments/book/", data);
        return response.data;
    },

    getPatientAppointments: async (): Promise<Appointment[]> => {
        const response = await api.get("/clinicians/appointments/");
        return response.data;
    },

    getClinicianBookings: async (): Promise<Appointment[]> => {
        const response = await api.get("/clinicians/appointments/clinician/");
        return response.data;
    },
};

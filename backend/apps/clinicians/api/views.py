from rest_framework import generics, status, permissions
from rest_framework.response import Response
from apps.clinicians.api.serializers import ClinicianProfileSerializer, AppointmentSerializer
from apps.clinicians.services.appointment_service import AppointmentService

class ClinicianListView(generics.ListAPIView):
    """
    Returns a list of all available clinicians.
    """
    serializer_class = ClinicianProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AppointmentService.get_available_clinicians()

class AppointmentCreateView(generics.CreateAPIView):
    """
    Allows a patient to book an appointment.
    """
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        data = serializer.validated_data
        AppointmentService.create_appointment(
            patient=self.request.user,
            clinician_profile_id=data["clinician_id"],
            scheduled_at=data["scheduled_at"],
            triage_session_id=data.get("triage_session_id"),
            notes=data.get("notes", "")
        )

class PatientAppointmentListView(generics.ListAPIView):
    """
    Returns all appointments for the current patient.
    """
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AppointmentService.get_patient_appointments(self.request.user)

class ClinicianBookingListView(generics.ListAPIView):
    """
    Returns all bookings for the current clinician.
    """
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AppointmentService.get_clinician_appointments(self.request.user)

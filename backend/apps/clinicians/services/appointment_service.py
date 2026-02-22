import logging
from datetime import datetime
from django.db import transaction
from apps.clinicians.models.appointment import Appointment
from apps.clinicians.models.clinician_profile import ClinicianProfile
from apps.triage.models.triage_session import TriageSession

logger = logging.getLogger(__name__)

class AppointmentService:
    @staticmethod
    def get_available_clinicians():
        """Returns a list of clinicians who are marked as available."""
        return ClinicianProfile.objects.filter(is_available=True, is_deleted=False)

    @staticmethod
    @transaction.atomic
    def create_appointment(patient, clinician_profile_id, scheduled_at, triage_session_id=None, notes=""):
        """Creates a new appointment for a patient."""
        clinician = ClinicianProfile.objects.get(id=clinician_profile_id)
        
        triage_session = None
        if triage_session_id:
            triage_session = TriageSession.objects.get(id=triage_session_id)

        appointment = Appointment.objects.create(
            patient=patient,
            clinician=clinician,
            triage_session=triage_session,
            scheduled_at=scheduled_at,
            notes=notes,
            created_by=patient
        )
        
        logger.info(f"Created appointment {appointment.id} for patient {patient.id}")
        return appointment

    @staticmethod
    def get_clinician_appointments(clinician_user):
        """Returns all appointments for a specific clinician user."""
        try:
            profile = clinician_user.clinician_profile
            return Appointment.objects.filter(clinician=profile, is_deleted=False).order_by("scheduled_at")
        except ClinicianProfile.DoesNotExist:
            return Appointment.objects.none()

    @staticmethod
    def get_patient_appointments(patient_user):
        """Returns all appointments for a specific patient user."""
        return Appointment.objects.filter(patient=patient_user, is_deleted=False).order_by("scheduled_at")

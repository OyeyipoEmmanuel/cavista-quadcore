from django.conf import settings
from django.db import models
from apps.common.models.base import BaseModel
from apps.clinicians.models.clinician_profile import ClinicianProfile
from apps.triage.models.triage_session import TriageSession

class Appointment(BaseModel):
    """
    Represents a booking between a patient and a clinician.
    """
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        CONFIRMED = "CONFIRMED", "Confirmed"
        CANCELLED = "CANCELLED", "Cancelled"
        COMPLETED = "COMPLETED", "Completed"

    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="patient_appointments",
        limit_choices_to={"role": "PATIENT"}
    )
    clinician = models.ForeignKey(
        ClinicianProfile,
        on_delete=models.CASCADE,
        related_name="appointments"
    )
    triage_session = models.ForeignKey(
        TriageSession,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="appointments",
        help_text="The triage session that led to this booking."
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    scheduled_at = models.DateTimeField()
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "appointments"
        verbose_name = "Appointment"
        verbose_name_plural = "Appointments"
        ordering = ["scheduled_at"]

    def __str__(self):
        return f"{self.patient.full_name} with {self.clinician} at {self.scheduled_at}"

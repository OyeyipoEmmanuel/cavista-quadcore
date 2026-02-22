import uuid

from django.conf import settings
from django.db import models

from apps.common.models.base import BaseModel


class FirstAidPrescription(BaseModel):
    """
    AI-generated first aid drug recommendation.

    These are TEMPORARY symptom-relief suggestions only.
    NOT a substitute for professional medical evaluation.
    """

    class Urgency(models.TextChoices):
        LOW = "LOW", "Low — mild discomfort"
        MODERATE = "MODERATE", "Moderate — noticeable symptoms"
        HIGH = "HIGH", "High — significant pain or distress"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="prescriptions",
    )
    triage_session = models.ForeignKey(
        "triage.TriageSession",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="prescriptions",
    )
    symptoms_text = models.TextField(
        help_text="Symptoms the patient described.",
    )
    urgency = models.CharField(
        max_length=10,
        choices=Urgency.choices,
        default=Urgency.MODERATE,
    )
    drugs = models.JSONField(
        default=list,
        help_text="List of recommended OTC drugs with dosage info.",
    )
    warnings = models.JSONField(
        default=list,
        help_text="Warnings based on patient's medical history (allergies, interactions).",
    )
    disclaimer = models.TextField(
        default=(
            "⚠️ IMPORTANT: These recommendations are for TEMPORARY symptom relief only. "
            "They are NOT a substitute for professional medical diagnosis or treatment. "
            "You MUST visit a hospital or consult a healthcare professional as soon as possible. "
            "Do NOT rely solely on these suggestions. If symptoms worsen, seek emergency care immediately."
        ),
    )
    medical_context_used = models.BooleanField(
        default=False,
        help_text="Whether patient medical records were considered.",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"First Aid Rx for {self.user} — {self.urgency}"

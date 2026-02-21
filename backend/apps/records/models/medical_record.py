import uuid

from django.conf import settings
from django.db import models

from apps.common.encryption import EncryptedTextField
from apps.common.models.base import BaseModel


class MedicalRecord(BaseModel):
    """
    A structured medical record entry for a patient.
    Covers conditions, medications, allergies, procedures, vitals, lab results.
    """

    class RecordType(models.TextChoices):
        CONDITION = "CONDITION", "Condition / Diagnosis"
        MEDICATION = "MEDICATION", "Medication"
        ALLERGY = "ALLERGY", "Allergy"
        PROCEDURE = "PROCEDURE", "Procedure"
        VITAL = "VITAL", "Vital Sign"
        LAB_RESULT = "LAB_RESULT", "Lab Result"
        IMMUNIZATION = "IMMUNIZATION", "Immunization"
        FAMILY_HISTORY = "FAMILY_HISTORY", "Family History"
        OTHER = "OTHER", "Other"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        RESOLVED = "RESOLVED", "Resolved"
        CHRONIC = "CHRONIC", "Chronic"

    class Severity(models.TextChoices):
        MILD = "MILD", "Mild"
        MODERATE = "MODERATE", "Moderate"
        SEVERE = "SEVERE", "Severe"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="medical_records",
    )
    record_type = models.CharField(
        max_length=30,
        choices=RecordType.choices,
        db_index=True,
    )
    title = models.CharField(max_length=255)
    description = EncryptedTextField(blank=True, default="")
    date_recorded = models.DateField(
        null=True,
        blank=True,
        help_text="When the condition was diagnosed or the event occurred.",
    )
    provider = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Healthcare provider or facility name.",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    severity = models.CharField(
        max_length=20,
        choices=Severity.choices,
        blank=True,
        default="",
    )
    data = models.JSONField(
        default=dict,
        blank=True,
        help_text="Flexible key-value data (dosage, frequency, values, etc.).",
    )

    class Meta:
        ordering = ["-date_recorded", "-created_at"]
        indexes = [
            models.Index(fields=["user", "record_type"]),
            models.Index(fields=["user", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.record_type}: {self.title}"


class MedicalDocument(BaseModel):
    """
    An uploaded medical document (PDF, image).
    Extracted text is stored encrypted for AI context.
    """

    class DocumentType(models.TextChoices):
        LAB_REPORT = "LAB_REPORT", "Lab Report"
        DISCHARGE_SUMMARY = "DISCHARGE_SUMMARY", "Discharge Summary"
        PRESCRIPTION = "PRESCRIPTION", "Prescription"
        IMAGING = "IMAGING", "Imaging Report"
        REFERRAL = "REFERRAL", "Referral Letter"
        INSURANCE = "INSURANCE", "Insurance Document"
        OTHER = "OTHER", "Other"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="medical_documents",
    )
    record = models.ForeignKey(
        MedicalRecord,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents",
        help_text="Optional link to a structured record.",
    )
    file = models.FileField(upload_to="records/documents/%Y/%m/%d/")
    original_filename = models.CharField(max_length=255)
    document_type = models.CharField(
        max_length=30,
        choices=DocumentType.choices,
        default=DocumentType.OTHER,
    )
    extracted_text = EncryptedTextField(
        blank=True,
        default="",
        help_text="Text extracted from the document for AI context.",
    )
    file_size = models.PositiveIntegerField(
        default=0,
        help_text="File size in bytes.",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.document_type}: {self.original_filename}"

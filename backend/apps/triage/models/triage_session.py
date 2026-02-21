import uuid

from django.conf import settings
from django.db import models

from apps.common.models.base import BaseModel


class TriageSession(BaseModel):
    """
    A single triage session initiated by a patient.
    Tracks the input modality and processing status.
    """

    class Source(models.TextChoices):
        TEXT = "TEXT", "Text"
        IMAGE = "IMAGE", "Image"
        MULTIMODAL = "MULTIMODAL", "Multimodal"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PROCESSING = "PROCESSING", "Processing"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="triage_sessions",
    )
    source = models.CharField(
        max_length=20,
        choices=Source.choices,
        default=Source.TEXT,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    symptoms_text = models.TextField(blank=True, default="")
    inference_mode = models.CharField(
        max_length=20,
        choices=[("CLIENT", "Client-Side"), ("SERVER", "Server-Side")],
        default="CLIENT",
        help_text="Whether inference ran on-device or server fallback.",
    )
    model_version = models.CharField(max_length=100, blank=True, default="")
    device_info = models.JSONField(
        default=dict,
        blank=True,
        help_text="Client device capabilities (WebGPU, RAM, etc.)",
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"Triage {self.id} — {self.source} ({self.status})"


class TriageResult(BaseModel):
    """
    AI inference output for a triage session.
    Stores diagnosis, severity, confidence, recommendations,
    and explainability metadata.
    """

    class Severity(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"
        CRITICAL = "CRITICAL", "Critical"

    session = models.OneToOneField(
        TriageSession,
        on_delete=models.CASCADE,
        related_name="result",
    )
    diagnosis = models.TextField(
        help_text="Primary diagnosis or assessment summary.",
    )
    severity = models.CharField(
        max_length=20,
        choices=Severity.choices,
    )
    confidence_score = models.FloatField(
        help_text="Model confidence 0.0 — 1.0",
    )
    recommendations = models.JSONField(
        default=list,
        help_text="List of recommended actions.",
    )
    differential_diagnoses = models.JSONField(
        default=list,
        help_text="Alternative diagnoses with confidence scores.",
    )
    explainability = models.JSONField(
        default=dict,
        help_text="XAI data: contributing factors, feature importance.",
    )
    raw_model_output = models.JSONField(
        default=dict,
        blank=True,
        help_text="Raw model response for debugging.",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Result for {self.session_id} — {self.severity}"


class ImageAnalysis(BaseModel):
    """
    Image uploaded for visual diagnostic analysis.
    Stores the image, classification result, and vision model metadata.
    """

    session = models.ForeignKey(
        TriageSession,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image = models.ImageField(
        upload_to="triage/images/%Y/%m/%d/",
    )
    original_filename = models.CharField(max_length=255, blank=True, default="")
    classification = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Predicted classification label.",
    )
    classification_confidence = models.FloatField(
        null=True,
        blank=True,
        help_text="Vision model confidence 0.0 — 1.0",
    )
    vision_model_version = models.CharField(
        max_length=100,
        blank=True,
        default="",
    )
    analysis_metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional vision analysis data.",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Image {self.id} for session {self.session_id}"

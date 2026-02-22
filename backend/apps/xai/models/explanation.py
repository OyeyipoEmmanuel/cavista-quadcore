import uuid

from django.db import models

from apps.common.models.base import BaseModel


class Explanation(BaseModel):
    """
    Structured XAI explanation for a triage result.
    Stores SHAP/LIME output, feature importance rankings,
    and human-readable summary for clinicians and patients.
    """

    class Method(models.TextChoices):
        SHAP = "SHAP", "SHAP (Shapley Additive Explanations)"
        LIME = "LIME", "LIME (Local Interpretable Model-agnostic Explanations)"
        ATTENTION = "ATTENTION", "Attention-Based"
        RULE_BASED = "RULE_BASED", "Rule-Based Analysis"

    triage_result = models.OneToOneField(
        "triage.TriageResult",
        on_delete=models.CASCADE,
        related_name="xai_explanation",
    )
    method = models.CharField(
        max_length=20,
        choices=Method.choices,
        default=Method.SHAP,
        db_index=True,
    )
    summary = models.TextField(
        help_text="Human-readable explanation of the AI decision.",
    )
    global_feature_importance = models.JSONField(
        default=list,
        help_text="Ranked list of features by overall importance.",
    )
    model_version = models.CharField(
        max_length=100,
        blank=True,
        default="",
    )
    computation_time_ms = models.IntegerField(
        null=True,
        blank=True,
        help_text="Time taken to generate this explanation in milliseconds.",
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional XAI metadata (thresholds, baselines, etc.).",
    )

    class Meta:
        db_table = "xai_explanations"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.method} explanation for result {self.triage_result_id}"


class FeatureContribution(models.Model):
    """
    Individual feature's contribution to a prediction.
    Represents a single SHAP value or LIME weight.
    """

    class Category(models.TextChoices):
        SYMPTOM = "SYMPTOM", "Symptom"
        VITAL_SIGN = "VITAL_SIGN", "Vital Sign"
        BIOMARKER = "BIOMARKER", "Biomarker"
        HISTORY = "HISTORY", "Medical History"
        IMAGE = "IMAGE", "Image Feature"
        DEMOGRAPHIC = "DEMOGRAPHIC", "Demographic"

    class Direction(models.TextChoices):
        POSITIVE = "POSITIVE", "Increases risk / supports diagnosis"
        NEGATIVE = "NEGATIVE", "Decreases risk / contradicts diagnosis"
        NEUTRAL = "NEUTRAL", "Minimal impact"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    explanation = models.ForeignKey(
        Explanation,
        on_delete=models.CASCADE,
        related_name="feature_contributions",
    )
    feature_name = models.CharField(
        max_length=255,
        help_text="Machine-readable feature identifier.",
    )
    feature_category = models.CharField(
        max_length=20,
        choices=Category.choices,
        db_index=True,
    )
    contribution_score = models.FloatField(
        help_text="SHAP value: positive pushes toward diagnosis, negative away. Range -1.0 to 1.0.",
    )
    direction = models.CharField(
        max_length=10,
        choices=Direction.choices,
    )
    display_name = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Human-readable feature name (e.g. 'Headache Severity').",
    )
    display_value = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Human-readable value (e.g. 'Severe', '140/90 mmHg').",
    )
    description = models.TextField(
        blank=True,
        default="",
        help_text="Natural language explanation of this feature's impact.",
    )
    rank = models.IntegerField(
        default=0,
        help_text="Importance rank (1 = most important).",
    )

    class Meta:
        db_table = "xai_feature_contributions"
        ordering = ["rank"]

    def __str__(self):
        return f"{self.feature_name}: {self.contribution_score:+.3f} ({self.direction})"

from rest_framework import serializers

from apps.triage.models.triage_session import (
    ImageAnalysis,
    TriageResult,
    TriageSession,
)


class ImageAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImageAnalysis
        fields = [
            "id",
            "classification",
            "classification_confidence",
            "vision_model_version",
            "analysis_metadata",
            "original_filename",
            "created_at",
        ]
        read_only_fields = fields


class TriageResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = TriageResult
        fields = [
            "id",
            "diagnosis",
            "severity",
            "confidence_score",
            "recommendations",
            "differential_diagnoses",
            "explainability",
            "created_at",
        ]
        read_only_fields = fields


class TriageSessionSerializer(serializers.ModelSerializer):
    result = TriageResultSerializer(read_only=True)
    images = ImageAnalysisSerializer(many=True, read_only=True)

    class Meta:
        model = TriageSession
        fields = [
            "id",
            "source",
            "status",
            "symptoms_text",
            "inference_mode",
            "model_version",
            "device_info",
            "result",
            "images",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "result",
            "images",
            "created_at",
            "updated_at",
        ]


class CreateSessionSerializer(serializers.Serializer):
    symptoms_text = serializers.CharField(required=False, allow_blank=True, default="")
    source = serializers.ChoiceField(
        choices=TriageSession.Source.choices,
        default=TriageSession.Source.TEXT,
    )
    inference_mode = serializers.ChoiceField(
        choices=[("CLIENT", "Client-Side"), ("SERVER", "Server-Side")],
        default="CLIENT",
    )
    model_version = serializers.CharField(required=False, allow_blank=True, default="")
    device_info = serializers.JSONField(required=False, default=dict)


class SaveResultSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()
    diagnosis = serializers.CharField()
    severity = serializers.ChoiceField(choices=TriageResult.Severity.choices)
    confidence_score = serializers.FloatField(min_value=0.0, max_value=1.0)
    recommendations = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list,
    )
    differential_diagnoses = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list,
    )
    explainability = serializers.DictField(required=False, default=dict)
    raw_model_output = serializers.DictField(required=False, default=dict)


class ServerInferenceSerializer(serializers.Serializer):
    """Request serializer for fallback server-side inference."""
    symptoms_text = serializers.CharField(required=False, allow_blank=True, default="")
    source = serializers.ChoiceField(
        choices=TriageSession.Source.choices,
        default=TriageSession.Source.TEXT,
    )

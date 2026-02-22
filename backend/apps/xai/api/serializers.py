from rest_framework import serializers

from apps.xai.models.explanation import Explanation, FeatureContribution


class FeatureContributionSerializer(serializers.ModelSerializer):
    """Serializer for individual feature contributions."""

    category_display = serializers.CharField(
        source="get_feature_category_display", read_only=True
    )
    direction_display = serializers.CharField(
        source="get_direction_display", read_only=True
    )

    class Meta:
        model = FeatureContribution
        fields = [
            "id",
            "feature_name",
            "feature_category",
            "category_display",
            "contribution_score",
            "direction",
            "direction_display",
            "display_name",
            "display_value",
            "description",
            "rank",
        ]
        read_only_fields = fields


class ExplanationSerializer(serializers.ModelSerializer):
    """Serializer for XAI explanations."""

    feature_contributions = FeatureContributionSerializer(many=True, read_only=True)
    method_display = serializers.CharField(
        source="get_method_display", read_only=True
    )

    class Meta:
        model = Explanation
        fields = [
            "id",
            "triage_result_id",
            "method",
            "method_display",
            "summary",
            "global_feature_importance",
            "model_version",
            "computation_time_ms",
            "metadata",
            "feature_contributions",
            "created_at",
        ]
        read_only_fields = fields


class ExplanationSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer without nested contributions."""

    method_display = serializers.CharField(
        source="get_method_display", read_only=True
    )

    class Meta:
        model = Explanation
        fields = [
            "id",
            "triage_result_id",
            "method",
            "method_display",
            "summary",
            "global_feature_importance",
            "model_version",
            "computation_time_ms",
            "created_at",
        ]
        read_only_fields = fields

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsClinician
from apps.triage.models.triage_session import TriageSession
from apps.xai.api.serializers import (
    ExplanationSerializer,
    FeatureContributionSerializer,
)
from apps.xai.services.xai_service import XAIService


class ExplanationView(APIView):
    """
    GET — Retrieve or generate an XAI explanation for a triage session.

    If an explanation already exists, returns it.
    If not, generates one on-the-fly using SHAP analysis.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        session = TriageSession.objects.filter(
            id=session_id,
            user=request.user,
            is_deleted=False,
        ).select_related("result").first()

        if not session:
            return Response(
                {"error": "Triage session not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not hasattr(session, "result") or session.result is None:
            return Response(
                {"error": "No triage result available for this session."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Get or generate explanation
        explanation = XAIService.get_explanation(session.result)
        if not explanation:
            explanation = XAIService.generate_explanation(
                triage_result=session.result,
                method="SHAP",
                user=request.user,
                ip_address=request.META.get("REMOTE_ADDR"),
            )
            # Reload with prefetched contributions
            explanation = XAIService.get_explanation(session.result)

        serializer = ExplanationSerializer(explanation)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ClinicalExplanationView(APIView):
    """
    GET — Clinical decision support view for healthcare providers.

    Returns a structured breakdown grouped by feature category,
    with top contributors, risk factors, and protective factors.
    Restricted to CLINICIAN role.
    """

    permission_classes = [IsAuthenticated, IsClinician]

    def get(self, request, session_id):
        # Clinicians can view any session (not restricted to their own)
        session = TriageSession.objects.filter(
            id=session_id,
            is_deleted=False,
        ).select_related("result").first()

        if not session:
            return Response(
                {"error": "Triage session not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not hasattr(session, "result") or session.result is None:
            return Response(
                {"error": "No triage result available for this session."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Get or generate explanation
        explanation = XAIService.get_explanation(session.result)
        if not explanation:
            explanation = XAIService.generate_explanation(
                triage_result=session.result,
                method="SHAP",
                user=request.user,
                ip_address=request.META.get("REMOTE_ADDR"),
            )
            explanation = XAIService.get_explanation(session.result)

        clinical_data = XAIService.get_clinical_summary(explanation)

        # Augment with session metadata
        clinical_data["session"] = {
            "id": str(session.id),
            "symptoms_text": session.symptoms_text,
            "source": session.source,
            "inference_mode": session.inference_mode,
            "diagnosis": session.result.diagnosis,
            "severity": session.result.severity,
            "confidence_score": session.result.confidence_score,
            "recommendations": session.result.recommendations,
            "differential_diagnoses": session.result.differential_diagnoses,
        }

        return Response(clinical_data, status=status.HTTP_200_OK)


class FeatureContributionsView(APIView):
    """
    GET — Feature importance breakdown for a triage session.

    Returns individual feature contributions sorted by importance rank.
    Supports optional filtering by category.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        session = TriageSession.objects.filter(
            id=session_id,
            user=request.user,
            is_deleted=False,
        ).select_related("result").first()

        if not session:
            return Response(
                {"error": "Triage session not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not hasattr(session, "result") or session.result is None:
            return Response(
                {"error": "No triage result available for this session."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Get or generate explanation
        explanation = XAIService.get_explanation(session.result)
        if not explanation:
            explanation = XAIService.generate_explanation(
                triage_result=session.result,
                method="SHAP",
                user=request.user,
                ip_address=request.META.get("REMOTE_ADDR"),
            )
            explanation = XAIService.get_explanation(session.result)

        contributions = explanation.feature_contributions.all()

        # Optional filter by category
        category = request.query_params.get("category")
        if category:
            contributions = contributions.filter(feature_category=category.upper())

        serializer = FeatureContributionSerializer(contributions, many=True)

        return Response(
            {
                "explanation_id": str(explanation.id),
                "method": explanation.method,
                "total_features": explanation.feature_contributions.count(),
                "features": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

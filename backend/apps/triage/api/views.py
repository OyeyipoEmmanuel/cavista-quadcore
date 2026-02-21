from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

from apps.common.permissions import IsPatient, IsClinician
from apps.triage.models.triage_session import TriageSession
from apps.triage.services.triage_service import TriageService
from apps.triage.api.serializers import (
    CreateSessionSerializer,
    SaveResultSerializer,
    ServerInferenceSerializer,
    TriageSessionSerializer,
)


class TriageSessionListCreateView(generics.ListCreateAPIView):
    """
    GET  — list the authenticated user's triage sessions.
    POST — create a new triage session.
    """

    serializer_class = TriageSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TriageService.get_user_sessions(self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = CreateSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        session = TriageService.create_session(
            user=request.user,
            symptoms_text=data["symptoms_text"],
            source=data["source"],
            inference_mode=data["inference_mode"],
            model_version=data["model_version"],
            device_info=data["device_info"],
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )

        return Response(
            TriageSessionSerializer(session).data,
            status=status.HTTP_201_CREATED,
        )


class TriageSessionDetailView(generics.RetrieveAPIView):
    """GET — retrieve a single triage session with results."""

    serializer_class = TriageSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return TriageService.get_session_detail(
            session_id=self.kwargs["session_id"],
            user=self.request.user,
        )


class TriageResultCreateView(APIView):
    """
    POST — save a client-side inference result.
    Called by the frontend after in-browser MedGemma inference.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SaveResultSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        session = TriageSession.objects.filter(
            id=data["session_id"],
            user=request.user,
        ).first()

        if not session:
            return Response(
                {"error": "Session not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        result = TriageService.save_result(
            session=session,
            diagnosis=data["diagnosis"],
            severity=data["severity"],
            confidence_score=data["confidence_score"],
            recommendations=data["recommendations"],
            differential_diagnoses=data["differential_diagnoses"],
            explainability=data["explainability"],
            raw_model_output=data["raw_model_output"],
            user=request.user,
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )

        return Response(
            {"id": str(result.id), "status": "saved"},
            status=status.HTTP_201_CREATED,
        )


class TriageInferenceView(APIView):
    """
    POST — fallback server-side inference.
    Used when the client device does not support WebGPU.
    For MVP, returns a structured placeholder response.
    Full inference will be integrated when the model service is deployed.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ServerInferenceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Create session
        session = TriageService.create_session(
            user=request.user,
            symptoms_text=data["symptoms_text"],
            source=data["source"],
            inference_mode="SERVER",
            model_version="medgemma-4b-server-v1",
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )

        # MVP: return structured placeholder inference
        # TODO: Replace with actual transformers inference pipeline
        result = TriageService.save_result(
            session=session,
            diagnosis=(
                "Based on the symptoms provided, this appears to require "
                "further clinical evaluation. Please consult a healthcare "
                "professional for a definitive diagnosis."
            ),
            severity="MEDIUM",
            confidence_score=0.65,
            recommendations=[
                "Schedule an appointment with your primary care physician",
                "Monitor symptoms and note any changes",
                "Stay hydrated and get adequate rest",
                "Seek emergency care if symptoms worsen significantly",
            ],
            differential_diagnoses=[
                {"condition": "Common condition A", "confidence": 0.65},
                {"condition": "Common condition B", "confidence": 0.20},
                {"condition": "Common condition C", "confidence": 0.15},
            ],
            explainability={
                "contributing_factors": [
                    "Symptom description analysis",
                    "Pattern matching against clinical guidelines",
                ],
                "model": "medgemma-4b-server-v1",
                "note": "Server-side fallback inference (placeholder for MVP)",
            },
            user=request.user,
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )

        return Response(
            TriageSessionSerializer(
                TriageService.get_session_detail(
                    session_id=str(session.id),
                    user=request.user,
                )
            ).data,
            status=status.HTTP_201_CREATED,
        )


class ImageUploadView(APIView):
    """POST — upload an image for vision analysis."""

    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        session_id = request.data.get("session_id")
        image = request.FILES.get("image")

        if not session_id or not image:
            return Response(
                {"error": "session_id and image are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session = TriageSession.objects.filter(
            id=session_id,
            user=request.user,
        ).first()

        if not session:
            return Response(
                {"error": "Session not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        analysis = TriageService.save_image_analysis(
            session=session,
            image=image,
            original_filename=image.name,
        )

        return Response(
            {"id": str(analysis.id), "status": "uploaded"},
            status=status.HTTP_201_CREATED,
        )

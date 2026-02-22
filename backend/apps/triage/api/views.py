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
    POST — Server-side AI inference using Google Gemini (MedGemma).
    Sends patient symptoms + medical history to AI and returns structured diagnosis.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ServerInferenceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Fetch patient medical context
        from apps.records.services.record_service import RecordService
        from apps.triage.services.gemini_service import GeminiService

        medical_context = RecordService.get_patient_medical_context(request.user)

        # Run AI inference via Gemini
        ai_result = GeminiService.run_inference(
            symptoms_text=data["symptoms_text"],
            medical_context=medical_context or "",
        )

        # Create session
        session = TriageService.create_session(
            user=request.user,
            symptoms_text=data["symptoms_text"],
            source=data["source"],
            inference_mode="SERVER",
            model_version="gemini-2.0-flash",
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )

        # Add medical context info to explainability
        explainability = ai_result.get("explainability", {})
        if medical_context:
            factors = explainability.get("contributing_factors", [])
            if "Patient medical history considered" not in factors:
                factors.append("Patient medical history considered")
            explainability["contributing_factors"] = factors
            explainability["medical_context_available"] = True

        # Save AI result
        result = TriageService.save_result(
            session=session,
            diagnosis=ai_result["diagnosis"],
            severity=ai_result["severity"],
            confidence_score=ai_result["confidence_score"],
            recommendations=ai_result["recommendations"],
            differential_diagnoses=ai_result["differential_diagnoses"],
            explainability=explainability,
            raw_model_output=ai_result.get("raw_model_output", ""),
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

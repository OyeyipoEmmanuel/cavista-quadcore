from django.db import transaction

from apps.audit.services.audit_service import AuditService
from apps.triage.models.triage_session import (
    ImageAnalysis,
    TriageResult,
    TriageSession,
)
from apps.xai.services.xai_service import XAIService


class TriageService:
    """
    Business logic for the triage engine.
    Handles session lifecycle, result persistence, and fallback inference.
    """

    @staticmethod
    def create_session(
        user,
        symptoms_text: str = "",
        source: str = "TEXT",
        inference_mode: str = "CLIENT",
        model_version: str = "",
        device_info: dict = None,
        ip_address: str = None,
        user_agent: str = "",
    ) -> TriageSession:
        """Create a new triage session and log to audit trail."""
        session = TriageSession.objects.create(
            user=user,
            symptoms_text=symptoms_text,
            source=source,
            status=TriageSession.Status.PROCESSING,
            inference_mode=inference_mode,
            model_version=model_version,
            device_info=device_info or {},
            created_by=user,
        )

        AuditService.log_action(
            user_id=str(user.id),
            action="TRIAGE_SESSION_CREATED",
            resource_type="TriageSession",
            resource_id=str(session.id),
            ip_address=ip_address,
            user_agent=user_agent,
            changes={"source": source, "inference_mode": inference_mode},
        )

        return session

    @staticmethod
    @transaction.atomic
    def save_result(
        session: TriageSession,
        diagnosis: str,
        severity: str,
        confidence_score: float,
        recommendations: list = None,
        differential_diagnoses: list = None,
        explainability: dict = None,
        raw_model_output: dict = None,
        user=None,
        ip_address: str = None,
        user_agent: str = "",
    ) -> TriageResult:
        """
        Persist an AI inference result (from client-side or server-side).
        Updates the session status to COMPLETED.
        Auto-generates an XAI explanation after saving.
        """
        result = TriageResult.objects.create(
            session=session,
            diagnosis=diagnosis,
            severity=severity,
            confidence_score=confidence_score,
            recommendations=recommendations or [],
            differential_diagnoses=differential_diagnoses or [],
            explainability=explainability or {},
            raw_model_output=raw_model_output or {},
            created_by=user or session.user,
        )

        session.status = TriageSession.Status.COMPLETED
        session.save(update_fields=["status", "updated_at"])

        AuditService.log_action(
            user_id=str(session.user_id),
            action="TRIAGE_RESULT_SAVED",
            resource_type="TriageResult",
            resource_id=str(result.id),
            ip_address=ip_address,
            user_agent=user_agent,
            changes={"severity": severity, "confidence": confidence_score},
        )

        # Auto-generate XAI explanation
        XAIService.generate_explanation(
            triage_result=result,
            method="SHAP",
            user=user or session.user,
            ip_address=ip_address,
        )

        return result

    @staticmethod
    def save_image_analysis(
        session: TriageSession,
        image,
        original_filename: str = "",
        classification: str = "",
        classification_confidence: float = None,
        vision_model_version: str = "",
        analysis_metadata: dict = None,
    ) -> ImageAnalysis:
        """Persist image analysis result."""
        return ImageAnalysis.objects.create(
            session=session,
            image=image,
            original_filename=original_filename,
            classification=classification,
            classification_confidence=classification_confidence,
            vision_model_version=vision_model_version,
            analysis_metadata=analysis_metadata or {},
            created_by=session.user,
        )

    @staticmethod
    def get_user_sessions(user, limit: int = 20):
        """Retrieve a user's triage sessions with results."""
        return (
            TriageSession.objects.filter(user=user, is_deleted=False)
            .select_related("result")
            .prefetch_related("images")
            .order_by("-created_at")[:limit]
        )

    @staticmethod
    def get_session_detail(session_id: str, user):
        """Retrieve a single session with full results and images."""
        return (
            TriageSession.objects.filter(
                id=session_id, user=user, is_deleted=False
            )
            .select_related("result")
            .prefetch_related("images")
            .first()
        )

    @staticmethod
    def mark_failed(session: TriageSession, error_info: str = ""):
        """Mark a session as failed."""
        session.status = TriageSession.Status.FAILED
        session.save(update_fields=["status", "updated_at"])

        AuditService.log_action(
            user_id=str(session.user_id),
            action="TRIAGE_SESSION_FAILED",
            resource_type="TriageSession",
            resource_id=str(session.id),
            changes={"error": error_info},
        )

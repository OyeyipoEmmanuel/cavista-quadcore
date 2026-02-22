from django.utils import timezone

from apps.audit.services.audit_service import AuditService
from apps.consent.models.consent import ConsentRecord


class ConsentService:
    """
    Business logic for consent management.
    Handles granting, revoking, and checking consent validity.
    """

    @staticmethod
    def grant_consent(
        user,
        consent_type: str,
        ip_address: str = None,
        electronic_signature: str = "",
        expires_at=None,
        version: str = "1.0",
    ) -> ConsentRecord:
        """Grant a new consent record for a user."""
        consent = ConsentRecord.objects.create(
            user=user,
            consent_type=consent_type,
            ip_address=ip_address,
            electronic_signature=electronic_signature,
            expires_at=expires_at,
            version=version,
        )

        AuditService.log_action(
            user_id=str(user.id),
            action="CONSENT_GRANT",
            resource_type="ConsentRecord",
            resource_id=str(consent.id),
            ip_address=ip_address,
            changes={"consent_type": consent_type, "version": version},
            electronic_signature=electronic_signature,
        )

        return consent

    @staticmethod
    def revoke_consent(consent_id: str, user, ip_address: str = None) -> ConsentRecord:
        """Revoke a consent record."""
        try:
            consent = ConsentRecord.objects.get(id=consent_id, user=user)
        except ConsentRecord.DoesNotExist:
            raise ValueError("Consent record not found.")

        if consent.revoked_at is not None:
            raise ValueError("Consent has already been revoked.")

        consent.revoke()

        AuditService.log_action(
            user_id=str(user.id),
            action="CONSENT_REVOKE",
            resource_type="ConsentRecord",
            resource_id=str(consent.id),
            ip_address=ip_address,
            changes={"revoked_at": consent.revoked_at.isoformat()},
        )

        return consent

    @staticmethod
    def check_consent(user, consent_type: str) -> bool:
        """Check if user has active consent of the given type."""
        from django.db.models import Q

        now = timezone.now()
        return ConsentRecord.objects.filter(
            user=user,
            consent_type=consent_type,
            revoked_at__isnull=True,
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=now)
        ).exists()

    @staticmethod
    def get_user_consents(user):
        """Get all consent records for a user."""
        return ConsentRecord.objects.filter(user=user)

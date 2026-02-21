import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.common.encryption import EncryptedCharField, EncryptedTextField


class ConsentRecord(models.Model):
    """
    Time-bound consent record supporting HIPAA, GDPR, and trial consent.
    Revocable with cryptographic signature support.
    """

    class ConsentType(models.TextChoices):
        HIPAA = "HIPAA", "HIPAA"
        GDPR = "GDPR", "GDPR"
        TRIAL = "TRIAL", "Clinical Trial"
        DATA_SHARING = "DATA_SHARING", "Data Sharing"
        TERMS_OF_SERVICE = "TOS", "Terms of Service"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="consents",
        db_index=True,
    )
    consent_type = models.CharField(
        max_length=20,
        choices=ConsentType.choices,
        db_index=True,
    )
    granted_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True, db_index=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    ip_address = EncryptedCharField(max_length=45, null=True, blank=True)
    electronic_signature = EncryptedTextField(blank=True, default="")
    version = models.CharField(max_length=20, default="1.0")

    class Meta:
        db_table = "consent_records"
        ordering = ["-granted_at"]
        indexes = [
            models.Index(fields=["user", "consent_type"]),
            models.Index(fields=["expires_at"]),
        ]

    def __str__(self):
        return f"{self.consent_type} consent for {self.user_id}"

    @property
    def is_active(self):
        """Check if consent is currently valid (not revoked, not expired)."""
        if self.revoked_at is not None:
            return False
        if self.expires_at and self.expires_at < timezone.now():
            return False
        return True

    def revoke(self):
        """Revoke this consent record."""
        self.revoked_at = timezone.now()
        self.save(update_fields=["revoked_at"])

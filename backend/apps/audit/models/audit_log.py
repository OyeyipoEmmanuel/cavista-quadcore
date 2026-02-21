import uuid

from django.db import models

from apps.common.encryption import EncryptedCharField, EncryptedTextField


class AuditLog(models.Model):
    """
    Immutable audit log.
    Write-only — no update or delete operations allowed.
    Tracks every data mutation, login, and logout in the system.
    """

    class Action(models.TextChoices):
        CREATE = "CREATE", "Create"
        UPDATE = "UPDATE", "Update"
        DELETE = "DELETE", "Delete"
        LOGIN = "LOGIN", "Login"
        LOGOUT = "LOGOUT", "Logout"
        CONSENT_GRANT = "CONSENT_GRANT", "Consent Grant"
        CONSENT_REVOKE = "CONSENT_REVOKE", "Consent Revoke"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    user_id = models.UUIDField(db_index=True)
    action = models.CharField(max_length=20, choices=Action.choices, db_index=True)
    resource_type = models.CharField(max_length=100, db_index=True)
    resource_id = models.CharField(max_length=255, db_index=True)
    ip_address = EncryptedCharField(max_length=45, null=True, blank=True)
    user_agent = EncryptedTextField(blank=True, default="")
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    changes = models.JSONField(default=dict, blank=True)
    electronic_signature = EncryptedTextField(blank=True, default="")

    class Meta:
        db_table = "audit_logs"
        ordering = ["-timestamp"]
        # Prevent any modifications via Django ORM
        managed = True

    def __str__(self):
        return f"[{self.timestamp}] {self.action} on {self.resource_type} by {self.user_id}"

    def save(self, *args, **kwargs):
        """Override save to prevent updates on existing records."""
        if self.pk and AuditLog.objects.filter(pk=self.pk).exists():
            raise ValueError("Audit logs are immutable and cannot be updated.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """Override delete to prevent deletion."""
        raise ValueError("Audit logs are immutable and cannot be deleted.")

from django.db import models

from apps.common.encryption import EncryptedCharField, EncryptedTextField


class AuditMixin(models.Model):
    """
    Mixin to add audit-related metadata to models.
    Intended to be used alongside BaseModel for models that require
    explicit audit trail fields beyond the standard created_by/updated_by.
    """

    ip_address = EncryptedCharField(max_length=45, null=True, blank=True)
    user_agent = EncryptedTextField(blank=True, default="")

    class Meta:
        abstract = True

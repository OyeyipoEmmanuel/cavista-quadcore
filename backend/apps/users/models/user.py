import uuid

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models

from apps.common.encryption import EncryptedCharField
from apps.users.models.manager import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model.
    Uses email as the authentication identifier instead of username.
    Supports role-based access for PATIENT, CLINICIAN, SPONSOR, and ADMIN.
    """

    class Role(models.TextChoices):
        PATIENT = "PATIENT", "Patient"
        CLINICIAN = "CLINICIAN", "Clinician"
        SPONSOR = "SPONSOR", "Sponsor"
        ADMIN = "ADMIN", "Admin"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    email = models.EmailField(unique=True, db_index=True)
    first_name = EncryptedCharField(max_length=150)
    last_name = EncryptedCharField(max_length=150)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.PATIENT,
        db_index=True,
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    mfa_enabled = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        db_table = "users"
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["-date_joined"]

    def __str__(self):
        return f"{self.email} ({self.role})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

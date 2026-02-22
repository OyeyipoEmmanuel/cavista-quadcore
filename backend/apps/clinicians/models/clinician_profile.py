from django.conf import settings
from django.db import models
from apps.common.models.base import BaseModel

class ClinicianProfile(BaseModel):
    """
    Profile information for clinicians, extending the base User model.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="clinician_profile",
        limit_choices_to={"role": "CLINICIAN"}
    )
    specialty = models.CharField(max_length=100)
    license_number = models.CharField(max_length=50, unique=True)
    bio = models.TextField(blank=True)
    is_available = models.BooleanField(default=True)

    class Meta:
        db_table = "clinician_profiles"
        verbose_name = "Clinician Profile"
        verbose_name_plural = "Clinician Profiles"

    def __str__(self):
        return f"Dr. {self.user.last_name} - {self.specialty}"

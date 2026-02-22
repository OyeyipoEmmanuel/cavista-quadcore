from django.contrib import admin
from apps.clinicians.models.clinician_profile import ClinicianProfile
from apps.clinicians.models.appointment import Appointment

@admin.register(ClinicianProfile)
class ClinicianProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "specialty", "license_number", "is_available", "created_at")
    search_fields = ("user__email", "user__last_name", "specialty", "license_number")
    list_filter = ("is_available", "specialty")

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "get_clinician", "scheduled_at", "status", "created_at")
    list_filter = ("status", "scheduled_at")
    search_fields = ("patient__email", "clinician__user__last_name")

    def get_clinician(self, obj):
        return str(obj.clinician)
    get_clinician.short_description = "Clinician"

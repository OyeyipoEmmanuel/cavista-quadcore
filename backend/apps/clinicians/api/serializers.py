from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.clinicians.models.clinician_profile import ClinicianProfile
from apps.clinicians.models.appointment import Appointment

User = get_user_model()

class UserMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "full_name", "email"]

class ClinicianProfileSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)
    
    class Meta:
        model = ClinicianProfile
        fields = ["id", "user", "specialty", "bio", "is_available"]

class AppointmentSerializer(serializers.ModelSerializer):
    patient = UserMinimalSerializer(read_only=True)
    clinician = ClinicianProfileSerializer(read_only=True)
    clinician_id = serializers.UUIDField(write_only=True)
    triage_session_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = Appointment
        fields = [
            "id", "patient", "clinician", "clinician_id", 
            "triage_session_id", "status", "scheduled_at", 
            "notes", "created_at"
        ]
        read_only_fields = ["id", "patient", "clinician", "status", "created_at"]

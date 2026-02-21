from django.urls import path

from apps.triage.api.views import (
    ImageUploadView,
    TriageInferenceView,
    TriageResultCreateView,
    TriageSessionDetailView,
    TriageSessionListCreateView,
)

urlpatterns = [
    path("sessions/", TriageSessionListCreateView.as_view(), name="triage-sessions"),
    path("sessions/<uuid:session_id>/", TriageSessionDetailView.as_view(), name="triage-session-detail"),
    path("results/", TriageResultCreateView.as_view(), name="triage-result-create"),
    path("inference/", TriageInferenceView.as_view(), name="triage-inference"),
    path("images/", ImageUploadView.as_view(), name="triage-image-upload"),
]

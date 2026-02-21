from django.urls import path

from apps.records.api.views import (
    MedicalContextView,
    MedicalDocumentListView,
    MedicalDocumentUploadView,
    MedicalRecordDetailView,
    MedicalRecordListCreateView,
)

urlpatterns = [
    path("", MedicalRecordListCreateView.as_view(), name="records-list-create"),
    path("<uuid:record_id>/", MedicalRecordDetailView.as_view(), name="record-detail"),
    path("documents/", MedicalDocumentListView.as_view(), name="documents-list"),
    path("documents/upload/", MedicalDocumentUploadView.as_view(), name="document-upload"),
    path("context/", MedicalContextView.as_view(), name="medical-context"),
]

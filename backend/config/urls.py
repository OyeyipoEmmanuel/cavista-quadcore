"""
URL configuration for Cavista AG.
"""

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("apps.users.api.urls")),
    path("api/v1/audit/", include("apps.audit.api.urls")),
    path("api/v1/consent/", include("apps.consent.api.urls")),
    path("api/v1/triage/", include("apps.triage.api.urls")),
    path("api/v1/records/", include("apps.records.api.urls")),
]
